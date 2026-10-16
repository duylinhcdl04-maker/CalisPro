package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.assessmentv2.SafetyStatusService.View;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.access.AccessDeniedException;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Connection;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Nhóm G5+/G9 trên MySQL thật: acknowledgement KHÔNG phải clearance; clearance chỉ qua rule đã publish; sticky chỉ COACH_VERIFIED. */
class SafetyClearanceIntegrationTest {
    private static JdbcTemplate jdbc;
    private static SafetyScreeningService screening;
    private static SafetyStatusService status;
    private static SafetyClearanceService clearance;
    private static SafetyGateService gate;
    private static long ruleSetId;
    private final List<Long> users = new ArrayList<>();

    @BeforeAll
    static void connect() {
        String db = System.getProperty("V2_TEST_DB", "calishealth_le_test");
        DriverManagerDataSource ds = new DriverManagerDataSource("jdbc:mysql://localhost:3306/" + db
                + "?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true", "root", "123456");
        try (Connection c = ds.getConnection()) { c.isValid(2); } catch (Exception e) { Assumptions.abort("Không có MySQL test: " + e.getMessage()); }
        jdbc = new JdbcTemplate(ds);
        Integer ready = jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2'", Integer.class);
        Assumptions.assumeTrue(ready != null && ready > 0, "Chưa chạy migration_assessment_v2_01/02 trên " + db);

        var json = JsonMapper.builder().build();
        AssessmentV2Settings settings = new AssessmentV2Settings(true, "LEVEL_ENGINE_V2", "CALISHEALTH_INITIAL_FW2", "CALISHEALTH_SAFETY_V1", 30, "1", "CALISHEALTH_PERIODIC_FW2");
        AssessmentSessionStore store = new AssessmentSessionStore(jdbc, json, settings);
        RuleSetV2Loader loader = new RuleSetV2Loader(jdbc, settings, json);
        AnswerSupport answers = new AnswerSupport(store);
        status = new SafetyStatusService(jdbc, json, settings);
        screening = new SafetyScreeningService(store, answers, status, loader, settings, jdbc, json);
        SafetyConfigLoader cfg = new SafetyConfigLoader(jdbc, json);
        clearance = new SafetyClearanceService(jdbc, json, status, cfg, loader, settings);
        gate = new SafetyGateService(status, cfg);
        ruleSetId = loader.configuredId();
    }

    @AfterEach
    void cleanup() {
        for (Long u : users) {
            jdbc.update("DELETE FROM user_safety_flags WHERE user_id = ?", u);
            jdbc.update("DELETE FROM safety_acknowledgements WHERE user_id = ?", u);
            jdbc.update("DELETE FROM safety_clearances WHERE user_id = ?", u);
            jdbc.update("UPDATE user_safety_status SET supersedes_id = NULL WHERE user_id = ?", u);
            jdbc.update("DELETE FROM user_safety_status WHERE user_id = ?", u);
            jdbc.update("DELETE FROM users WHERE id = ?", u);
        }
        users.clear();
        jdbc.update("DELETE FROM safety_clearance_rules WHERE source_type = 'TEST'");
    }

    private long newUser() {
        String email = "v2clr+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'USER', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private SafetyStatusDto screen(long user, String... yes) {
        Map<String, Object> a = new LinkedHashMap<>();
        for (String q : List.of("SF_Q1_SUPERVISED", "SF_Q2_CHEST_ACTIVE", "SF_Q3_CHEST_REST", "SF_Q4_DIZZY", "SF_Q5_JOINT_BONE", "SF_Q6_MEDICATION", "SF_Q7_OTHER"))
            a.put(q, Arrays.asList(yes).contains(q) ? "YES" : "NO");
        a.put("SF_INJURY_REGIONS", List.of("NONE"));
        StartResponse s = screening.start(user);
        List<AnswerDto> list = new ArrayList<>();
        a.forEach((k, v) -> list.add(new AnswerDto(k, v)));
        screening.saveAnswers(user, s.sessionId(), list);
        return screening.complete(user, s.sessionId());
    }

    private void testRule(String from, String scopeJson, String resulting) {
        jdbc.update("""
                INSERT INTO safety_clearance_rules (rule_set_id, from_status, flag_scope_json, method, resulting_status, reviewer_role, attestation_text_version, source_type)
                VALUES (?, ?, ?, 'SELF_ATTESTED', ?, NULL, 'att-v1', 'TEST')""", ruleSetId, from, scopeJson, resulting);
    }

    private int statusRows(long u) { return jdbc.queryForObject("SELECT COUNT(*) FROM user_safety_status WHERE user_id = ?", Integer.class, u); }

    private static ClearanceRequestDto self() { return new ClearanceRequestDto("SELF_ATTESTED", "att-v1", null); }

    private static ClearanceRequestDto coach() { return new ClearanceRequestDto("COACH_VERIFIED", null, "https://example.test/doc.pdf"); }

    // ------------------------------------------------------------------ acknowledgement

    @Test
    void acknowledgementNeverChangesStatusConstraintsOrClearance() {
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        View before = status.current(u).orElseThrow();
        assertFalse(before.acknowledged());

        AcknowledgementDto a = clearance.acknowledge(u, null);
        clearance.acknowledge(u, "1");                                    // idempotent
        View after = status.current(u).orElseThrow();

        assertEquals("REVIEW_REQUIRED", a.status());
        assertEquals(before.id(), after.id());
        assertEquals(before.status(), after.status());
        assertEquals(before.constraints(), after.constraints());
        assertEquals(before.activeFlags(), after.activeFlags());
        assertEquals("NONE", after.clearanceMethod());
        assertTrue(after.acknowledged());
        assertEquals(1, statusRows(u));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM safety_acknowledgements WHERE user_id = ?", Integer.class, u));
    }

    @Test
    void nothingToAcknowledgeWhenCleared_andStaleAdvisoryVersionIsRejected() {
        long cleared = newUser();
        screen(cleared);
        assertThrows(IllegalArgumentException.class, () -> clearance.acknowledge(cleared, null));
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        assertThrows(IllegalArgumentException.class, () -> clearance.acknowledge(u, "0"));
    }

    @Test
    void gateRequiresAcknowledgementOnlyForConfiguredActions_andAcknowledgementOnlyUnlocks() {
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> gate.check(u, "CYCLE_GENERATION"));
        assertTrue(e.getMessage().startsWith("ACKNOWLEDGEMENT_REQUIRED"));
        assertThrows(IllegalStateException.class, () -> gate.check(u, "PERIODIC_START"));
        assertDoesNotThrow(() -> gate.check(u, "VIEW_SOMETHING"));         // không nằm trong require_acknowledgement_for

        clearance.acknowledge(u, null);
        View v = gate.check(u, "CYCLE_GENERATION");
        assertEquals("REVIEW_REQUIRED", v.status().name());                // vẫn bị ràng buộc sau khi acknowledge
        assertTrue(v.constraints().contains("NO_MAX_EFFORT_TEST"));

        long c = newUser();
        screen(c);
        assertDoesNotThrow(() -> gate.check(c, "CYCLE_GENERATION"));
    }

    // ------------------------------------------------------------------ SELF_ATTESTED

    @Test
    void selfAttestedWithoutPublishedRule_isDenied_andChangesNothing() {
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> clearance.request(u, self()));
        assertTrue(e.getMessage().startsWith("CLEARANCE_METHOD_NOT_ALLOWED"));
        assertEquals("REVIEW_REQUIRED", status.current(u).orElseThrow().status().name());
        assertEquals(1, statusRows(u));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM safety_clearances WHERE user_id = ?", Integer.class, u));
    }

    @Test
    void explicitlyPublishedSelfAttestedRule_createsNewStatusRow_andKeepsTheOldOne() {
        testRule("REVIEW_REQUIRED", "{\"mode\":\"FLAGS\",\"flags\":[\"EXERTION_SYMPTOM\"]}", "CLEARED");
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        long oldId = status.current(u).orElseThrow().id();

        ClearanceDto dto = clearance.request(u, self());
        assertEquals("GRANTED", dto.status());
        assertEquals("SYSTEM_RULE", dto.decidedByType());

        View now = status.current(u).orElseThrow();
        assertEquals("CLEARED", now.status().name());
        assertEquals("SELF_ATTESTED", now.clearanceMethod());
        assertTrue(now.activeFlags().isEmpty());
        assertTrue(now.constraints().isEmpty());
        assertNotEquals(oldId, now.id());
        assertEquals("CLEARANCE", jdbc.queryForObject("SELECT origin FROM user_safety_status WHERE id = ?", String.class, now.id()));
        assertEquals("REVIEW_REQUIRED", jdbc.queryForObject("SELECT status FROM user_safety_status WHERE id = ?", String.class, oldId));  // dòng cũ bất biến
        assertEquals(0, jdbc.queryForObject("SELECT is_current FROM user_safety_status WHERE id = ?", Integer.class, oldId));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM user_safety_flags WHERE user_id = ? AND event = 'DEACTIVATED_BY_CLEARANCE' AND flag_code = 'EXERTION_SYMPTOM'", Integer.class, u));
    }

    @Test
    void selfAttestedNeverRemovesStickyFlag_evenWithAWronglyPublishedRule() {
        testRule("RESTRICTED", "{\"mode\":\"ALL\"}", "CLEARED");
        long u = newUser();
        screen(u, "SF_Q1_SUPERVISED");
        assertEquals("RESTRICTED", status.current(u).orElseThrow().status().name());
        assertThrows(IllegalArgumentException.class, () -> clearance.request(u, self()));
        assertEquals("RESTRICTED", status.current(u).orElseThrow().status().name());
        assertEquals(1, statusRows(u));
    }

    @Test
    void selfAttestedNeedsAttestationVersion() {
        testRule("REVIEW_REQUIRED", "{\"mode\":\"FLAGS\",\"flags\":[\"EXERTION_SYMPTOM\"]}", "CLEARED");
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        assertThrows(IllegalArgumentException.class, () -> clearance.request(u, new ClearanceRequestDto("SELF_ATTESTED", null, null)));
    }

    // ------------------------------------------------------------------ COACH_VERIFIED

    @Test
    void coachFlow_requestDoesNotChangeStatus_grantCreatesNewRow() {
        long u = newUser(), reviewer = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        long oldId = status.current(u).orElseThrow().id();

        ClearanceDto req = clearance.request(u, coach());
        assertEquals("REQUESTED", req.status());
        assertEquals(req.id(), clearance.request(u, coach()).id());        // không nhân bản yêu cầu đang mở
        assertEquals(oldId, status.current(u).orElseThrow().id());          // yêu cầu KHÔNG đổi status
        assertTrue(clearance.queue("REQUESTED").stream().anyMatch(c -> c.id() == req.id()));

        ClearanceDto done = clearance.decide(reviewer, true, req.id(), new ClearanceDecisionRequest("GRANTED", "CLEARED", Set.of(), "OK"));
        assertEquals("GRANTED", done.status());
        assertEquals("REVIEWER", done.decidedByType());
        View now = status.current(u).orElseThrow();
        assertEquals("CLEARED", now.status().name());
        assertEquals("COACH_VERIFIED", now.clearanceMethod());
        assertEquals(oldId, jdbc.queryForObject("SELECT supersedes_id FROM user_safety_status WHERE id = ?", Long.class, now.id()));
        assertThrows(IllegalStateException.class, () -> clearance.decide(reviewer, true, req.id(), new ClearanceDecisionRequest("GRANTED", "CLEARED", Set.of(), null)));
    }

    @Test
    void coachRejection_requiresReason_andLeavesStatusUntouched() {
        long u = newUser(), reviewer = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        ClearanceDto req = clearance.request(u, coach());
        assertThrows(IllegalArgumentException.class, () -> clearance.decide(reviewer, true, req.id(), new ClearanceDecisionRequest("REJECTED", null, null, " ")));
        ClearanceDto rejected = clearance.decide(reviewer, true, req.id(), new ClearanceDecisionRequest("REJECTED", null, null, "Thiếu tài liệu"));
        assertEquals("REJECTED", rejected.status());
        assertEquals("REVIEW_REQUIRED", status.current(u).orElseThrow().status().name());
        assertEquals(1, statusRows(u));
        assertEquals("REQUESTED", clearance.request(u, coach()).status());  // được nộp lại
    }

    @Test
    void restrictedNeedsCoach_stickyFlagRemovedAuditable_retainedConstraintsSurviveRescreen() {
        long u = newUser(), coachUser = newUser();
        screen(u, "SF_Q1_SUPERVISED");
        ClearanceDto req = clearance.request(u, coach());

        assertThrows(AccessDeniedException.class, () -> clearance.decide(coachUser, false, req.id(), new ClearanceDecisionRequest("GRANTED", "REVIEW_REQUIRED", Set.of(), null)));
        assertThrows(IllegalArgumentException.class, () -> clearance.decide(coachUser, true, req.id(),
                new ClearanceDecisionRequest("GRANTED", "REVIEW_REQUIRED", Set.of("NOT_A_CONSTRAINT"), null)));
        ClearanceDto done = clearance.decide(coachUser, true, req.id(), new ClearanceDecisionRequest("GRANTED", "REVIEW_REQUIRED", Set.of("NO_MAX_EFFORT_TEST"), "Giữ giới hạn test tối đa"));

        assertEquals(Set.of("EXISTING_CONDITION"), done.removedFlags());
        View now = status.current(u).orElseThrow();
        assertEquals("REVIEW_REQUIRED", now.status().name());
        assertTrue(now.activeFlags().isEmpty());
        assertEquals(Set.of("NO_MAX_EFFORT_TEST"), now.constraints());
        assertEquals(1, jdbc.queryForObject("""
                SELECT COUNT(*) FROM user_safety_flags WHERE user_id = ? AND flag_code = 'EXISTING_CONDITION' AND event = 'DEACTIVATED_BY_CLEARANCE' AND clearance_id = ?""",
                Integer.class, u, done.id()));

        SafetyStatusDto rescreened = screen(u);                              // sàng lọc lại toàn "Không"
        assertTrue(rescreened.constraints().contains("NO_MAX_EFFORT_TEST"), "ràng buộc giữ lại phải sống qua lần sàng lọc lại");
        assertFalse(rescreened.activeFlags().stream().anyMatch(f -> f.code().equals("EXISTING_CONDITION")));
    }

    @Test
    void staleRequestIsRejectedAfterTheStatusChanged() {
        long u = newUser(), reviewer = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        ClearanceDto req = clearance.request(u, coach());
        screen(u, "SF_Q2_CHEST_ACTIVE");                                      // sàng lọc lại ⇒ dòng status mới
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> clearance.decide(reviewer, true, req.id(),
                new ClearanceDecisionRequest("GRANTED", "CLEARED", Set.of(), null)));
        assertTrue(e.getMessage().startsWith("STALE_REQUEST"));
    }

    @Test
    void cannotRequestClearanceWhenAlreadyCleared_orWithUnknownMethod() {
        long u = newUser();
        screen(u);
        assertThrows(IllegalArgumentException.class, () -> clearance.request(u, coach()));
        long r = newUser();
        screen(r, "SF_Q2_CHEST_ACTIVE");
        assertThrows(IllegalArgumentException.class, () -> clearance.request(r, new ClearanceRequestDto("TRUST_ME", null, null)));
        assertThrows(IllegalArgumentException.class, () -> clearance.request(r, new ClearanceRequestDto("NONE", null, null)));
    }

    // ------------------------------------------------------------------ chi tiết cho Coach (§38.4)

    @Test
    void detailShowsCurrentContextAndOnlyTheOutcomesTheRulesAllow() {
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        ClearanceDto req = clearance.request(u, coach());
        ClearanceDetailDto d = clearance.detail(true, req.id());

        assertEquals("REVIEW_REQUIRED", d.currentStatus());
        assertFalse(d.stale());
        assertTrue(d.canDecide());
        assertTrue(d.activeFlags().stream().anyMatch(f -> f.code().equals("EXERTION_SYMPTOM")));
        assertTrue(d.constraints().contains("NO_MAX_EFFORT_TEST"));
        assertFalse(d.options().isEmpty(), "seed có rule COACH_VERIFIED cho REVIEW_REQUIRED");
        for (ResultingOptionDto o : d.options()) {                           // mọi lựa chọn hiển thị đều phải quyết định được (cùng bộ lọc với decide)
            long other = newUserWithReview(), reviewer = newUser();
            ClearanceDto r = clearance.request(other, coach());
            ClearanceDto done = clearance.decide(reviewer, true, r.id(), new ClearanceDecisionRequest("GRANTED", o.resultingStatus(), Set.of(), null));
            assertEquals("GRANTED", done.status());
            assertEquals(o.resultingStatus(), done.resultingStatus());
        }
    }

    private long newUserWithReview() { long x = newUser(); screen(x, "SF_Q2_CHEST_ACTIVE"); return x; }

    @Test
    void detailMarksStaleRequestsAndBlocksDeciding() {
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");
        ClearanceDto req = clearance.request(u, coach());
        screen(u, "SF_Q2_CHEST_ACTIVE");                                      // dòng status mới
        ClearanceDetailDto d = clearance.detail(true, req.id());
        assertTrue(d.stale());
        assertFalse(d.canDecide());
    }

    @Test
    void adminCannotDecideRestrictedAndDetailSaysSo() {
        long u = newUser();
        screen(u, "SF_Q1_SUPERVISED");                                        // RESTRICTED
        ClearanceDto req = clearance.request(u, coach());
        assertEquals("RESTRICTED", clearance.detail(false, req.id()).currentStatus());
        assertFalse(clearance.detail(false, req.id()).canDecide(), "Admin không được gỡ RESTRICTED");
        assertTrue(clearance.detail(true, req.id()).canDecide());
        assertThrows(IllegalArgumentException.class, () -> clearance.detail(true, 99_999_999L));
    }
}
