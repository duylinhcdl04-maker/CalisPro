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
 * Cờ "tích hợp AI" của động tác: chỉ khi Coach bật VÀ bài có cấu hình đo thì học viên mới có AI Coach (trang chi tiết) và AI ở trang luyện tập.
 * Test đổi cờ ai_enabled của một bài trong DB test và luôn khôi phục lại giá trị ban đầu.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class ExerciseAiGateFlowTest {
    private static final String PASSWORD = "Test#12345x";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    private Long userId;
    private String token;
    private long configured = -1, original;
    private long unconfigured = -1;

    private record Resp(int status, JsonNode body) {}

    private Resp call(String method, String path, Object body) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json");
        if (token != null) b.header("Authorization", "Bearer " + token);
        b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        HttpResponse<String> r = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body() == null || r.body().isBlank() ? JSON.createObjectNode() : JSON.readTree(r.body()));
    }

    @BeforeEach
    void setUp() throws Exception {
        User u = new User();
        u.setEmail("aigate+" + UUID.randomUUID() + "@example.test"); u.setPasswordHash(encoder.encode(PASSWORD));
        u.setRole(Role.USER); u.setStatus(UserStatus.ACTIVE); u.setEmailVerified(true);
        users.save(u);
        userId = u.getId();
        Resp login = call("POST", "/api/v1/auth/login", Map.of("email", u.getEmail(), "password", PASSWORD));
        assertEquals(200, login.status(), login.body().toString());
        token = login.body().path("accessToken").asString();
        // bài đã cấu hình đo đầy đủ (có profile hợp lệ) và một bài chưa có profile nào
        List<Long> ok = jdbc.queryForList("""
                SELECT e.id FROM exercises e JOIN exercise_ai_profiles p ON p.exercise_id = e.id
                WHERE p.movement_type IS NOT NULL AND p.rep_top_threshold IS NOT NULL AND p.rep_bottom_threshold IS NOT NULL
                  AND p.rep_metric_json IS NOT NULL AND JSON_VALID(p.rep_metric_json) AND JSON_LENGTH(JSON_EXTRACT(p.rep_metric_json, '$.points')) >= 3 LIMIT 1""", Long.class);
        Assumptions.assumeTrue(!ok.isEmpty(), "DB scratch chưa có bài nào được cấu hình đo AI");
        configured = ok.get(0);
        original = jdbc.queryForObject("SELECT ai_enabled FROM exercises WHERE id = ?", Long.class, configured);
        List<Long> none = jdbc.queryForList("""
                SELECT e.id FROM exercises e WHERE NOT EXISTS (SELECT 1 FROM exercise_ai_profiles p WHERE p.exercise_id = e.id
                  AND p.movement_type IS NOT NULL AND p.rep_top_threshold IS NOT NULL AND p.rep_bottom_threshold IS NOT NULL
                  AND p.rep_metric_json IS NOT NULL AND JSON_VALID(p.rep_metric_json) AND JSON_LENGTH(JSON_EXTRACT(p.rep_metric_json, '$.points')) >= 3) LIMIT 1""", Long.class);
        if (!none.isEmpty()) unconfigured = none.get(0);
    }

    @AfterEach
    void cleanUp() {
        if (configured > 0) jdbc.update("UPDATE exercises SET ai_enabled = ? WHERE id = ?", original, configured);
        if (unconfigured > 0) jdbc.update("UPDATE exercises SET ai_enabled = 0 WHERE id = ?", unconfigured);
        if (userId != null) {
            jdbc.update("DELETE FROM exercise_sets WHERE workout_session_exercise_id IN (SELECT id FROM workout_session_exercises WHERE workout_session_id IN (SELECT id FROM workout_sessions WHERE user_id = ?))", userId);
            jdbc.update("DELETE FROM workout_session_exercises WHERE workout_session_id IN (SELECT id FROM workout_sessions WHERE user_id = ?)", userId);
            jdbc.update("DELETE FROM workout_sessions WHERE user_id = ?", userId);
            jdbc.update("DELETE FROM workout_plan_exercises WHERE workout_plan_day_id IN (SELECT d.id FROM workout_plan_days d JOIN workout_plans p ON p.id = d.workout_plan_id WHERE p.user_id = ?)", userId);
            jdbc.update("DELETE FROM workout_plan_days WHERE workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = ?)", userId);
            jdbc.update("DELETE FROM workout_plans WHERE user_id = ?", userId);
            jdbc.update("DELETE FROM users WHERE id = ?", userId);
        }
    }

    @Test
    void aiCoachIsAvailableOnlyWhenTheCoachTurnedItOn() throws Exception {
        jdbc.update("UPDATE exercises SET ai_enabled = 1 WHERE id = ?", configured);
        JsonNode on = call("GET", "/api/v1/exercises/" + configured + "/ai-coach", null).body();
        assertTrue(on.path("ai").path("ready").asBoolean(), on.toString());
        assertTrue(on.path("ai").path("enabled").asBoolean());
        assertTrue(on.path("ai").path("configured").asBoolean());
        assertTrue(on.path("ai").path("metricPoints").size() >= 3);

        jdbc.update("UPDATE exercises SET ai_enabled = 0 WHERE id = ?", configured);
        JsonNode off = call("GET", "/api/v1/exercises/" + configured + "/ai-coach", null).body();
        assertFalse(off.path("ai").path("ready").asBoolean(), "chưa bật thì học viên không có AI dù bài đã cấu hình");
        assertFalse(off.path("ai").path("enabled").asBoolean());
        assertTrue(off.path("ai").path("configured").asBoolean());
        assertTrue(off.path("ai").path("note").asString().contains("chưa được bật"));
    }

    @Test
    void enabledButNotConfiguredIsNotReadyAndSaysWhy() throws Exception {
        Assumptions.assumeTrue(unconfigured > 0, "mọi bài trong DB test đều đã có profile");
        jdbc.update("UPDATE exercises SET ai_enabled = 1 WHERE id = ?", unconfigured);
        JsonNode r = call("GET", "/api/v1/exercises/" + unconfigured + "/ai-coach", null).body();
        assertFalse(r.path("ai").path("ready").asBoolean());
        assertTrue(r.path("ai").path("enabled").asBoolean());
        assertFalse(r.path("ai").path("configured").asBoolean());
        assertTrue(r.path("ai").path("note").asString().contains("chưa có đủ cấu hình"));
    }

    @Test
    void trainingPageAndBuilderFollowTheSameSwitch() throws Exception {
        jdbc.update("INSERT INTO workout_plans (user_id, name, status, start_date, end_date, version, created_at, updated_at) VALUES (?, 'Chu kỳ thử', 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 28 DAY), 1, NOW(6), NOW(6))", userId);
        long planId = jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1", Long.class, userId);
        jdbc.update("INSERT INTO workout_plan_days (workout_plan_id, day_number, name, rest_day, week_number) VALUES (?, 1, 'Buổi A', 0, 1)", planId);
        long dayId = jdbc.queryForObject("SELECT id FROM workout_plan_days WHERE workout_plan_id = ?", Long.class, planId);
        jdbc.update("INSERT INTO workout_plan_exercises (workout_plan_day_id, exercise_id, sequence_no, sets, target_reps_min, target_reps_max, rest_seconds, section_type) VALUES (?, ?, 1, 3, 8, 12, 60, 'MAIN')", dayId, configured);

        jdbc.update("UPDATE exercises SET ai_enabled = 1 WHERE id = ?", configured);
        assertTrue(call("GET", "/api/v1/me/today-workout", null).body().path("exercises").get(0).path("ai").path("ready").asBoolean());
        assertTrue(call("GET", "/api/v1/exercises/ai-readiness", null).body().path(String.valueOf(configured)).path("ready").asBoolean());

        jdbc.update("UPDATE exercises SET ai_enabled = 0 WHERE id = ?", configured);
        assertFalse(call("GET", "/api/v1/me/today-workout", null).body().path("exercises").get(0).path("ai").path("ready").asBoolean(), "tắt cờ thì trang luyện tập quay về tự nhập");
        JsonNode readiness = call("GET", "/api/v1/exercises/ai-readiness", null).body().path(String.valueOf(configured));
        assertFalse(readiness.path("ready").asBoolean());
        assertTrue(readiness.path("configured").asBoolean(), "builder vẫn biết bài đã cấu hình đo, chỉ chưa bật");
    }
}
