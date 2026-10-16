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
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phân vai rule chấm form (Motion Rule Engine), chạy TOÀN BỘ Spring context qua HTTP thật (DB scratch):
 * Coach SOẠN (xem, thử, sửa, gửi duyệt), Admin DUYỆT (xuất bản/trả lại/lưu trữ). Người gửi duyệt không tự xuất bản được.
 * Dùng một rule nháp có sẵn của bộ benchmark (MotionBenchmarkSeeder) và khôi phục trạng thái sau test.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class MotionRuleGovernanceFlowTest {
    private static final String PASSWORD = "Test#12345x";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    private long ruleId;
    private Map<String, Object> snapshot;
    private String coachToken, adminToken, otherAdminToken;
    private String coachEmail, adminEmail, otherAdminEmail;

    private record Resp(int status, JsonNode body) {}

    private Resp call(String method, String path, String token, Object body) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json");
        if (token != null) b.header("Authorization", "Bearer " + token);
        b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        HttpResponse<String> r = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body() == null || r.body().isBlank() ? JSON.createObjectNode() : JSON.readTree(r.body()));
    }

    private String createUser(String email, Role role) throws Exception {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(PASSWORD));
        u.setRole(role);
        u.setStatus(UserStatus.ACTIVE);
        u.setEmailVerified(true);
        users.save(u);
        Resp r = call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD));
        assertEquals(200, r.status(), r.body().toString());
        return r.body().path("accessToken").asString();
    }

    @BeforeEach
    void setUp() throws Exception {
        var rows = jdbc.queryForList("SELECT id FROM ai_motion_rules WHERE created_by = 'system-seed-benchmark' AND status = 'DRAFT' ORDER BY id LIMIT 1");
        Assumptions.assumeFalse(rows.isEmpty(), "Chưa nạp bộ rule nháp (--app.seed.motion-benchmarks=true) trên DB test");
        ruleId = ((Number) rows.get(0).get("id")).longValue();
        snapshot = jdbc.queryForMap("SELECT status, last_tested_at, submitted_by, submitted_at, approved_by, approved_at FROM ai_motion_rules WHERE id = ?", ruleId);
        String s = UUID.randomUUID().toString();
        coachEmail = "e2e-mgov-coach+" + s + "@example.test";
        adminEmail = "e2e-mgov-admin+" + s + "@example.test";
        otherAdminEmail = "e2e-mgov-admin2+" + s + "@example.test";
        coachToken = createUser(coachEmail, Role.COACH);
        adminToken = createUser(adminEmail, Role.ADMIN);
        otherAdminToken = createUser(otherAdminEmail, Role.ADMIN);
    }

    @AfterEach
    void cleanup() {
        if (snapshot != null) {
            jdbc.update("UPDATE ai_motion_rules SET status = ?, last_tested_at = ?, submitted_by = ?, submitted_at = ?, approved_by = ?, approved_at = ? WHERE id = ?",
                    snapshot.get("status"), snapshot.get("last_tested_at"), snapshot.get("submitted_by"), snapshot.get("submitted_at"),
                    snapshot.get("approved_by"), snapshot.get("approved_at"), ruleId);
            jdbc.update("DELETE FROM ai_configuration_audit_logs WHERE user_email LIKE 'e2e-mgov-%@example.test'");
            jdbc.update("DELETE FROM notifications WHERE reference_type = 'MOTION_RULE' AND reference_id = ?", ruleId);   // tin gửi cho cả Admin thật của DB test
        }
        jdbc.update("DELETE FROM users WHERE email LIKE 'e2e-mgov-%@example.test'");
    }

    @Test
    void coachCanAuthor_butCannotApprove_andNobodyApprovesTheirOwnSubmission() throws Exception {
        String rule = "/api/v1/admin/motion-rules/" + ruleId;

        // Coach đọc, thử, gửi duyệt
        assertEquals(200, call("GET", rule, coachToken, null).status());
        assertEquals(200, call("GET", "/api/v1/admin/motion/catalog", coachToken, null).status());
        Resp tested = call("POST", rule + "/test", coachToken, Map.of("value", 60));
        assertEquals(200, tested.status(), tested.body().toString());
        Resp submitted = call("POST", rule + "/submit-review", coachToken, Map.of("note", "Đã thử trên mẫu"));
        assertEquals(200, submitted.status(), submitted.body().toString());
        assertEquals("PENDING_REVIEW", submitted.body().path("status").asString());
        // Admin được báo ngay khi Coach gửi duyệt
        assertTrue(call("GET", "/api/v1/me/notifications?unreadOnly=true", adminToken, null).body().toString().contains("MOTION_RULE_SUBMITTED"), "Admin phải nhận thông báo rule chờ duyệt");

        // Coach KHÔNG duyệt được (xuất bản / trả lại / lưu trữ)
        assertEquals(403, call("POST", rule + "/publish", coachToken, Map.of("note", "tự duyệt")).status());
        assertEquals(403, call("POST", rule + "/reject", coachToken, Map.of("note", "x")).status());
        assertEquals(403, call("POST", rule + "/archive", coachToken, Map.of("note", "x")).status());
        assertEquals("PENDING_REVIEW", jdbc.queryForObject("SELECT status FROM ai_motion_rules WHERE id = ?", String.class, ruleId));

        // Admin duyệt (người khác người gửi) thì xuất bản được
        Resp published = call("POST", rule + "/publish", adminToken, Map.of("note", "Duyệt"));
        assertEquals(200, published.status(), published.body().toString());
        assertEquals("PUBLISHED", published.body().path("status").asString());
        assertEquals(adminEmail, jdbc.queryForObject("SELECT approved_by FROM ai_motion_rules WHERE id = ?", String.class, ruleId));
        assertEquals(coachEmail, jdbc.queryForObject("SELECT submitted_by FROM ai_motion_rules WHERE id = ?", String.class, ruleId));
        // Người gửi (Coach) được báo khi Admin xuất bản
        assertTrue(call("GET", "/api/v1/me/notifications", coachToken, null).body().toString().contains("MOTION_RULE_PUBLISHED"), "Coach phải nhận thông báo rule đã xuất bản");
    }

    @Test
    void anAdminWhoSubmittedARuleCannotPublishItThemselves() throws Exception {
        String rule = "/api/v1/admin/motion-rules/" + ruleId;
        assertEquals(200, call("POST", rule + "/test", adminToken, Map.of("value", 60)).status());
        assertEquals(200, call("POST", rule + "/submit-review", adminToken, Map.of("note", "Admin tự soạn")).status());
        Resp self = call("POST", rule + "/publish", adminToken, Map.of("note", "tự duyệt"));
        assertTrue(self.status() >= 400, "tự duyệt phải bị từ chối: " + self.body());
        assertEquals("PENDING_REVIEW", jdbc.queryForObject("SELECT status FROM ai_motion_rules WHERE id = ?", String.class, ruleId));
        assertEquals(200, call("POST", rule + "/publish", otherAdminToken, Map.of("note", "Admin khác duyệt")).status());
    }

    @Test
    void studentsAndAnonymousCannotTouchTheRuleAuthoringApi() throws Exception {
        String student = createUser("e2e-mgov-user+" + UUID.randomUUID() + "@example.test", Role.USER);
        String rule = "/api/v1/admin/motion-rules/" + ruleId;
        assertEquals(403, call("GET", rule, student, null).status());
        assertEquals(403, call("POST", rule + "/submit-review", student, Map.of()).status());
        assertEquals(401, call("GET", rule, null, null).status());
    }
}
