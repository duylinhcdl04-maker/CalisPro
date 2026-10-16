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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phân vai Level Engine v1 / giáo án mẫu / bài test đánh giá qua HTTP thật: Coach SOẠN bản nháp, Admin duyệt-xuất bản-bật tắt-xóa.
 * Coach không tự xuất bản (kể cả gài status trong body) và không sửa được bản đã xuất bản/lưu trữ.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class AuthoringGovernanceFlowTest {
    private static final String PASSWORD = "Test#12345x";
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;

    private String coach, admin, user;
    private final List<String> templateIds = new ArrayList<>();
    private final List<String> programIds = new ArrayList<>();

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

    @BeforeEach
    void setUp() throws Exception {
        String s = UUID.randomUUID().toString();
        coach = createUser("e2e-auth-coach+" + s + "@example.test", Role.COACH);
        admin = createUser("e2e-auth-admin+" + s + "@example.test", Role.ADMIN);
        user = createUser("e2e-auth-user+" + s + "@example.test", Role.USER);
    }

    @AfterEach
    void cleanup() throws Exception {
        for (String id : templateIds) call("DELETE", "/api/v1/admin/assessment-templates/" + id, admin, null);
        for (String id : programIds) call("DELETE", "/api/v1/admin/program-templates/" + id, admin, null);
        templateIds.clear();
        programIds.clear();
        jdbc.update("DELETE FROM assessment_templates WHERE name LIKE 'e2e-auth-test%' OR name LIKE 'e2e-auth-test%(Copy)'");
        jdbc.update("DELETE FROM users WHERE email LIKE 'e2e-auth-%@example.test'");
    }

    @Test
    void levelEngine_coachReadsAndValidates_butOnlyAdminActivates() throws Exception {
        Resp list = call("GET", "/api/v1/admin/level-engine/rule-sets", coach, null);
        assertEquals(200, list.status(), list.body().toString());
        assertTrue(list.body().size() > 0);
        String id = list.body().get(0).path("id").asString();
        assertEquals(200, call("GET", "/api/v1/admin/level-engine/rule-sets/" + id, coach, null).status());
        assertEquals(200, call("GET", "/api/v1/admin/level-engine/rule-sets/" + id + "/validate", coach, null).status());
        assertEquals(403, call("POST", "/api/v1/admin/level-engine/rule-sets/" + id + "/activate", coach, null).status());
        assertEquals(403, call("POST", "/api/v1/admin/level-engine/rule-sets/" + id + "/activate", user, null).status());
        assertEquals(401, call("POST", "/api/v1/admin/level-engine/rule-sets/" + id + "/activate", null, null).status());
    }

    private Map<String, Object> program(String name, String status) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name); m.put("description", "e2e"); m.put("status", status);
        m.put("levelMin", "L1"); m.put("levelMax", "L1"); m.put("primaryLevel", "L1");
        m.put("goalCodes", List.of()); m.put("daysPerWeekMin", 3); m.put("daysPerWeekMax", 3);
        m.put("sessionMinutes", 45); m.put("durationWeeks", 4); m.put("requiredEquipment", List.of());
        return m;
    }

    @Test
    void programTemplates_coachDraftsOnly_adminPublishesAndDeletes() throws Exception {
        Resp created = call("POST", "/api/v1/admin/program-templates", coach, program("e2e-auth-prog", "PUBLISHED"));
        assertEquals(201, created.status(), created.body().toString());
        String id = created.body().path("id").asString();
        programIds.add(id);
        assertEquals("DRAFT", created.body().path("status").asString(), "Coach gài status PUBLISHED vẫn chỉ ra bản nháp");

        String path = "/api/v1/admin/program-templates/" + id;
        assertEquals(200, call("PUT", path, coach, program("e2e-auth-prog 2", "PUBLISHED")).status());
        assertEquals("DRAFT", call("GET", path, coach, null).body().path("status").asString());
        assertEquals(403, call("PATCH", path + "/status", coach, Map.of("status", "PUBLISHED")).status());
        assertEquals(403, call("DELETE", path, coach, null).status());

        Resp archived = call("PATCH", path + "/status", admin, Map.of("status", "ARCHIVED"));
        assertEquals(200, archived.status(), archived.body().toString());
        assertEquals(409, call("PUT", path, coach, program("x", null)).status());
        assertEquals(204, call("DELETE", path, admin, null).status());
        programIds.clear();
    }

    @Test
    void assessmentTemplates_coachDraftsOnly_adminPublishesTogglesAndDeletes() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "e2e-auth-test"); body.put("status", "PUBLISHED"); body.put("type", "INITIAL");
        Resp saved = call("POST", "/api/v1/admin/assessment-templates", coach, body);
        assertEquals(200, saved.status(), saved.body().toString());
        String id = saved.body().path("id").asString();
        templateIds.add(id);
        assertEquals("DRAFT", saved.body().path("status").asString(), "Coach không tự xuất bản qua body");

        String path = "/api/v1/admin/assessment-templates/" + id;
        assertEquals(403, call("POST", path + "/publish", coach, null).status());
        assertEquals(403, call("PATCH", path + "/status", coach, Map.of("status", "ARCHIVED")).status());
        assertEquals(403, call("DELETE", path, coach, null).status());
        assertEquals(403, call("PUT", "/api/v1/admin/assessment-onboarding", coach, Map.of("activeTemplateId", id)).status());
        assertEquals(200, call("GET", "/api/v1/admin/assessment-onboarding", coach, null).status());
        assertEquals(200, call("POST", path + "/duplicate", coach, null).status());

        assertEquals(200, call("PATCH", path + "/status", admin, Map.of("status", "ARCHIVED")).status());
        body.put("id", id);
        assertEquals(409, call("POST", "/api/v1/admin/assessment-templates", coach, body).status());
        assertEquals(204, call("DELETE", path, admin, null).status());
        templateIds.clear();
    }

    /** Một buổi tập đúng cấu trúc: đủ 4 phần, Bài chính có bài đo được bằng AI (dead-hang), bài đặt đúng phần mà bài dùng được. */
    private Map<String, Object> fullSessionStructure() {
        java.util.function.Function<String, Map<String, Object>> ex = code -> {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("exerciseId", String.valueOf(jdbc.queryForObject("SELECT id FROM exercises WHERE code = ?", Long.class, code)));
            e.put("sets", 2); e.put("reps", "10"); e.put("prescriptionType", "FIXED_REPS");
            return e;
        };
        List<Map<String, Object>> sections = new java.util.ArrayList<>();
        for (String[] part : new String[][]{{"WARMUP", "shoulder-flexion-test"}, {"MAIN", "dead-hang"}, {"ACCESSORY", "plank"}, {"COOLDOWN", "pike-fold-test"}}) {
            Map<String, Object> sec = new LinkedHashMap<>();
            sec.put("sectionType", part[0]);
            sec.put("exercises", List.of(ex.apply(part[1])));
            sections.add(sec);
        }
        Map<String, Object> day = new LinkedHashMap<>();
        day.put("dayNumber", 1); day.put("name", "A"); day.put("dayType", "WORKOUT"); day.put("sections", sections);
        Map<String, Object> week = new LinkedHashMap<>();
        week.put("weekNumber", 1); week.put("days", List.of(day));
        Map<String, Object> structure = new LinkedHashMap<>();
        structure.put("weeks", List.of(week));
        return structure;
    }

    @Test
    void aSessionNeedsAllFourPartsAnAiMeasuredMainExerciseAndExercisesInTheirOwnPart() throws Exception {
        java.util.function.Function<String, Map<String, Object>> ex = code -> {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("exerciseId", String.valueOf(jdbc.queryForObject("SELECT id FROM exercises WHERE code = ?", Long.class, code)));
            e.put("sets", 2); e.put("reps", "10"); e.put("prescriptionType", "FIXED_REPS");
            return e;
        };
        java.util.function.Function<List<Map<String, Object>>, Map<String, Object>> session = sections ->
                Map.of("weeks", List.of(Map.of("weekNumber", 1, "days", List.of(Map.of("dayNumber", 1, "name", "A", "dayType", "WORKOUT", "sections", sections)))));
        Map<String, Object> warm = Map.of("sectionType", "WARMUP", "exercises", List.of(ex.apply("shoulder-flexion-test")));
        Map<String, Object> main = Map.of("sectionType", "MAIN", "exercises", List.of(ex.apply("dead-hang")));
        Map<String, Object> acc = Map.of("sectionType", "ACCESSORY", "exercises", List.of(ex.apply("plank")));
        Map<String, Object> cool = Map.of("sectionType", "COOLDOWN", "exercises", List.of(ex.apply("pike-fold-test")));

        record Case(String name, Map<String, Object> structure, String expected) {}
        List<Case> bad = List.of(
                new Case("e2e-auth-struct-missing", session.apply(List.of(main)), "thiếu phần"),
                new Case("e2e-auth-struct-noai", session.apply(List.of(warm, Map.of("sectionType", "MAIN", "exercises", List.of(ex.apply("knee-push-up"))), acc, cool)), "đo được bằng AI"),
                new Case("e2e-auth-struct-wrongpart", session.apply(List.of(warm, main, Map.of("sectionType", "ACCESSORY", "exercises", List.of(ex.apply("pike-fold-test"))), cool)), "không dùng được ở phần"));
        for (Case c : bad) {
            Map<String, Object> req = program(c.name(), "DRAFT");
            req.put("structure", c.structure());
            Resp created = call("POST", "/api/v1/admin/program-templates", coach, req);
            assertEquals(201, created.status(), created.body().toString());
            programIds.add(created.body().path("id").asString());
            Resp sent = call("POST", "/api/v1/admin/program-templates/" + created.body().path("id").asString() + "/submit-review", coach, null);
            assertEquals(400, sent.status(), c.name() + " " + sent.body());
            assertTrue(sent.body().path("message").asString().contains(c.expected()), c.name() + ": " + sent.body().path("message").asString());
        }
        Map<String, Object> good = program("e2e-auth-struct-good", "DRAFT");
        good.put("structure", session.apply(List.of(warm, main, acc, cool)));
        Resp created = call("POST", "/api/v1/admin/program-templates", coach, good);
        assertEquals(201, created.status(), created.body().toString());
        programIds.add(created.body().path("id").asString());
        assertEquals(200, call("POST", "/api/v1/admin/program-templates/" + created.body().path("id").asString() + "/submit-review", coach, null).status());
    }

    @Test
    void programTemplateSubmitAndPublish_notifyTheRightPeople() throws Exception {
        Map<String, Object> req = program("e2e-auth-notify", "DRAFT");
        req.put("structure", fullSessionStructure());
        Resp created = call("POST", "/api/v1/admin/program-templates", coach, req);
        assertEquals(201, created.status(), created.body().toString());
        String id = created.body().path("id").asString();
        programIds.add(id);
        String path = "/api/v1/admin/program-templates/" + id;
        try {
            Resp sent = call("POST", path + "/submit-review", coach, null);
            assertEquals(200, sent.status(), sent.body().toString());
            assertTrue(call("GET", "/api/v1/me/notifications?unreadOnly=true", admin, null).body().toString().contains("PROGRAM_TEMPLATE_SUBMITTED"), "Admin nhận thông báo chờ duyệt");

            assertEquals(200, call("PATCH", path + "/status", admin, Map.of("status", "PUBLISHED")).status());
            assertTrue(call("GET", "/api/v1/me/notifications", coach, null).body().toString().contains("PROGRAM_TEMPLATE_PUBLISHED"), "Coach (tác giả) nhận thông báo đã xuất bản");
            assertEquals(409, call("POST", path + "/submit-review", coach, null).status(), "bản đã xuất bản không gửi duyệt lại");
        } finally {
            jdbc.update("DELETE FROM notifications WHERE reference_type = 'PROGRAM_TEMPLATE' AND reference_id = ?", Long.valueOf(id));
        }
    }

    @Test
    void adminWorkQueue_listsWhatNeedsApproval_andOnlyForAdmin() throws Exception {
        assertEquals(403, call("GET", "/api/v1/admin/work-queue", coach, null).status());
        assertEquals(403, call("GET", "/api/v1/admin/work-queue", user, null).status());
        assertEquals(401, call("GET", "/api/v1/admin/work-queue", null, null).status());

        Resp created = call("POST", "/api/v1/admin/program-templates", coach, program("e2e-auth-queue", "DRAFT"));
        assertEquals(201, created.status(), created.body().toString());
        String id = created.body().path("id").asString();
        programIds.add(id);

        Resp q = call("GET", "/api/v1/admin/work-queue", admin, null);
        assertEquals(200, q.status(), q.body().toString());
        assertTrue(q.body().path("total").asInt() >= 1);
        JsonNode group = null;
        for (JsonNode g : q.body().path("groups")) if ("PROGRAM_TEMPLATE".equals(g.path("key").asString())) group = g;
        assertNotNull(group, "giáo án nháp phải nằm trong hàng chờ: " + q.body());
        assertTrue(group.path("count").asInt() >= 1);
        boolean found = false;
        for (JsonNode it : group.path("items")) if (it.path("title").asString().equals("e2e-auth-queue") && it.path("href").asString().equals("/admin/workout-plans/" + id)) found = true;
        assertTrue(found || group.path("count").asInt() > group.path("items").size(), "mục vừa tạo phải có trong danh sách (hoặc bị giới hạn số dòng hiển thị)");

        // Xuất bản xong thì rời khỏi hàng chờ
        Map<String, Object> upd = program("e2e-auth-queue", "DRAFT");
        upd.put("structure", fullSessionStructure());
        assertEquals(200, call("PUT", "/api/v1/admin/program-templates/" + id, coach, upd).status());
        int before = group.path("count").asInt();
        assertEquals(200, call("PATCH", "/api/v1/admin/program-templates/" + id + "/status", admin, Map.of("status", "PUBLISHED")).status());
        JsonNode after = null;
        for (JsonNode g : call("GET", "/api/v1/admin/work-queue", admin, null).body().path("groups")) if ("PROGRAM_TEMPLATE".equals(g.path("key").asString())) after = g;
        assertEquals(before - 1, after == null ? 0 : after.path("count").asInt());
        jdbc.update("DELETE FROM notifications WHERE reference_type = 'PROGRAM_TEMPLATE' AND reference_id = ?", Long.valueOf(id));
    }

    @Test
    void v2Templates_areValidatedAgainstTheV2RuleSet_notTheV1ScoringConfig() throws Exception {
        var ids = jdbc.queryForList("SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_INITIAL_FW2' ORDER BY id DESC LIMIT 1", Long.class);
        org.junit.jupiter.api.Assumptions.assumeFalse(ids.isEmpty(), "DB test chưa có template V2");
        Resp v = call("GET", "/api/v1/admin/assessment-templates/" + ids.get(0) + "/validation", admin, null);
        assertEquals(200, v.status(), v.body().toString());
        String errors = v.body().path("errors").toString();
        assertFalse(errors.contains("trọng số") || errors.contains("mức trình độ") || errors.contains("cách chấm điểm"), "không còn đòi cấu hình chấm điểm của v1: " + errors);
        boolean ruleSetActive = jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND status = 'ACTIVE'", Integer.class) > 0;
        assertEquals(ruleSetActive, v.body().path("valid").asBoolean(), "hợp lệ khi và chỉ khi bộ quy tắc V2 đã kích hoạt: " + errors);
    }
}
