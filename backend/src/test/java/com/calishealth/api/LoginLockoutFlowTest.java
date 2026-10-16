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
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Khoá tài khoản khi đăng nhập sai nhiều lần và kiểm tra trạng thái tài khoản, chạy toàn bộ Spring context qua HTTP thật
 * (DB scratch, cần migration_login_throttle.sql). Ngưỡng: 5 lần sai trong 15 phút ⇒ khoá 15 phút.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true",
        "app.security.login.max-failures=5", "app.security.login.window-minutes=15", "app.security.login.lock-minutes=15",
        "app.security.status-cache-seconds=0"})
class LoginLockoutFlowTest {
    private static final String PASSWORD = "Dung#Mat1Khau";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    @BeforeEach
    void requireTable() {
        Integer t = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_login_throttle'", Integer.class);
        Assumptions.assumeTrue(t != null && t > 0, "Chưa chạy migration_login_throttle.sql trên DB test");
    }

    @AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM user_login_throttle WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-lock+%@example.test')");
        jdbc.update("DELETE FROM user_password_policy WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-lock+%@example.test')");
        jdbc.update("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-lock+%@example.test')");
        jdbc.update("DELETE FROM users WHERE email LIKE 'e2e-lock+%@example.test'");
    }

    private record Resp(int status, JsonNode body) {}

    private Resp call(String method, String path, String token, Object body) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json");
        if (token != null) b.header("Authorization", "Bearer " + token);
        b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        HttpResponse<String> r = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body() == null || r.body().isBlank() ? JSON.createObjectNode() : JSON.readTree(r.body()));
    }

    private Resp login(String email, String password) throws Exception { return call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", password)); }

    private String newUser(Role role) {
        String email = "e2e-lock+" + UUID.randomUUID() + "@example.test";
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(PASSWORD));
        u.setRole(role);
        u.setStatus(UserStatus.ACTIVE);
        u.setEmailVerified(true);
        users.save(u);
        return email;
    }

    private long idOf(String email) { return jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email); }

    private void fail(String email, int times) throws Exception {
        for (int i = 0; i < times; i++) assertEquals(400, login(email, "sai-mat-khau-" + i).status());
    }

    private String adminToken() throws Exception {
        String admin = newUser(Role.ADMIN);
        return login(admin, PASSWORD).body().path("accessToken").asString();
    }

    private static boolean isLockMessage(Resp r) { return r.body().path("message").asString().contains("khóa"); }

    // ------------------------------------------------------------------ khoá sau nhiều lần sai

    @Test
    void afterTooManyWrongPasswords_theAccountIsLocked_evenForTheCorrectPassword() throws Exception {
        String email = newUser(Role.COACH);
        for (int i = 1; i < 5; i++) {
            Resp r = login(email, "sai-mat-khau-" + i);
            assertEquals(400, r.status());
            assertFalse(isLockMessage(r), "lần " + i + " chưa bị khoá");
        }
        Resp fifth = login(email, "sai-mat-khau-5");
        assertEquals(400, fifth.status());
        assertTrue(isLockMessage(fifth), "lần sai thứ 5 làm tài khoản bị khoá và báo ngay: " + fifth.body());

        Resp correct = login(email, PASSWORD);
        assertEquals(400, correct.status(), "đang khoá thì mật khẩu đúng cũng bị từ chối");
        assertTrue(isLockMessage(correct));
        assertTrue(jdbc.queryForObject("SELECT locked_until FROM user_login_throttle WHERE user_id = ?", Timestamp.class, idOf(email)).toInstant().isAfter(Instant.now()));
    }

    @Test
    void aSuccessfulLoginResetsTheCounter() throws Exception {
        String email = newUser(Role.COACH);
        fail(email, 4);
        assertEquals(200, login(email, PASSWORD).status());
        fail(email, 4);                                         // đếm lại từ đầu: 4 lần sai nữa vẫn chưa khoá
        assertEquals(200, login(email, PASSWORD).status());
    }

    @Test
    void failuresOlderThanTheWindowDoNotCount_andAnExpiredLockEnds() throws Exception {
        String email = newUser(Role.COACH);
        fail(email, 4);
        jdbc.update("UPDATE user_login_throttle SET first_failed_at = ? WHERE user_id = ?", Timestamp.from(Instant.now().minus(20, ChronoUnit.MINUTES)), idOf(email));
        Resp afterWindow = login(email, "sai-mat-khau-x");
        assertEquals(400, afterWindow.status());
        assertFalse(isLockMessage(afterWindow), "4 lần sai cũ nằm ngoài cửa sổ nên lần này chỉ là lần thứ 1");
        assertEquals(1, jdbc.queryForObject("SELECT failed_count FROM user_login_throttle WHERE user_id = ?", Integer.class, idOf(email)));

        fail(email, 4);
        assertTrue(isLockMessage(login(email, PASSWORD)));
        jdbc.update("UPDATE user_login_throttle SET locked_until = ? WHERE user_id = ?", Timestamp.from(Instant.now().minus(1, ChronoUnit.MINUTES)), idOf(email));
        assertEquals(200, login(email, PASSWORD).status(), "hết thời gian khoá thì đăng nhập lại được");
    }

    @Test
    void anUnknownEmailIsRejectedGenerically_andLeavesNoTrace() throws Exception {
        String email = "e2e-lock+khong-ton-tai-" + UUID.randomUUID() + "@example.test";
        for (int i = 0; i < 8; i++) {
            Resp r = login(email, "sai-mat-khau-" + i);
            assertEquals(400, r.status());
            assertFalse(isLockMessage(r));
        }
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_login_throttle t JOIN users u ON u.id = t.user_id WHERE u.email = ?", Integer.class, email));
    }

    @Test
    void adminCanUnlockAndResetPasswordUnlocksToo() throws Exception {
        String admin = adminToken();
        String email = newUser(Role.COACH);
        long id = idOf(email);
        fail(email, 5);
        Resp listed = call("GET", "/api/v1/admin/coaches", admin, null);
        JsonNode mine = null;
        for (JsonNode n : listed.body()) if (n.path("id").asLong() == id) mine = n;
        assertNotNull(mine);
        assertEquals("LOCKED", mine.path("state").asString());
        assertFalse(mine.path("lockedUntil").isNull());

        assertEquals(200, call("POST", "/api/v1/admin/coaches/" + id + "/unlock", admin, null).status());
        assertEquals(200, login(email, PASSWORD).status());

        fail(email, 5);
        assertEquals(200, call("POST", "/api/v1/admin/coaches/" + id + "/reset-password", admin, null).status(), "cấp lại mật khẩu cũng mở khoá");
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_login_throttle WHERE user_id = ? AND locked_until IS NOT NULL", Integer.class, id));
    }

    @Test
    void onlyAdminsMayUnlock() throws Exception {
        String coach = newUser(Role.COACH);
        String coachToken = login(coach, PASSWORD).body().path("accessToken").asString();
        assertEquals(403, call("POST", "/api/v1/admin/coaches/" + idOf(coach) + "/unlock", coachToken, null).status());
    }

    // ------------------------------------------------------------------ trạng thái tài khoản

    @Test
    void aDisabledAccountCannotLogIn_andTheReasonIsOnlyShownForTheRightPassword() throws Exception {
        for (UserStatus status : new UserStatus[]{UserStatus.SUSPENDED, UserStatus.INACTIVE, UserStatus.DELETED}) {
            String email = newUser(Role.COACH);
            jdbc.update("UPDATE users SET status = ? WHERE email = ?", status.name(), email);
            Resp right = login(email, PASSWORD);
            assertEquals(400, right.status(), status.name());
            assertTrue(right.body().path("message").asString().contains("vô hiệu hóa"), status.name());
            Resp wrong = login(email, "sai-mat-khau-1");
            assertFalse(wrong.body().path("message").asString().contains("vô hiệu hóa"), "mật khẩu sai không được biết trạng thái tài khoản");
        }
    }

    @Test
    void aTokenStopsWorkingAsSoonAsTheAccountIsDisabled() throws Exception {
        String email = newUser(Role.COACH);
        String token = login(email, PASSWORD).body().path("accessToken").asString();
        assertNotEquals(401, call("GET", "/api/v1/coach/users/1/overrides", token, null).status());

        String admin = adminToken();
        assertEquals(200, call("PUT", "/api/v1/admin/users/" + idOf(email) + "/status", admin, Map.of("status", "SUSPENDED")).status());
        Resp blocked = call("GET", "/api/v1/coach/users/1/overrides", token, null);
        assertEquals(401, blocked.status());
        assertEquals("ACCOUNT_DISABLED", blocked.body().path("code").asString());

        assertEquals(200, call("PUT", "/api/v1/admin/users/" + idOf(email) + "/status", admin, Map.of("status", "ACTIVE")).status());
        assertNotEquals(401, call("GET", "/api/v1/coach/users/1/overrides", token, null).status(), "kích hoạt lại thì token còn hạn dùng được tiếp");
    }
}
