package com.calishealth.api;

import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.service.EmailService;
import com.calishealth.api.service.assessmentv2.RuleSetV2Loader;
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
import java.sql.Date;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * EXP chuyên cần: điểm danh = check-in sức khỏe trong ngày, buổi tập hệ thống, tập đúng form, chuỗi 7 ngày.
 * Mỗi sự kiện chỉ tính một lần; check-in bù ngày và buổi tự soạn không có EXP; rule set thiếu tham số thì tính năng tắt.
 * Dọn dữ liệu: user, EXP, buổi tập và các tham số exp.* chèn riêng cho test (source_type TEST_EXP) đều bị xóa.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true",
        "app.assessment-v2.enabled=true", "app.assessment-v2.allow-draft=true"})
class ExpFlowTest {
    private static final String PASSWORD = "Test#12345x";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final Map<String, Double> EXP_PARAMS = new LinkedHashMap<>();
    static {
        EXP_PARAMS.put("exp.enabled", 1.0); EXP_PARAMS.put("exp.checkin", 10.0); EXP_PARAMS.put("exp.session", 40.0); EXP_PARAMS.put("exp.goodForm", 10.0);
        EXP_PARAMS.put("exp.streak7", 30.0); EXP_PARAMS.put("exp.assessment", 50.0); EXP_PARAMS.put("exp.goodForm.minAiShare", 0.6);
        EXP_PARAMS.put("attendance.windowDays", 28.0); EXP_PARAMS.put("attendance.targetExp", 500.0); EXP_PARAMS.put("attendance.minScore", 60.0); EXP_PARAMS.put("attendance.bonusMax", 3.0);
    }

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired RuleSetV2Loader ruleSets;
    @MockitoBean EmailService emailService;

    private final List<Long> userIds = new ArrayList<>();
    private long ruleSetId, ex1, ex2;

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
        u.setEmail("exp+" + UUID.randomUUID() + "@example.test"); u.setPasswordHash(encoder.encode(PASSWORD));
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
        ruleSetId = ruleSets.configuredId();
        List<Long> exercises = jdbc.queryForList("SELECT id FROM exercises ORDER BY id LIMIT 2", Long.class);
        Assumptions.assumeTrue(exercises.size() == 2, "DB scratch chưa có bài tập");
        ex1 = exercises.get(0); ex2 = exercises.get(1);
    }

    private void enableExp() {
        EXP_PARAMS.forEach((k, v) -> jdbc.update("INSERT IGNORE INTO engine_parameters (rule_set_id, param_key, param_value, source_type) VALUES (?, ?, ?, 'TEST_EXP')", ruleSetId, k, v));
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM engine_parameters WHERE source_type = 'TEST_EXP'");
        for (Long u : userIds) {
            jdbc.update("DELETE FROM exp_events WHERE user_id = ?", u);
            jdbc.update("DELETE FROM daily_checkins WHERE user_id = ?", u);
            jdbc.update("DELETE FROM form_analysis WHERE movement_session_id IN (SELECT id FROM movement_sessions WHERE user_id = ?)", u);
            jdbc.update("DELETE FROM movement_sessions WHERE user_id = ?", u);
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

    private Map<String, Object> checkin(LocalDate date) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("checkinDate", date.toString()); m.put("sleepHours", 7.5); m.put("energyLevel", 4); m.put("stressLevel", 2); m.put("muscleSoreness", 2); m.put("motivationLevel", 4);
        return m;
    }

    private JsonNode exp(String token) throws Exception {
        Resp r = call("GET", "/api/v1/me/exp", token, null);
        assertEquals(200, r.status(), r.body().toString());
        return r.body();
    }

    /** Giáo án 1 buổi; selfBuilt=true là danh sách tự soạn của người dùng. Trả về {planId, dayId}. */
    private long[] plan(long userId, boolean selfBuilt) {
        jdbc.update("INSERT INTO workout_plans (user_id, name, status, start_date, end_date, version, generation_reason, created_at, updated_at) VALUES (?, 'Chu kỳ thử', 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 28 DAY), 1, ?, NOW(6), NOW(6))",
                userId, selfBuilt ? "USER_SELF_BUILT" : null);
        long planId = jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1", Long.class, userId);
        jdbc.update("INSERT INTO workout_plan_days (workout_plan_id, day_number, name, rest_day, week_number) VALUES (?, 1, 'Buổi A', 0, 1)", planId);
        long dayId = jdbc.queryForObject("SELECT id FROM workout_plan_days WHERE workout_plan_id = ? AND day_number = 1", Long.class, planId);
        jdbc.update("INSERT INTO workout_plan_exercises (workout_plan_day_id, exercise_id, sequence_no, sets, target_reps_min, target_reps_max, rest_seconds, section_type) VALUES (?, ?, 1, 3, 8, 12, 60, 'MAIN')", dayId, ex1);
        return new long[]{planId, dayId};
    }

    private Resp finishSession(String token, long[] plan, int doneSets, String source, Long movementSessionId) throws Exception {
        long session = call("POST", "/api/v1/me/training-sessions", token, Map.of("planId", plan[0], "dayId", plan[1])).body().path("sessionId").asLong();
        List<Map<String, Object>> sets = new ArrayList<>();
        for (int i = 1; i <= doneSets; i++) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("setNumber", i); s.put("reps", 10); s.put("restSeconds", 60); s.put("source", source);
            if (movementSessionId != null && i == 1) s.put("movementSessionId", movementSessionId);
            sets.add(s);
        }
        return call("PUT", "/api/v1/me/training-sessions/" + session + "/finish", token,
                Map.of("status", "COMPLETED", "durationSeconds", 1800, "exercises", List.of(Map.of("exerciseId", ex1, "plannedSets", 3, "sets", sets))));
    }

    @Test
    void withoutExpParametersTheFeatureIsOff_checkinStillWorks() throws Exception {
        long u = newUser(); String t = login(u);
        assertEquals(200, call("POST", "/api/v1/daily-checkins", t, checkin(LocalDate.now())).status());
        JsonNode e = exp(t);
        assertFalse(e.path("enabled").asBoolean());
        assertEquals(0, e.path("totalExp").asInt());
        assertTrue(e.path("checkedInToday").asBoolean(), "check-in sức khỏe vẫn lưu, chỉ không có EXP");
    }

    @Test
    void dailyCheckinIsTheAttendance_earnedOncePerDay_neverBackdated() throws Exception {
        enableExp();
        long u = newUser(); String t = login(u);
        assertEquals(200, call("POST", "/api/v1/daily-checkins", t, checkin(LocalDate.now())).status());
        assertEquals(10, exp(t).path("totalExp").asInt());
        assertEquals(200, call("POST", "/api/v1/daily-checkins", t, checkin(LocalDate.now())).status());   // gửi lại / sửa trong ngày
        assertEquals(10, exp(t).path("totalExp").asInt(), "một ngày chỉ một lần điểm danh");
        assertEquals(200, call("POST", "/api/v1/daily-checkins", t, checkin(LocalDate.now().minusDays(1))).status());
        JsonNode e = exp(t);
        assertEquals(10, e.path("totalExp").asInt(), "check-in bù ngày không có EXP");
        assertTrue(e.path("enabled").asBoolean());
        assertEquals(1, e.path("streakDays").asInt());
    }

    @Test
    void sevenDayStreakAddsTheBonusOnce() throws Exception {
        enableExp();
        long u = newUser(); String t = login(u);
        for (int d = 6; d >= 1; d--)
            jdbc.update("INSERT INTO exp_events (user_id, event_type, ref_key, points, event_date, created_at) VALUES (?, 'CHECKIN', ?, 10, ?, NOW(6))", u, LocalDate.now().minusDays(d).toString(), Date.valueOf(LocalDate.now().minusDays(d)));
        assertEquals(200, call("POST", "/api/v1/daily-checkins", t, checkin(LocalDate.now())).status());
        JsonNode e = exp(t);
        assertEquals(60 + 10 + 30, e.path("totalExp").asInt());
        assertEquals(7, e.path("streakDays").asInt());
        call("POST", "/api/v1/daily-checkins", t, checkin(LocalDate.now()));
        assertEquals(100, exp(t).path("totalExp").asInt(), "chuỗi không được thưởng lặp");
    }

    @Test
    void completedSystemSessionEarnsExp_selfBuiltAndAbandonedDoNot() throws Exception {
        enableExp();
        long u = newUser(); String t = login(u);
        long[] self = plan(u, true);
        assertEquals("COMPLETED", finishSession(t, self, 3, "MANUAL", null).body().path("status").asString());
        assertEquals(0, exp(t).path("totalExp").asInt(), "giáo án tự soạn là việc cá nhân, không có EXP");

        long[] system = plan(u, false);
        assertEquals("ABANDONED", finishSession(t, system, 1, "MANUAL", null).body().path("status").asString());
        assertEquals(0, exp(t).path("totalExp").asInt(), "buổi chưa đủ 60% hiệp không được tính");

        assertEquals("COMPLETED", finishSession(t, system, 3, "MANUAL", null).body().path("status").asString());
        assertEquals(40, exp(t).path("totalExp").asInt(), "nhập tay: có EXP hoàn thành buổi, chưa có thưởng tập đúng");
    }

    @Test
    void goodFormBonusNeedsEnoughAiSetsAndFormAboveTheStandard() throws Exception {
        enableExp();
        long u = newUser(); String t = login(u);
        long[] system = plan(u, false);
        jdbc.update("INSERT INTO movement_sessions (exercise_id, user_id, processing_status, created_at) VALUES (?, ?, 'COMPLETED', NOW(6))", ex1, u);
        long ms = jdbc.queryForObject("SELECT id FROM movement_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 1", Long.class, u);
        jdbc.update("INSERT INTO form_analysis (movement_session_id, overall_score, analysis_version, created_at) VALUES (?, 82, 'test', NOW(6))", ms);
        assertEquals("COMPLETED", finishSession(t, system, 3, "AI", ms).body().path("status").asString());
        assertEquals(50, exp(t).path("totalExp").asInt(), "40 hoàn thành buổi + 10 tập đúng (3/3 hiệp do AI đo, form 82 ≥ 75)");

        long[] low = plan(u, false);
        jdbc.update("INSERT INTO movement_sessions (exercise_id, user_id, processing_status, created_at) VALUES (?, ?, 'COMPLETED', NOW(6))", ex1, u);
        long ms2 = jdbc.queryForObject("SELECT id FROM movement_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 1", Long.class, u);
        jdbc.update("INSERT INTO form_analysis (movement_session_id, overall_score, analysis_version, created_at) VALUES (?, 60, 'test', NOW(6))", ms2);
        finishSession(t, low, 3, "AI", ms2);
        assertEquals(90, exp(t).path("totalExp").asInt(), "form 60 < 75: chỉ có EXP hoàn thành buổi, không bị trừ");

        long[] fewAi = plan(u, false);
        finishSession(t, fewAi, 3, "MANUAL", null);
        assertEquals(130, exp(t).path("totalExp").asInt(), "không có hiệp AI: không có thưởng tập đúng, cũng không bị trừ");
    }

    @Test
    void attendanceScoreIsCappedAndComparedWithTheGate() throws Exception {
        enableExp();
        long u = newUser(); String t = login(u);
        JsonNode none = exp(t);
        assertEquals(0.0, none.path("attendanceScore").asDouble(), 0.001);
        assertFalse(none.path("gatePassed").asBoolean());

        jdbc.update("INSERT INTO exp_events (user_id, event_type, ref_key, points, event_date, created_at) VALUES (?, 'SESSION', 'a', 300, CURDATE(), NOW(6))", u);
        JsonNode sixty = exp(t);
        assertEquals(60.0, sixty.path("attendanceScore").asDouble(), 0.001);
        assertTrue(sixty.path("gatePassed").asBoolean());

        jdbc.update("INSERT INTO exp_events (user_id, event_type, ref_key, points, event_date, created_at) VALUES (?, 'SESSION', 'b', 900, CURDATE(), NOW(6))", u);
        assertEquals(100.0, exp(t).path("attendanceScore").asDouble(), 0.001, "điểm chuyên cần tối đa 100");

        jdbc.update("UPDATE exp_events SET event_date = DATE_SUB(CURDATE(), INTERVAL 40 DAY) WHERE user_id = ?", u);
        assertEquals(0.0, exp(t).path("attendanceScore").asDouble(), 0.001, "EXP ngoài cửa sổ 28 ngày không tính vào chuyên cần");
        assertEquals(1200, exp(t).path("totalExp").asInt(), "nhưng vẫn nằm trong tổng EXP và cấp EXP");
    }
}
