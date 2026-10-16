package com.calishealth.api;

import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.service.EmailService;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
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
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tài khoản Coach do Admin tạo, chạy TOÀN BỘ Spring context và gọi API qua HTTP thật (DB scratch, cần migration_coach_accounts.sql):
 * mật khẩu tạm gửi qua email ⇒ đăng nhập lần đầu chỉ được đổi mật khẩu ⇒ đổi xong dùng bình thường. Đồng thời bắt lỗi cấu hình bean.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class CoachAccountFlowTest {
    private static final String ADMIN_PASSWORD = "Admin#12345x";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    private String adminEmail;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        Integer table = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_password_policy'", Integer.class);
        Assumptions.assumeTrue(table != null && table > 0, "Chưa chạy migration_coach_accounts.sql trên DB test");
        adminEmail = "e2e-admin+" + UUID.randomUUID() + "@example.test";
        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setPasswordHash(encoder.encode(ADMIN_PASSWORD));
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setEmailVerified(true);
        users.save(admin);
        adminToken = login(adminEmail, ADMIN_PASSWORD).path("accessToken").asString();
    }

    @AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM user_login_throttle WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-%@example.test')");
        for (Long id : jdbc.queryForList("SELECT id FROM users WHERE email LIKE 'e2e-%@example.test'", Long.class)) {
            jdbc.update("DELETE FROM user_password_policy WHERE user_id = ? OR issued_by = ?", id, id);
        }
        jdbc.update("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-%@example.test')");
        jdbc.update("DELETE FROM users WHERE email LIKE 'e2e-%@example.test'");
    }

    // ------------------------------------------------------------------ HTTP helpers

    private record Resp(int status, JsonNode body) {}

    private Resp call(String method, String path, String token, Object body) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json");
        if (token != null) b.header("Authorization", "Bearer " + token);
        b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        HttpResponse<String> r = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body() == null || r.body().isBlank() ? JSON.createObjectNode() : JSON.readTree(r.body()));
    }

    private JsonNode login(String email, String password) throws Exception {
        Resp r = call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", password));
        assertEquals(200, r.status(), r.body().toString());
        return r.body();
    }

    private String capturedTempPassword() {
        ArgumentCaptor<String> pw = ArgumentCaptor.forClass(String.class);
        verify(emailService, atLeastOnce()).sendCoachAccountEmail(anyString(), anyString(), pw.capture(), anyString(), anyInt());
        return pw.getValue();
    }

    private String newCoachEmail() { return "e2e-coach+" + UUID.randomUUID() + "@example.test"; }

    // ------------------------------------------------------------------ luồng chính

    @Test
    void adminCreatesCoach_firstLoginOnlyAllowsChangingThePassword_thenTheCoachCanWork() throws Exception {
        String email = newCoachEmail();
        Resp created = call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", email, "fullName", "Nguyễn Văn An"));
        assertEquals(201, created.status(), created.body().toString());
        assertEquals("COACH", jdbc.queryForObject("SELECT role FROM users WHERE email = ?", String.class, email));
        assertEquals("PENDING_FIRST_LOGIN", created.body().path("state").asString());
        assertTrue(created.body().path("mustChangePassword").asBoolean());
        assertFalse(created.body().toString().toLowerCase().contains("password\":\""), "response không được chứa mật khẩu");
        String temp = capturedTempPassword();
        assertTrue(temp.length() >= 12);
        assertFalse(jdbc.queryForObject("SELECT password_hash FROM users WHERE email = ?", String.class, email).contains(temp), "mật khẩu tạm không được lưu dạng rõ");

        JsonNode first = login(email, temp);
        assertTrue(first.path("mustChangePassword").asBoolean());
        String restricted = first.path("accessToken").asString();

        // token hạn chế: mọi API trừ đổi mật khẩu và hồ sơ đều bị chặn
        Resp blocked = call("GET", "/api/v1/coach/users/1/overrides", restricted, null);
        assertEquals(403, blocked.status());
        assertEquals("PASSWORD_CHANGE_REQUIRED", blocked.body().path("code").asString());
        assertNotEquals("PASSWORD_CHANGE_REQUIRED", call("GET", "/api/v1/profile", restricted, null).body().path("code").asString(), "đọc hồ sơ của chính mình phải được phép");
        assertEquals("PASSWORD_CHANGE_REQUIRED", call("POST", "/api/v1/workout-sessions", restricted, Map.of()).body().path("code").asString());

        // đổi mật khẩu: sai mật khẩu hiện tại / quá yếu / trùng mật khẩu cũ / trùng email đều bị từ chối
        assertEquals(400, call("POST", "/api/v1/account/change-password", restricted, Map.of("currentPassword", "sai-mat-khau-1", "newPassword", "MatKhauMoi2026")).status());
        assertEquals(400, call("POST", "/api/v1/account/change-password", restricted, Map.of("currentPassword", temp, "newPassword", "ngan1")).status());
        assertEquals(400, call("POST", "/api/v1/account/change-password", restricted, Map.of("currentPassword", temp, "newPassword", "chiToanChuCai")).status());
        assertEquals(400, call("POST", "/api/v1/account/change-password", restricted, Map.of("currentPassword", temp, "newPassword", temp)).status());
        assertEquals(400, call("POST", "/api/v1/account/change-password", restricted, Map.of("currentPassword", temp, "newPassword", email)).status());
        assertEquals(1, jdbc.queryForObject("SELECT must_change FROM user_password_policy WHERE user_id = (SELECT id FROM users WHERE email = ?)", Integer.class, email));

        Resp changed = call("POST", "/api/v1/account/change-password", restricted, Map.of("currentPassword", temp, "newPassword", "MatKhauMoi2026"));
        assertEquals(200, changed.status(), changed.body().toString());
        assertFalse(changed.body().path("mustChangePassword").asBoolean());
        String free = changed.body().path("accessToken").asString();
        assertNotEquals("PASSWORD_CHANGE_REQUIRED", call("GET", "/api/v1/coach/users/1/overrides", free, null).body().path("code").asString());

        // mật khẩu tạm không còn dùng được; mật khẩu mới đăng nhập bình thường và không còn hạn chế
        assertEquals(400, call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", temp)).status());
        assertFalse(login(email, "MatKhauMoi2026").path("mustChangePassword").asBoolean());
        assertEquals(0, jdbc.queryForObject("SELECT must_change FROM user_password_policy WHERE user_id = (SELECT id FROM users WHERE email = ?)", Integer.class, email));
        assertNotNull(jdbc.queryForObject("SELECT changed_at FROM user_password_policy WHERE user_id = (SELECT id FROM users WHERE email = ?)", Timestamp.class, email));
    }

    @Test
    void anOldRestrictedTokenKeepsBeingRestricted_evenAfterThePasswordWasChangedElsewhere() throws Exception {
        String email = newCoachEmail();
        call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", email, "fullName", "Trần Thị Bình"));
        String temp = capturedTempPassword();
        String restricted = login(email, temp).path("accessToken").asString();
        call("POST", "/api/v1/account/change-password", restricted, Map.of("currentPassword", temp, "newPassword", "MatKhauMoi2026"));
        assertEquals("PASSWORD_CHANGE_REQUIRED", call("GET", "/api/v1/coach/users/1/overrides", restricted, null).body().path("code").asString(), "token cũ vẫn bị hạn chế (an toàn hơn là cho đi tiếp)");
    }

    // ------------------------------------------------------------------ kiểm tra đầu vào và phân quyền

    @Test
    void onlyAnAdminCanCreateCoachAccounts_andInputsAreValidated() throws Exception {
        String email = newCoachEmail();
        assertEquals(401, call("POST", "/api/v1/admin/coaches", null, Map.of("email", email, "fullName", "An")).status());

        call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", email, "fullName", "Lê Văn Cường"));
        String temp = capturedTempPassword();
        String coachToken = login(email, temp).path("accessToken").asString();
        String coachFree = call("POST", "/api/v1/account/change-password", coachToken, Map.of("currentPassword", temp, "newPassword", "MatKhauMoi2026")).body().path("accessToken").asString();
        assertEquals(403, call("POST", "/api/v1/admin/coaches", coachFree, Map.of("email", newCoachEmail(), "fullName", "Người Khác")).status(), "Coach không được tạo Coach");

        assertEquals(400, call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", "khong-phai-email", "fullName", "Nguyễn Văn An")).status());
        assertEquals(400, call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", newCoachEmail(), "fullName", " ")).status());
        Resp dup = call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", email.toUpperCase(), "fullName", "Trùng Email"));
        assertEquals(400, dup.status());
        assertTrue(dup.body().path("message").asString().contains("Email"));
    }

    @Test
    void ifTheEmailCannotBeSent_theAccountIsNotCreated() throws Exception {
        doThrow(new IllegalStateException("SMTP down")).when(emailService).sendCoachAccountEmail(anyString(), anyString(), anyString(), anyString(), anyInt());
        String email = newCoachEmail();
        Resp r = call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", email, "fullName", "Phạm Văn Dũng"));
        assertEquals(409, r.status());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email), "không để lại tài khoản mà Coach không nhận được mật khẩu");
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_password_policy p JOIN users u ON u.id = p.user_id WHERE u.email = ?", Integer.class, email));
    }

    // ------------------------------------------------------------------ hạn dùng và cấp lại

    @Test
    void anExpiredTempPasswordCannotLogIn_andTheAdminCanIssueANewOne() throws Exception {
        String email = newCoachEmail();
        Resp created = call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", email, "fullName", "Hoàng Thị Em"));
        long id = created.body().path("id").asLong();
        String temp = capturedTempPassword();
        jdbc.update("UPDATE user_password_policy SET temp_expires_at = ? WHERE user_id = ?", Timestamp.from(Instant.now().minus(1, ChronoUnit.HOURS)), id);

        Resp expired = call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", temp));
        assertEquals(400, expired.status());
        assertTrue(expired.body().path("message").asString().contains("hết hạn"));
        // sai mật khẩu thì không lộ trạng thái hết hạn
        assertFalse(call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", "sai-mat-khau-1")).body().path("message").asString().contains("hết hạn"));
        Resp list = call("GET", "/api/v1/admin/coaches", adminToken, null);
        assertEquals("TEMP_EXPIRED", findById(list.body(), id).path("state").asString());

        Resp reset = call("POST", "/api/v1/admin/coaches/" + id + "/reset-password", adminToken, null);
        assertEquals(200, reset.status(), reset.body().toString());
        assertEquals("PENDING_FIRST_LOGIN", reset.body().path("state").asString());
        ArgumentCaptor<String> pw = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(2)).sendCoachAccountEmail(eq(email), anyString(), pw.capture(), anyString(), anyInt());
        String fresh = pw.getAllValues().get(1);
        assertNotEquals(temp, fresh);
        assertEquals(400, call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", temp)).status(), "mật khẩu tạm cũ bị thay thế");
        assertTrue(login(email, fresh).path("mustChangePassword").asBoolean());
    }

    @Test
    void resettingThePasswordOfAnActiveCoachForcesAChangeAgain_andOnlyCoachesCanBeReset() throws Exception {
        String email = newCoachEmail();
        long id = call("POST", "/api/v1/admin/coaches", adminToken, Map.of("email", email, "fullName", "Vũ Văn Phúc")).body().path("id").asLong();
        String temp = capturedTempPassword();
        String token = login(email, temp).path("accessToken").asString();
        call("POST", "/api/v1/account/change-password", token, Map.of("currentPassword", temp, "newPassword", "MatKhauMoi2026"));
        assertEquals("ACTIVE", findById(call("GET", "/api/v1/admin/coaches", adminToken, null).body(), id).path("state").asString());

        call("POST", "/api/v1/admin/coaches/" + id + "/reset-password", adminToken, null);
        assertEquals(400, call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", "MatKhauMoi2026")).status(), "mật khẩu Coach tự đặt bị thay thế khi Admin cấp lại");
        long adminId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, adminEmail);
        assertEquals(400, call("POST", "/api/v1/admin/coaches/" + adminId + "/reset-password", adminToken, null).status(), "không cấp lại mật khẩu cho tài khoản không phải Coach");
    }

    private static JsonNode findById(JsonNode array, long id) {
        for (JsonNode n : array) if (n.path("id").asLong() == id) return n;
        fail("Không thấy tài khoản " + id + " trong danh sách");
        return null;
    }
}
