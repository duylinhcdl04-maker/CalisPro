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
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Trang Tổng quan lấy từ dữ liệu thật: người dùng mới không có số liệu nào (không điền số mẫu); có buổi tập và check-in thì
 * tuần của chu kỳ, kỷ lục cá nhân, điểm sẵn sàng và nhận xét đều tính đúng từ dữ liệu đó.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class HomeFlowTest {
    private static final String PASSWORD = "Test#12345x";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    private final List<Long> userIds = new ArrayList<>();
    private long ex1, ex2;
    private String ex1Name, ex2Name;

    /** Cấu hình Jackson bỏ trường null nên trường rỗng vắng mặt trong JSON. */
    private static boolean absent(JsonNode n) { return n.isMissingNode() || n.isNull(); }

    private record Resp(int status, JsonNode body) {}

    private Resp call(String method, String path, String tok, Object body) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json");
        if (tok != null) b.header("Authorization", "Bearer " + tok);
        b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        HttpResponse<String> r = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body() == null || r.body().isBlank() ? JSON.createObjectNode() : JSON.readTree(r.body()));
    }

    private long newUser() {
        User u = new User();
        u.setEmail("home+" + UUID.randomUUID() + "@example.test"); u.setPasswordHash(encoder.encode(PASSWORD));
        u.setRole(Role.USER); u.setStatus(UserStatus.ACTIVE); u.setEmailVerified(true);
        users.save(u);
        userIds.add(u.getId());
        return u.getId();
    }

    private String login(long userId) throws Exception {
        String email = jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, userId);
        Resp r = call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD));
        assertEquals(200, r.status(), r.body().toString());
        return r.body().path("accessToken").asString();
    }

    @BeforeEach
    void setUp() {
        List<Map<String, Object>> exercises = jdbc.queryForList("SELECT id, name FROM exercises ORDER BY id LIMIT 2");
        Assumptions.assumeTrue(exercises.size() == 2, "DB scratch chưa có bài tập");
        ex1 = ((Number) exercises.get(0).get("id")).longValue(); ex1Name = (String) exercises.get(0).get("name");
        ex2 = ((Number) exercises.get(1).get("id")).longValue(); ex2Name = (String) exercises.get(1).get("name");
    }

    @AfterEach
    void cleanUp() {
        for (Long u : userIds) {
            jdbc.update("DELETE FROM exp_events WHERE user_id = ?", u);
            jdbc.update("DELETE FROM daily_checkins WHERE user_id = ?", u);
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

    private Map<String, Object> checkin(LocalDate date, Object energy, Object sleep, Object soreness, Object stress) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("checkinDate", date.toString()); m.put("sleepHours", sleep); m.put("energyLevel", energy); m.put("stressLevel", stress);
        m.put("muscleSoreness", soreness); m.put("motivationLevel", 4);
        return m;
    }

    /** Giáo án hệ thống 2 buổi (cùng tuần 1). Trả về {planId, day1, day2}. */
    private long[] plan(long userId) {
        jdbc.update("INSERT INTO workout_plans (user_id, name, status, start_date, end_date, version, cycle_number, created_at, updated_at) VALUES (?, 'Chu kỳ thử', 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1, 1, NOW(6), NOW(6))", userId);
        long planId = jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1", Long.class, userId);
        long[] days = new long[2];
        for (int n = 1; n <= 2; n++) {
            jdbc.update("INSERT INTO workout_plan_days (workout_plan_id, day_number, name, rest_day, week_number) VALUES (?, ?, ?, 0, 1)", planId, n, "Buổi " + n);
            days[n - 1] = jdbc.queryForObject("SELECT id FROM workout_plan_days WHERE workout_plan_id = ? AND day_number = ?", Long.class, planId, n);
            jdbc.update("INSERT INTO workout_plan_exercises (workout_plan_day_id, exercise_id, sequence_no, sets, target_reps_min, target_reps_max, rest_seconds, section_type) VALUES (?, ?, 1, 2, 8, 12, 60, 'MAIN')", days[n - 1], ex1);
            jdbc.update("INSERT INTO workout_plan_exercises (workout_plan_day_id, exercise_id, sequence_no, sets, target_duration_sec, rest_seconds, section_type) VALUES (?, ?, 2, 1, 20, 30, 'COOLDOWN')", days[n - 1], ex2);
        }
        return new long[]{planId, days[0], days[1]};
    }

    private void finishSession(String token, long planId, long dayId, int reps) throws Exception {
        long session = call("POST", "/api/v1/me/training-sessions", token, Map.of("planId", planId, "dayId", dayId)).body().path("sessionId").asLong();
        List<Map<String, Object>> sets1 = List.of(
                Map.of("setNumber", 1, "reps", reps, "restSeconds", 60, "source", "MANUAL"), Map.of("setNumber", 2, "reps", reps, "restSeconds", 60, "source", "MANUAL"));
        List<Map<String, Object>> sets2 = List.of(Map.of("setNumber", 1, "durationSeconds", 20, "restSeconds", 30, "source", "MANUAL"));
        Resp r = call("PUT", "/api/v1/me/training-sessions/" + session + "/finish", token, Map.of("status", "COMPLETED", "durationSeconds", 1800,
                "exercises", List.of(Map.of("exerciseId", ex1, "plannedSets", 2, "sets", sets1), Map.of("exerciseId", ex2, "plannedSets", 1, "sets", sets2))));
        assertEquals("COMPLETED", r.body().path("status").asString(), r.body().toString());
    }

    @Test
    void aNewUserSeesNoInventedNumbers() throws Exception {
        String t = login(newUser());
        Resp r = call("GET", "/api/v1/me/home", t, null);
        assertEquals(200, r.status(), r.body().toString());
        JsonNode h = r.body();
        assertEquals("NO_PLAN", h.path("today").path("state").asString());
        assertTrue(absent(h.path("cycle")), "chưa có chu kỳ thì không có tuần N/M");
        assertTrue(absent(h.path("week")));
        assertTrue(absent(h.path("readiness")), "chưa check-in thì không có điểm sẵn sàng");
        assertEquals(0, h.path("records").size());
        assertEquals(0, h.path("streakDays").asInt());
        assertFalse(h.path("checkedInToday").asBoolean());
    }

    @Test
    void realSessionsAndCheckinFeedTheWeekRecordsReadinessAndInsight() throws Exception {
        long u = newUser();
        String t = login(u);
        long[] plan = plan(u);
        assertEquals(200, call("POST", "/api/v1/daily-checkins", t, checkin(LocalDate.now(), 4, 7.5, 2, 2)).status());
        finishSession(t, plan[0], plan[1], 10);
        finishSession(t, plan[0], plan[2], 12);

        JsonNode h = call("GET", "/api/v1/me/home", t, null).body();

        JsonNode rd = h.path("readiness");
        assertEquals(81, rd.path("score").asInt());
        assertEquals("GOOD", rd.path("level").asString());
        assertTrue(rd.path("today").asBoolean());
        assertEquals(4, rd.path("energy").asInt());
        assertTrue(h.path("checkedInToday").asBoolean());

        assertEquals(1, h.path("cycle").path("weekIndex").asInt());
        assertEquals(1, h.path("cycle").path("weeksTotal").asInt(), "số tuần lấy từ các buổi của giáo án");
        assertEquals(2, h.path("cycle").path("sessionsDone").asInt());
        assertEquals(2, h.path("week").path("completedWorkouts").asInt());
        assertEquals(2, h.path("week").path("plannedWorkouts").asInt());
        assertEquals(60, h.path("week").path("totalMinutes").asInt(), "2 buổi × 30 phút");
        assertEquals("CYCLE_DONE", h.path("today").path("state").asString());

        Map<String, JsonNode> byName = new HashMap<>();
        h.path("records").forEach(r -> byName.put(r.path("exercise").asString(), r));
        JsonNode reps = byName.get(ex1Name), hold = byName.get(ex2Name);
        assertNotNull(reps, h.path("records").toString());
        assertEquals("12", reps.path("value").asString(), "kỷ lục là hiệp tốt nhất, không phải hiệp gần nhất");
        assertEquals("reps", reps.path("unit").asString());
        assertEquals("up", reps.path("trend").asString());
        assertEquals("+2 so với kỷ lục trước", reps.path("changeLabel").asString());
        assertNotNull(hold);
        assertEquals("0:20", hold.path("value").asString(), "bài giữ tư thế tính theo giây, hiển thị m:ss");
        assertEquals("", hold.path("unit").asString());
        assertEquals("Kỷ lục đầu tiên", hold.path("changeLabel").asString());

        assertTrue(h.path("insight").path("headline").asString().contains("kỷ lục mới"), h.path("insight").toString());
    }

    @Test
    void readinessIgnoresStaleCheckins_andPartialCheckinsAreNotPenalised() throws Exception {
        long u = newUser();
        String t = login(u);
        call("POST", "/api/v1/daily-checkins", t, checkin(LocalDate.now().minusDays(5), 5, 8.0, 1, 1));
        assertTrue(absent(call("GET", "/api/v1/me/home", t, null).body().path("readiness")), "check-in 5 ngày trước không phản ánh hôm nay");

        Map<String, Object> onlyEnergy = checkin(LocalDate.now(), 5, null, null, null);
        assertEquals(200, call("POST", "/api/v1/daily-checkins", t, onlyEnergy).status());
        JsonNode rd = call("GET", "/api/v1/me/home", t, null).body().path("readiness");
        assertEquals(100, rd.path("score").asInt(), "chỉ khai năng lượng tối đa thì không bị trừ vì thiếu các chỉ số khác");
    }

    @Test
    void homeRequiresLogin() throws Exception {
        assertEquals(401, call("GET", "/api/v1/me/home", null, null).status());
    }
}
