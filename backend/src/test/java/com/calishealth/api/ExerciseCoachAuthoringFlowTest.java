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
 * Thư viện động tác do Coach soạn, Admin xuất bản: bài Coach tạo luôn là bản nháp và học viên không thấy; Coach sửa được nội dung nhưng không đổi
 * trạng thái xuất bản; Coach chỉ xóa được bản nháp; danh mục và mục tiêu vẫn chỉ Admin. Mọi bài tạo trong test đều bị xóa.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class ExerciseCoachAuthoringFlowTest {
    private static final String PASSWORD = "Test#12345x";
    private static final String PREFIX = "coach-authoring-test-";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    private final List<Long> userIds = new ArrayList<>();
    private String coach, admin, learner;
    private long coachId, adminId, lastUserId;

    private record Resp(int status, JsonNode body) {}

    private Resp call(String method, String path, String token, Object body) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json");
        if (token != null) b.header("Authorization", "Bearer " + token);
        b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        HttpResponse<String> r = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body() == null || r.body().isBlank() ? JSON.createObjectNode() : JSON.readTree(r.body()));
    }

    private String account(Role role) throws Exception {
        User u = new User();
        u.setEmail("exlib+" + UUID.randomUUID() + "@example.test"); u.setPasswordHash(encoder.encode(PASSWORD));
        u.setRole(role); u.setStatus(UserStatus.ACTIVE); u.setEmailVerified(true);
        users.save(u);
        userIds.add(u.getId());
        lastUserId = u.getId();
        Resp r = call("POST", "/api/v1/auth/login", null, Map.of("email", u.getEmail(), "password", PASSWORD));
        assertEquals(200, r.status(), r.body().toString());
        return r.body().path("accessToken").asString();
    }

    @BeforeEach
    void setUp() throws Exception {
        coach = account(Role.COACH); coachId = lastUserId;
        admin = account(Role.ADMIN); adminId = lastUserId;
        learner = account(Role.USER);
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM exercises WHERE code LIKE ?", PREFIX + "%");   // bản chỉnh sửa xóa theo (ON DELETE CASCADE)
        jdbc.update("DELETE FROM notifications WHERE type LIKE 'EXERCISE_%'");
        for (Long u : userIds) {
            jdbc.update("DELETE FROM exercise_revisions WHERE author_id = ?", u);
            jdbc.update("DELETE FROM notifications WHERE user_id = ?", u);
            jdbc.update("DELETE FROM users WHERE id = ?", u);
        }
        userIds.clear();
    }

    private Map<String, Object> request(String suffix, Boolean active) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", PREFIX + suffix); m.put("name", "Bài thử " + suffix); m.put("description", "mô tả"); m.put("difficultyLevel", "Beginner");
        m.put("movementPattern", "PUSH"); m.put("equipmentRequired", false);
        if (active != null) m.put("active", active);
        return m;
    }

    private boolean listed(String token, String code) throws Exception {
        for (JsonNode e : call("GET", "/api/v1/exercises", token, null).body()) if (code.equals(e.path("code").asString())) return true;
        return false;
    }

    @Test
    void coachCreatesADraft_learnerCannotSeeIt_adminPublishes() throws Exception {
        Resp created = call("POST", "/api/v1/exercises", coach, request("a", true));    // Coach cố đặt xuất bản ngay
        assertEquals(201, created.status(), created.body().toString());
        long id = created.body().path("id").asLong();
        assertFalse(created.body().path("active").asBoolean(), "bài Coach tạo luôn là bản nháp");

        assertTrue(listed(coach, PREFIX + "a"), "Coach thấy bản nháp của mình");
        assertTrue(listed(admin, PREFIX + "a"));
        assertFalse(listed(learner, PREFIX + "a"), "học viên không thấy bản nháp");
        assertFalse(listed(null, PREFIX + "a"), "khách không thấy bản nháp");
        assertEquals(400, call("GET", "/api/v1/exercises/" + id, learner, null).status(), "học viên mở thẳng id cũng không thấy");
        assertEquals(200, call("GET", "/api/v1/exercises/" + id, coach, null).status());

        Resp published = call("PUT", "/api/v1/exercises/" + id, admin, Map.of("active", true));
        assertEquals(200, published.status(), published.body().toString());
        assertTrue(listed(learner, PREFIX + "a"), "Admin xuất bản thì học viên thấy");
        assertEquals(200, call("GET", "/api/v1/exercises/" + id, learner, null).status());
    }

    private int notificationsFor(long userId, String type) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND type = ?", Integer.class, userId, type);
    }

    private boolean queueHas(String group) throws Exception {
        for (JsonNode g : call("GET", "/api/v1/admin/work-queue", admin, null).body().path("groups")) if (group.equals(g.path("key").asString())) return true;
        return false;
    }

    private JsonNode pendingFor(String token, long exerciseId) throws Exception {
        return call("GET", "/api/v1/exercise-revisions?exerciseId=" + exerciseId, token, null).body();
    }

    @Test
    void newCoachDraftNotifiesAdminAndShowsInTheWorkQueueUntilPublished() throws Exception {
        long id = call("POST", "/api/v1/exercises", coach, request("n1", null)).body().path("id").asLong();
        assertEquals(1, notificationsFor(adminId, "EXERCISE_DRAFT_SUBMITTED"), "Admin được báo có động tác mới chờ xuất bản");
        assertTrue(queueHas("EXERCISE_DRAFT"), "hàng chờ việc của Admin có bài nháp của Coach");

        call("PUT", "/api/v1/exercises/" + id, coach, Map.of("name", "Sửa bản nháp"));
        assertEquals(1, notificationsFor(adminId, "EXERCISE_DRAFT_SUBMITTED"), "Coach lưu lại bản nháp không báo lặp");

        assertEquals(200, call("PUT", "/api/v1/exercises/" + id, admin, Map.of("active", true)).status());
        assertEquals(1, notificationsFor(coachId, "EXERCISE_PUBLISHED"), "Coach được báo khi Admin xuất bản bài của mình");
        assertFalse(queueHas("EXERCISE_DRAFT"), "bài đã xuất bản rời hàng chờ");
    }

    @Test
    void deletedCoachDraftLeavesTheWorkQueue() throws Exception {
        long id = call("POST", "/api/v1/exercises", coach, request("n2", null)).body().path("id").asLong();
        assertTrue(queueHas("EXERCISE_DRAFT"));
        assertEquals(204, call("DELETE", "/api/v1/exercises/" + id, coach, null).status());
        assertFalse(queueHas("EXERCISE_DRAFT"), "bài đã xóa mềm không còn được coi là chờ xuất bản");
    }

    @Test
    void coachEditOfAPublishedExerciseWaitsForAdminApproval() throws Exception {
        long id = call("POST", "/api/v1/exercises", admin, request("r1", true)).body().path("id").asLong();

        Resp edit = call("PUT", "/api/v1/exercises/" + id, coach, Map.of("name", "Tên Coach đề xuất", "description", "Mô tả mới"));
        assertEquals(202, edit.status(), "chỉnh sửa bài đã xuất bản chỉ được ghi nhận để chờ duyệt");
        assertEquals("Bài thử r1", edit.body().path("name").asString(), "nội dung đang xuất bản chưa đổi");
        assertEquals("Bài thử r1", call("GET", "/api/v1/exercises/" + id, learner, null).body().path("name").asString());

        JsonNode mine = pendingFor(coach, id), all = pendingFor(admin, id);
        assertEquals(1, mine.size());
        assertEquals(1, all.size());
        boolean hasName = false;
        for (JsonNode c : all.get(0).path("changes")) if ("name".equals(c.path("field").asString())) { hasName = true; assertEquals("Tên Coach đề xuất", c.path("after").asString()); }
        assertTrue(hasName, all.toString());
        assertEquals(1, notificationsFor(adminId, "EXERCISE_REVISION_SUBMITTED"));
        assertTrue(queueHas("EXERCISE_REVISION"));

        long revision = all.get(0).path("id").asLong();
        assertEquals(403, call("POST", "/api/v1/exercise-revisions/" + revision + "/approve", coach, null).status(), "Coach không tự duyệt chỉnh sửa của mình");
        assertEquals("Bài thử r1", call("GET", "/api/v1/exercises/" + id, admin, null).body().path("name").asString());

        assertEquals(200, call("POST", "/api/v1/exercise-revisions/" + revision + "/approve", admin, null).status());
        JsonNode applied = call("GET", "/api/v1/exercises/" + id, learner, null).body();
        assertEquals("Tên Coach đề xuất", applied.path("name").asString(), "duyệt xong học viên thấy nội dung mới");
        assertTrue(applied.path("active").asBoolean(), "bài vẫn xuất bản");
        assertEquals(0, pendingFor(admin, id).size());
        assertFalse(queueHas("EXERCISE_REVISION"));
        assertEquals(1, notificationsFor(coachId, "EXERCISE_REVISION_APPROVED"));
        assertEquals(409, call("POST", "/api/v1/exercise-revisions/" + revision + "/approve", admin, null).status(), "không duyệt lại bản đã xử lý");
    }

    @Test
    void rejectingNeedsAReasonAndKeepsThePublishedContent() throws Exception {
        long id = call("POST", "/api/v1/exercises", admin, request("r2", true)).body().path("id").asLong();
        call("PUT", "/api/v1/exercises/" + id, coach, Map.of("name", "Đề xuất không đạt"));
        long revision = pendingFor(admin, id).get(0).path("id").asLong();

        assertEquals(400, call("POST", "/api/v1/exercise-revisions/" + revision + "/reject", admin, Map.of("notes", "  ")).status(), "từ chối bắt buộc ghi lý do");
        assertEquals(200, call("POST", "/api/v1/exercise-revisions/" + revision + "/reject", admin, Map.of("notes", "Tên chưa đúng chuẩn đặt tên thư viện")).status());
        assertEquals("Bài thử r2", call("GET", "/api/v1/exercises/" + id, learner, null).body().path("name").asString());
        assertEquals(0, pendingFor(coach, id).size());
        assertEquals(1, notificationsFor(coachId, "EXERCISE_REVISION_REJECTED"));
        String msg = jdbc.queryForObject("SELECT message FROM notifications WHERE user_id = ? AND type = 'EXERCISE_REVISION_REJECTED'", String.class, coachId);
        assertTrue(msg.contains("chuẩn đặt tên"), "Coach nhận được lý do từ chối");
    }

    @Test
    void aNewerSubmissionReplacesTheOlderOne_andAnUnchangedOneIsNotQueued() throws Exception {
        long id = call("POST", "/api/v1/exercises", admin, request("r3", true)).body().path("id").asLong();
        assertEquals(200, call("PUT", "/api/v1/exercises/" + id, coach, Map.of("name", "Bài thử r3")).status(), "giống hệt bài hiện tại: không tạo bản chờ duyệt");
        assertEquals(0, pendingFor(admin, id).size());

        call("PUT", "/api/v1/exercises/" + id, coach, Map.of("name", "Phiên bản 1"));
        call("PUT", "/api/v1/exercises/" + id, coach, Map.of("name", "Phiên bản 2"));
        JsonNode pending = pendingFor(admin, id);
        assertEquals(1, pending.size(), "mỗi bài chỉ có một bản chờ duyệt");
        assertEquals("Phiên bản 2", pending.get(0).path("changes").get(0).path("after").asString());
    }

    @Test
    void coachSeesOnlyHisOwnPendingRevisions() throws Exception {
        long id = call("POST", "/api/v1/exercises", admin, request("r4", true)).body().path("id").asLong();
        call("PUT", "/api/v1/exercises/" + id, coach, Map.of("name", "Của Coach A"));
        String otherCoach = account(Role.COACH);
        assertEquals(0, pendingFor(otherCoach, id).size(), "Coach khác không thấy bản chỉnh sửa của người khác");
        assertEquals(1, pendingFor(coach, id).size());
        assertEquals(403, call("GET", "/api/v1/exercise-revisions", learner, null).status());
    }

    @Test
    void coachCanDeleteOnlyDrafts() throws Exception {
        long draft = call("POST", "/api/v1/exercises", coach, request("c1", null)).body().path("id").asLong();
        assertEquals(204, call("DELETE", "/api/v1/exercises/" + draft, coach, null).status());

        long live = call("POST", "/api/v1/exercises", admin, request("c2", true)).body().path("id").asLong();
        Resp denied = call("DELETE", "/api/v1/exercises/" + live, coach, null);
        assertEquals(403, denied.status(), denied.body().toString());
        assertTrue(denied.body().path("message").asString().contains("Admin"));
        assertTrue(listed(learner, PREFIX + "c2"), "bài đã xuất bản còn nguyên");

        assertEquals(204, call("DELETE", "/api/v1/exercises/" + live, admin, null).status());
        assertFalse(listed(learner, PREFIX + "c2"), "Admin gỡ thì học viên không còn thấy");
    }

    @Test
    void learnersAndOtherCatalogsStayRestricted() throws Exception {
        assertEquals(403, call("POST", "/api/v1/exercises", learner, request("d", null)).status());
        assertEquals(401, call("POST", "/api/v1/exercises", null, request("d", null)).status());
        assertEquals(403, call("POST", "/api/v1/exercise-categories", coach, Map.of("code", "x", "name", "x")).status(), "danh mục vẫn chỉ Admin");
        int sig = call("POST", "/api/v1/media/signature", coach, null).status();
        assertNotEquals(403, sig, "Coach được cấp chữ ký tải ảnh/video khi soạn động tác");
        assertEquals(403, call("POST", "/api/v1/media/signature", learner, null).status());
    }
}
