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
import java.net.http.WebSocket;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Quy trình duyệt Level Engine: Coach clone -> gửi duyệt -> Admin duyệt/trả lại, kèm thông báo realtime qua WebSocket thật.
 * Dọn dữ liệu: bản nháp tạo ra bị xóa cùng các bảng con, bản ACTIVE cũ được khôi phục.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class LevelEngineReviewFlowTest {
    private static final String PASSWORD = "Test#12345x";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final String ES = "/api/v1/admin/level-engine/rule-sets";

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    private String coach, admin, otherCoach;
    private long coachId, adminId;
    private Long activeBefore;
    private final List<Long> created = new ArrayList<>();
    private final List<WebSocket> sockets = new ArrayList<>();

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
        u.setEmail(email); u.setPasswordHash(encoder.encode(PASSWORD)); u.setRole(role); u.setStatus(UserStatus.ACTIVE); u.setEmailVerified(true);
        users.save(u);
        Resp r = call("POST", "/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD));
        assertEquals(200, r.status(), r.body().toString());
        return r.body().path("accessToken").asString();
    }

    private BlockingQueue<String> listen(String token) throws Exception {
        BlockingQueue<String> q = new LinkedBlockingQueue<>();
        WebSocket ws = HTTP.newWebSocketBuilder().buildAsync(URI.create("ws://localhost:" + port + "/ws/notifications?token=" + token), new WebSocket.Listener() {
            private final StringBuilder buf = new StringBuilder();
            @Override public void onOpen(WebSocket w) { w.request(1); }
            @Override public CompletionStage<?> onText(WebSocket w, CharSequence data, boolean last) {
                buf.append(data);
                if (last) { q.add(buf.toString()); buf.setLength(0); }
                w.request(1);
                return null;
            }
        }).get(10, TimeUnit.SECONDS);
        sockets.add(ws);
        return q;
    }

    @BeforeEach
    void setUp() throws Exception {
        String s = UUID.randomUUID().toString();
        coach = createUser("e2e-lev-coach+" + s + "@example.test", Role.COACH);
        otherCoach = createUser("e2e-lev-coach2+" + s + "@example.test", Role.COACH);
        admin = createUser("e2e-lev-admin+" + s + "@example.test", Role.ADMIN);
        coachId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, "e2e-lev-coach+" + s + "@example.test");
        adminId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, "e2e-lev-admin+" + s + "@example.test");
        var rows = jdbc.queryForList("SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE' AND status = 'ACTIVE'", Long.class);
        Assumptions.assumeFalse(rows.isEmpty(), "DB test chưa có Level Engine ACTIVE");
        activeBefore = rows.get(0);
    }

    @AfterEach
    void cleanup() {
        sockets.forEach(w -> w.abort());
        for (Long id : created) {
            // Tin gửi cho các Admin thật của DB test cũng phải dọn (users test đã xóa kèm tin của họ)
            jdbc.update("DELETE FROM notifications WHERE reference_type = 'LEVEL_ENGINE_RULE_SET' AND reference_id = ?", id);
            jdbc.update("DELETE r FROM level_requirements r JOIN fitness_levels l ON l.id = r.level_id WHERE l.rule_set_id = ?", id);
            for (String t : List.of("fitness_levels", "engine_parameters", "competency_ladder_nodes", "consistency_rules"))
                jdbc.update("DELETE FROM " + t + " WHERE rule_set_id = ?", id);
            jdbc.update("DELETE FROM rule_sets WHERE id = ?", id);
        }
        jdbc.update("UPDATE rule_sets SET status = 'ACTIVE' WHERE id = ?", activeBefore);
        jdbc.update("DELETE FROM users WHERE email LIKE 'e2e-lev-%@example.test'");
    }

    private JsonNode next(BlockingQueue<String> q) throws Exception {
        String m = q.poll(10, TimeUnit.SECONDS);
        assertNotNull(m, "không nhận được thông báo realtime trong 10 giây");
        return JSON.readTree(m);
    }

    @Test
    void coachSubmits_adminIsNotifiedRealtime_adminReturnsThenApproves_coachIsNotified() throws Exception {
        BlockingQueue<String> adminFeed = listen(admin);
        BlockingQueue<String> coachFeed = listen(coach);

        Resp cloned = call("POST", ES + "/" + activeBefore + "/clone", coach, null);
        assertEquals(201, cloned.status(), cloned.body().toString());
        long draft = Long.parseLong(cloned.body().path("ruleSet").path("id").asString());
        created.add(draft);
        assertEquals("DRAFT", cloned.body().path("ruleSet").path("status").asString());
        assertEquals(coachId, cloned.body().path("ruleSet").path("authorId").asLong());

        // Coach khác không sửa/gửi duyệt bản của người khác
        assertEquals(403, call("POST", ES + "/" + draft + "/submit", otherCoach, null).status());
        // Coach không tự duyệt
        assertEquals(403, call("POST", ES + "/" + draft + "/decision", coach, Map.of("decision", "APPROVED")).status());
        assertEquals(403, call("POST", ES + "/" + draft + "/activate", coach, null).status());

        // Admin không kích hoạt thẳng bản nháp của Coach khi Coach chưa gửi duyệt
        assertEquals(409, call("POST", ES + "/" + draft + "/activate", admin, null).status());

        // Gửi duyệt -> Admin nhận realtime
        Resp submitted = call("POST", ES + "/" + draft + "/submit", coach, null);
        assertEquals(200, submitted.status(), submitted.body().toString());
        assertEquals("PENDING_REVIEW", submitted.body().path("ruleSet").path("status").asString());
        JsonNode pushed = next(adminFeed);
        assertEquals("notification", pushed.path("event").asString());
        assertEquals("LEVEL_ENGINE_SUBMITTED", pushed.path("notification").path("type").asString());
        assertEquals(draft, pushed.path("notification").path("referenceId").asLong());
        assertTrue(pushed.path("unreadCount").asInt() >= 1);

        // Đã lưu DB: Admin tải lại danh sách thấy, đánh dấu đã đọc được
        Resp list = call("GET", "/api/v1/me/notifications?unreadOnly=true", admin, null);
        assertEquals(200, list.status());
        long notiId = pushed.path("notification").path("id").asLong();
        assertTrue(list.body().toString().contains("\"id\":" + notiId));
        assertEquals(200, call("POST", "/api/v1/me/notifications/" + notiId + "/read", admin, null).status());
        // Coach không đọc/đánh dấu được thông báo của Admin
        assertFalse(call("POST", "/api/v1/me/notifications/" + notiId + "/read", coach, null).body().path("changed").asBoolean());

        // Đang chờ duyệt thì Coach không sửa được
        assertEquals(409, call("PUT", ES + "/" + draft, coach, Map.of("notes", "x")).status());

        // Admin trả về: bắt buộc có lý do
        assertEquals(400, call("POST", ES + "/" + draft + "/decision", admin, Map.of("decision", "CHANGES_REQUESTED")).status());
        Resp returned = call("POST", ES + "/" + draft + "/decision", admin, Map.of("decision", "CHANGES_REQUESTED", "notes", "Hạ ngưỡng L1 xuống 22"));
        assertEquals(200, returned.status(), returned.body().toString());
        assertEquals("DRAFT", returned.body().path("ruleSet").path("status").asString());
        JsonNode toCoach = next(coachFeed);
        assertEquals("LEVEL_ENGINE_CHANGES_REQUESTED", toCoach.path("notification").path("type").asString());
        assertTrue(toCoach.path("notification").path("message").asString().contains("Hạ ngưỡng L1"));

        // Coach gửi lại, Admin duyệt -> thành bản chính, bản cũ lưu trữ, Coach được báo
        assertEquals(200, call("POST", ES + "/" + draft + "/submit", coach, null).status());
        next(adminFeed);
        Resp approved = call("POST", ES + "/" + draft + "/decision", admin, Map.of("decision", "APPROVED"));
        assertEquals(200, approved.status(), approved.body().toString());
        assertEquals("ACTIVE", approved.body().path("ruleSet").path("status").asString());
        assertEquals("ARCHIVED", jdbc.queryForObject("SELECT status FROM rule_sets WHERE id = ?", String.class, activeBefore));
        assertEquals("LEVEL_ENGINE_ACTIVATED", next(coachFeed).path("notification").path("type").asString());
    }

    @Test
    void adminCannotApproveTheirOwnSubmission_andWithdrawReturnsToDraft() throws Exception {
        Resp cloned = call("POST", ES + "/" + activeBefore + "/clone", admin, null);
        assertEquals(201, cloned.status(), cloned.body().toString());
        long draft = Long.parseLong(cloned.body().path("ruleSet").path("id").asString());
        created.add(draft);
        assertEquals(200, call("POST", ES + "/" + draft + "/submit", admin, null).status());
        assertEquals(403, call("POST", ES + "/" + draft + "/decision", admin, Map.of("decision", "APPROVED")).status());
        assertEquals(403, call("POST", ES + "/" + draft + "/activate", admin, null).status());
        Resp w = call("POST", ES + "/" + draft + "/withdraw", admin, null);
        assertEquals(200, w.status(), w.body().toString());
        assertEquals("DRAFT", w.body().path("ruleSet").path("status").asString());
    }

    @Test
    void webSocketRejectsMissingOrInvalidToken() throws Exception {
        for (String url : List.of("ws://localhost:" + port + "/ws/notifications", "ws://localhost:" + port + "/ws/notifications?token=khong-hop-le")) {
            var f = HTTP.newWebSocketBuilder().buildAsync(URI.create(url), new WebSocket.Listener() {});
            assertThrows(Exception.class, () -> f.get(10, TimeUnit.SECONDS));
        }
    }
}
