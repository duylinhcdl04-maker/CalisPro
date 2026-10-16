package com.calishealth.api;

import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.service.EmailService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Trang luyện tập: buổi tập hôm nay lấy từ giáo án đang tập, bắt đầu và kết thúc buổi.
 * Buổi chỉ được tính khi làm từ 60% số hiệp; buổi được tính thì ngày tập kế tiếp của chu kỳ mới xuất hiện.
 * Dọn dữ liệu: user và giáo án tạo ra bị xóa cùng các bảng con.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class TrainingSessionFlowTest {
    private static final String PASSWORD = "Test#12345x";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    private final List<Long> userIds = new ArrayList<>();
    private long planId, day1, day2, ex1, ex2;
    private String token, otherToken;

    private record Resp(int status, JsonNode body) {}

    private Resp call(String method, String path, String tok, Object body) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json");
        if (tok != null) b.header("Authorization", "Bearer " + tok);
        b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        HttpResponse<String> r = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body() == null || r.body().isBlank() ? JSON.createObjectNode() : JSON.readTree(r.body()));
    }

    private String createUser() throws Exception {
        User u = new User();
        u.setEmail("train+" + UUID.randomUUID() + "@example.test"); u.setPasswordHash(encoder.encode(PASSWORD));
        u.setRole(Role.USER); u.setStatus(UserStatus.ACTIVE); u.setEmailVerified(true);
        users.save(u);
        userIds.add(u.getId());
        Resp r = call("POST", "/api/v1/auth/login", null, Map.of("email", u.getEmail(), "password", PASSWORD));
        assertEquals(200, r.status(), r.body().toString());
        return r.body().path("accessToken").asString();
    }

    @BeforeEach
    void setUp() throws Exception {
        token = createUser();
        otherToken = createUser();
        long userId = userIds.get(0);
        List<Long> exercises = jdbc.queryForList("SELECT id FROM exercises ORDER BY id LIMIT 2", Long.class);
        Assumptions.assumeTrue(exercises.size() == 2, "DB scratch chưa có bài tập");
        ex1 = exercises.get(0); ex2 = exercises.get(1);
        jdbc.update("INSERT INTO workout_plans (user_id, name, status, start_date, end_date, version, created_at, updated_at) VALUES (?, 'Chu kỳ thử', 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 28 DAY), 1, NOW(6), NOW(6))", userId);
        planId = jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1", Long.class, userId);
        day1 = insertDay("Buổi A", 1);
        day2 = insertDay("Buổi B", 2);
        for (long day : new long[]{day1, day2}) {
            jdbc.update("INSERT INTO workout_plan_exercises (workout_plan_day_id, exercise_id, sequence_no, sets, target_reps_min, target_reps_max, rest_seconds, section_type) VALUES (?, ?, 1, 3, 8, 12, 60, 'MAIN')", day, ex1);
            jdbc.update("INSERT INTO workout_plan_exercises (workout_plan_day_id, exercise_id, sequence_no, sets, target_duration_sec, rest_seconds, section_type) VALUES (?, ?, 2, 1, 20, 30, 'COOLDOWN')", day, ex2);
        }
    }

    private long insertDay(String name, int number) {
        jdbc.update("INSERT INTO workout_plan_days (workout_plan_id, day_number, name, rest_day, week_number) VALUES (?, ?, ?, 0, 1)", planId, number, name);
        return jdbc.queryForObject("SELECT id FROM workout_plan_days WHERE workout_plan_id = ? AND day_number = ?", Long.class, planId, number);
    }

    @AfterEach
    void cleanUp() {
        for (Long u : userIds) {
            jdbc.update("DELETE FROM exercise_sets WHERE workout_session_exercise_id IN (SELECT id FROM workout_session_exercises WHERE workout_session_id IN (SELECT id FROM workout_sessions WHERE user_id = ?))", u);
            jdbc.update("DELETE FROM workout_session_exercises WHERE workout_session_id IN (SELECT id FROM workout_sessions WHERE user_id = ?)", u);
            jdbc.update("DELETE FROM user_skill_progress WHERE user_id = ?", u);
            jdbc.update("DELETE FROM workout_sessions WHERE user_id = ?", u);
            jdbc.update("DELETE FROM workout_plan_exercises WHERE workout_plan_day_id IN (SELECT d.id FROM workout_plan_days d JOIN workout_plans p ON p.id = d.workout_plan_id WHERE p.user_id = ?)", u);
            jdbc.update("DELETE FROM workout_plan_days WHERE workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = ?)", u);
            jdbc.update("DELETE FROM workout_plans WHERE user_id = ?", u);
            jdbc.update("DELETE FROM users WHERE id = ?", u);
        }
        userIds.clear();
    }

    private Map<String, Object> exerciseResult(long exerciseId, int planned, int doneSets) {
        List<Map<String, Object>> sets = new ArrayList<>();
        for (int i = 1; i <= doneSets; i++) sets.add(Map.of("setNumber", i, "reps", 10, "restSeconds", 60, "source", "MANUAL"));
        return Map.of("exerciseId", exerciseId, "plannedSets", planned, "sets", sets);
    }

    @Test
    void todayShowsThePrescribedDayAndAdvancesOnlyWhenASessionIsCompleted() throws Exception {
        Resp today = call("GET", "/api/v1/me/today-workout", token, null);
        assertEquals(200, today.status(), today.body().toString());
        assertEquals("READY", today.body().path("state").asString());
        assertEquals(day1, today.body().path("dayId").asLong());
        JsonNode first = today.body().path("exercises").get(0);
        assertEquals(3, first.path("sets").asInt());
        assertEquals(60, first.path("restSec").asInt());
        assertEquals(8, first.path("repMin").asInt());
        assertEquals(20, today.body().path("exercises").get(1).path("holdSec").asInt());
        assertEquals(0, today.body().path("sessionsDone").asInt());
        assertEquals(2, today.body().path("sessionsPlanned").asInt());

        Resp start = call("POST", "/api/v1/me/training-sessions", token, Map.of("planId", planId, "dayId", day1));
        assertEquals(201, start.status(), start.body().toString());
        long session = start.body().path("sessionId").asLong();
        Resp again = call("POST", "/api/v1/me/training-sessions", token, Map.of("planId", planId, "dayId", day1));
        assertTrue(again.body().path("resumed").asBoolean());
        assertEquals(session, again.body().path("sessionId").asLong());
        assertEquals(session, call("GET", "/api/v1/me/today-workout", token, null).body().path("activeSessionId").asLong());

        // mới làm 1 trên 4 hiệp: chưa tính
        Resp partial = call("PUT", "/api/v1/me/training-sessions/" + session + "/finish", token, Map.of("status", "COMPLETED", "durationSeconds", 300,
                "exercises", List.of(exerciseResult(ex1, 3, 1))));
        assertEquals(200, partial.status(), partial.body().toString());
        assertEquals("ABANDONED", partial.body().path("status").asString());
        assertEquals(day1, call("GET", "/api/v1/me/today-workout", token, null).body().path("dayId").asLong(), "buổi chưa được tính thì vẫn là ngày tập cũ");
        assertEquals(409, call("PUT", "/api/v1/me/training-sessions/" + session + "/finish", token, Map.of("status", "COMPLETED", "exercises", List.of())).status(), "buổi đã đóng không ghi đè được");

        long second = call("POST", "/api/v1/me/training-sessions", token, Map.of("planId", planId, "dayId", day1)).body().path("sessionId").asLong();
        Resp full = call("PUT", "/api/v1/me/training-sessions/" + second + "/finish", token, Map.of("status", "COMPLETED", "durationSeconds", 1800, "difficultyRating", 3,
                "exercises", List.of(exerciseResult(ex1, 3, 3), exerciseResult(ex2, 1, 1))));
        assertEquals("COMPLETED", full.body().path("status").asString(), full.body().toString());
        assertEquals(4, full.body().path("completedSets").asInt());
        assertEquals(1.0, full.body().path("completionRatio").asDouble(), 0.001);

        Resp next = call("GET", "/api/v1/me/today-workout", token, null);
        assertEquals(day2, next.body().path("dayId").asLong());
        assertEquals(1, next.body().path("sessionsDone").asInt());

        call("PUT", "/api/v1/me/training-sessions/" + call("POST", "/api/v1/me/training-sessions", token, Map.of("planId", planId, "dayId", day2)).body().path("sessionId").asLong() + "/finish",
                token, Map.of("status", "COMPLETED", "exercises", List.of(exerciseResult(ex1, 3, 3), exerciseResult(ex2, 1, 1))));
        Resp done = call("GET", "/api/v1/me/today-workout", token, null);
        assertEquals("CYCLE_DONE", done.body().path("state").asString());
    }

    @Test
    void aSessionOfAnotherUserCannotBeTouched() throws Exception {
        long session = call("POST", "/api/v1/me/training-sessions", token, Map.of("planId", planId, "dayId", day1)).body().path("sessionId").asLong();
        assertEquals(400, call("PUT", "/api/v1/me/training-sessions/" + session + "/finish", otherToken, Map.of("status", "COMPLETED", "exercises", List.of())).status());
        assertEquals(400, call("POST", "/api/v1/me/training-sessions", otherToken, Map.of("planId", planId, "dayId", day1)).status(), "giáo án của người khác không bắt đầu được");
    }

    @Test
    void withoutAPlanTheStateExplainsWhatToDoNext() throws Exception {
        Resp r = call("GET", "/api/v1/me/today-workout", otherToken, null);
        assertEquals(200, r.status());
        assertEquals("NO_PLAN", r.body().path("state").asString());
        assertFalse(r.body().path("message").asString().isBlank());
    }
}
