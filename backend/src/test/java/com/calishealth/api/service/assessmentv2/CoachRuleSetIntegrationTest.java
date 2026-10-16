package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.RuleSetGovernanceDtos.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Connection;
import java.util.*;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Coach soạn rule set V2 trên MySQL thật (cần migration 01, 02, 05, 06, 07): clone đầy đủ, sửa có nhật ký + validator, gửi duyệt, Admin duyệt/kích hoạt,
 * phạm vi review bắt buộc, kích hoạt lưu trữ bản ACTIVE cũ. Mỗi lệnh gọi service được bọc trong transaction như khi chạy trong Spring.
 */
class CoachRuleSetIntegrationTest {
    private static JdbcTemplate jdbc;
    private static TransactionTemplate tx;
    private static CoachRuleSetService service;
    private static RuleSetV2Loader loader;
    private static long seedId;
    private final List<Long> users = new ArrayList<>();

    @BeforeAll
    static void connect() {
        String db = System.getProperty("V2_TEST_DB", "calishealth_le_test");
        SingleConnectionDataSource ds = new SingleConnectionDataSource("jdbc:mysql://localhost:3306/" + db
                + "?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true", "root", "123456", true);
        try (Connection c = ds.getConnection()) { c.isValid(2); } catch (Exception e) { Assumptions.abort("Không có MySQL test: " + e.getMessage()); }
        jdbc = new JdbcTemplate(ds);
        Integer ready = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'rule_set_changes'", Integer.class);
        Assumptions.assumeTrue(ready != null && ready > 0, "Chưa chạy migration_assessment_v2_07 trên " + db);
        tx = new TransactionTemplate(new DataSourceTransactionManager(ds));
        service = new CoachRuleSetService(jdbc);
        var json = JsonMapper.builder().build();
        loader = new RuleSetV2Loader(jdbc, new AssessmentV2Settings(true, "LEVEL_ENGINE_V2", "CALISHEALTH_INITIAL_FW2", "CALISHEALTH_SAFETY_V1", 30, "1", "CALISHEALTH_PERIODIC_FW2"), json);
        seedId = jdbc.queryForObject("SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1", Long.class);
    }

    @AfterEach
    void cleanup() {
        for (Long id : jdbc.queryForList("SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version > 1", Long.class)) {
            jdbc.update("DELETE FROM rule_set_changes WHERE rule_set_id = ?", id);
            jdbc.update("DELETE FROM rule_set_reviews WHERE rule_set_id = ?", id);
            jdbc.update("DELETE r FROM level_requirements r JOIN fitness_levels f ON f.id = r.level_id WHERE f.rule_set_id = ?", id);
            jdbc.update("DELETE FROM fitness_levels WHERE rule_set_id = ?", id);
            jdbc.update("DELETE p FROM progression_stage_prerequisites p JOIN progression_stages s ON s.id = p.stage_id JOIN progression_ladders l ON l.id = s.ladder_id WHERE l.rule_set_id = ?", id);
            jdbc.update("DELETE s FROM progression_stages s JOIN progression_ladders l ON l.id = s.ladder_id WHERE l.rule_set_id = ?", id);
            for (String t : List.of("progression_ladders", "engine_parameters", "consistency_rules", "safety_flag_constraints", "safety_clearance_rules", "safety_policies", "safety_rules", "safety_flag_defs"))
                jdbc.update("DELETE FROM " + t + " WHERE rule_set_id = ?", id);
            jdbc.update("DELETE FROM rule_sets WHERE id = ?", id);
        }
        for (Long u : users) jdbc.update("DELETE FROM users WHERE id = ?", u);
        users.clear();
    }

    // ------------------------------------------------------------------ helpers

    private long coach() {
        String email = "v2coach+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'COACH', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private long admin() {
        String email = "v2admin+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'ADMIN', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private <T> T run(Supplier<T> s) { return tx.execute(st -> s.get()); }

    private static UpdateRuleSetRequest params(ParamUpdate... p) { return new UpdateRuleSetRequest(null, List.of(p), null, null); }

    private RuleSetDetail draftBy(long coach) { return run(() -> service.clone(coach, seedId)); }

    private double param(long ruleSetId, String key) {
        return jdbc.queryForObject("SELECT param_value FROM engine_parameters WHERE rule_set_id = ? AND param_key = ?", Double.class, ruleSetId, key);
    }


    // ------------------------------------------------------------------ clone

    @Test
    void clone_copiesEveryPartOfTheRuleSet_andTheLoaderReadsItIdentically() {
        long a = coach();
        RuleSetDetail d = draftBy(a);
        long id = d.summary().id();
        assertEquals("DRAFT", d.summary().status());
        assertEquals(a, d.summary().authorId());
        assertEquals(seedId, d.summary().parentId());
        assertTrue(d.summary().version() > 1);

        for (String[] t : new String[][]{{"engine_parameters", "rule_set_id"}, {"fitness_levels", "rule_set_id"}, {"progression_ladders", "rule_set_id"}, {"consistency_rules", "rule_set_id"},
                {"safety_flag_defs", "rule_set_id"}, {"safety_rules", "rule_set_id"}, {"safety_flag_constraints", "rule_set_id"}, {"safety_policies", "rule_set_id"}, {"safety_clearance_rules", "rule_set_id"}})
            assertEquals(count(t[0], t[1], seedId), count(t[0], t[1], id), t[0]);
        assertEquals(jdbc.queryForObject("SELECT COUNT(*) FROM level_requirements r JOIN fitness_levels f ON f.id = r.level_id WHERE f.rule_set_id = ?", Integer.class, seedId),
                jdbc.queryForObject("SELECT COUNT(*) FROM level_requirements r JOIN fitness_levels f ON f.id = r.level_id WHERE f.rule_set_id = ?", Integer.class, id));
        String stageSql = "SELECT COUNT(*) FROM progression_stages s JOIN progression_ladders l ON l.id = s.ladder_id WHERE l.rule_set_id = ?";
        assertEquals(jdbc.queryForObject(stageSql, Integer.class, seedId), jdbc.queryForObject(stageSql, Integer.class, id));
        String prereqSql = "SELECT COUNT(*) FROM progression_stage_prerequisites p JOIN progression_stages s ON s.id = p.stage_id JOIN progression_ladders l ON l.id = s.ladder_id WHERE l.rule_set_id = ?";
        assertEquals(jdbc.queryForObject(prereqSql, Integer.class, seedId), jdbc.queryForObject(prereqSql, Integer.class, id));
        // tiên quyết của bản sao trỏ vào stage của CHÍNH bản sao (không trỏ về rule set nguồn)
        assertEquals(0, jdbc.queryForObject("""
                SELECT COUNT(*) FROM progression_stage_prerequisites p
                JOIN progression_stages s ON s.id = p.stage_id JOIN progression_ladders l ON l.id = s.ladder_id
                JOIN progression_stages q ON q.id = p.prerequisite_stage_id JOIN progression_ladders lq ON lq.id = q.ladder_id
                WHERE l.rule_set_id = ? AND lq.rule_set_id <> ?""", Integer.class, id, id));

        RuleSetV2 src = loader.load(seedId), copy = loader.load(id);
        assertEquals(src.ladders().size(), copy.ladders().size());
        assertEquals(src.levels().size(), copy.levels().size());
        assertEquals(src.primaryCompetencies(), copy.primaryCompetencies());
        assertEquals(src.textParams(), copy.textParams());
        assertEquals(src.consistencyRules().size(), copy.consistencyRules().size());
        assertEquals(0, d.validationErrors().size(), String.valueOf(d.validationErrors()));
        assertEquals(new ArrayList<>(new TreeSet<>(CoachRuleSetService.SCOPES)), d.requiredReviewScopes(), "chưa từng kích hoạt bản nào: Admin phải duyệt mọi phạm vi");
    }

    private int count(String table, String col, long id) { return jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE " + col + " = ?", Integer.class, id); }

    // ------------------------------------------------------------------ sửa

    @Test
    void editing_changesOnlyTheDraft_logsOldAndNew_andDerivesTheRequiredReviewScopes() {
        long a = coach();
        long id = draftBy(a).summary().id();
        double before = param(seedId, "regression.confirmations");
        RuleSetDetail d = run(() -> service.update(a, id, new UpdateRuleSetRequest("điều chỉnh", List.of(
                new ParamUpdate("regression.confirmations", 3.0, null, null, "Coach: 3 lần đo liên tiếp"),
                new ParamUpdate("overall.weight.PUSH", 0.25, null, null, null),
                new ParamUpdate("baseline.attempt_aggregation", null, "MEAN", null, null)), null, null)));
        assertEquals(3.0, param(id, "regression.confirmations"));
        assertEquals(before, param(seedId, "regression.confirmations"), "rule set nguồn không bị đụng tới");
        assertEquals(3, d.changes().size());
        ChangeView c = d.changes().stream().filter(x -> x.targetKey().equals("regression.confirmations")).findFirst().orElseThrow();
        assertEquals(String.valueOf(before), c.oldValue());
        assertEquals("3.0", c.newValue());
        assertEquals(a, c.actorId());
        assertTrue(d.requiredReviewScopes().containsAll(List.of("OTHER", "WEIGHTS")));
        assertEquals("điều chỉnh", d.summary().notes());
    }

    @Test
    void levelThresholdsAndRequirementsAreEditable_andValidatedTogether() {
        long a = coach();
        RuleSetDetail created = draftBy(a);
        long id = created.summary().id();
        LevelView l4 = created.levels().stream().filter(l -> l.code().equals("L4")).findFirst().orElseThrow();
        RequirementView pushReq = l4.requirements().stream().filter(r -> r.gate().equals("COMPETENCY") && r.competency().equals("PUSH")).findFirst().orElseThrow();

        RuleSetDetail d = run(() -> service.update(a, id, new UpdateRuleSetRequest(null, null,
                List.of(new LevelUpdate("L4", 90.0, 82.0, null)), List.of(new RequirementUpdate(pushReq.id(), 82.0)))));
        LevelView after = d.levels().stream().filter(l -> l.code().equals("L4")).findFirst().orElseThrow();
        assertEquals(90.0, after.promoteMin());
        assertEquals(82.0, after.regressBelow());
        assertEquals(82.0, after.requirements().stream().filter(r -> r.id() == pushReq.id()).findFirst().orElseThrow().value());
        assertTrue(d.requiredReviewScopes().contains("LEVEL_REQUIREMENTS"));

        // yêu cầu không thuộc rule set này bị từ chối
        long foreign = jdbc.queryForObject("SELECT r.id FROM level_requirements r JOIN fitness_levels f ON f.id = r.level_id WHERE f.rule_set_id = ? LIMIT 1", Long.class, seedId);
        assertThrows(IllegalArgumentException.class, () -> run(() -> service.update(a, id, new UpdateRuleSetRequest(null, null, null, List.of(new RequirementUpdate(foreign, 1.0))))));
    }

    @Test
    void invalidEdit_isRejectedAsAWhole_andNothingIsPersisted() {
        long a = coach();
        long id = draftBy(a).summary().id();
        double aggregateBefore = param(id, "regression.confirmations");
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> run(() -> service.update(a, id, params(
                new ParamUpdate("regression.confirmations", 5.0, null, null, null),                // hợp lệ
                new ParamUpdate("initial.max_level_rank", 3.0, null, null, null)))));               // vi phạm I18
        assertTrue(e.getMessage().startsWith("RULESET_INVALID") && e.getMessage().contains("I18"));
        assertEquals(aggregateBefore, param(id, "regression.confirmations"), "yêu cầu bị hoàn tác toàn bộ");
        assertEquals(0, count("rule_set_changes", "rule_set_id", id));
    }

    @Test
    void onlyExistingParametersOfTheRightKindCanBeEdited() {
        long a = coach();
        long id = draftBy(a).summary().id();
        assertThrows(IllegalArgumentException.class, () -> run(() -> service.update(a, id, params(new ParamUpdate("not.a.real.param", 1.0, null, null, null)))));
        assertThrows(IllegalArgumentException.class, () -> run(() -> service.update(a, id, params(new ParamUpdate("baseline.attempt_aggregation", 1.0, null, null, null)))));   // tham số chữ
        assertThrows(IllegalArgumentException.class, () -> run(() -> service.update(a, id, params(new ParamUpdate("ewma.alpha", null, "x", null, null)))));                       // tham số số
        assertThrows(IllegalArgumentException.class, () -> run(() -> service.update(a, id, params(new ParamUpdate("ewma.alpha", null, null, null, null)))));
        assertEquals(0, count("rule_set_changes", "rule_set_id", id));
    }

    @Test
    void onlyTheAuthorEditsADraft_andAnActiveOrPendingRuleSetIsImmutable() {
        long a = coach(), b = coach();
        long id = draftBy(a).summary().id();
        assertThrows(AccessDeniedException.class, () -> run(() -> service.update(b, id, params(new ParamUpdate("ewma.alpha", 0.4, null, null, null)))));
        assertThrows(AccessDeniedException.class, () -> run(() -> service.submit(b, id)));
        run(() -> service.submit(a, id));
        assertTrue(assertThrows(IllegalStateException.class, () -> run(() -> service.update(a, id, params(new ParamUpdate("ewma.alpha", 0.4, null, null, null))))).getMessage().startsWith("RULESET_NOT_DRAFT"));
    }

    @Test
    void aSystemAuthoredDraft_isClaimedByTheFirstCoachWhoEdits() {
        long a = coach(), b = coach();
        long id = draftBy(a).summary().id();
        jdbc.update("UPDATE rule_sets SET author_id = NULL WHERE id = ?", id);
        run(() -> service.update(a, id, params(new ParamUpdate("ewma.alpha", 0.4, null, null, null))));
        assertEquals(a, jdbc.queryForObject("SELECT author_id FROM rule_sets WHERE id = ?", Long.class, id));
        assertThrows(AccessDeniedException.class, () -> run(() -> service.update(b, id, params(new ParamUpdate("ewma.alpha", 0.3, null, null, null)))));
    }

    // ------------------------------------------------------------------ gửi duyệt, Admin duyệt + kích hoạt

    @Test
    void afterSubmission_theDraftIsImmutable_andOnlyTheAuthorCanSubmit() {
        long a = coach(), b = coach();
        long id = draftBy(a).summary().id();
        assertThrows(AccessDeniedException.class, () -> run(() -> service.submit(b, id)));
        RuleSetDetail pending = run(() -> service.submit(a, id));
        assertEquals("PENDING_REVIEW", pending.summary().status());
        assertNotNull(pending.summary().submittedAt());
        assertTrue(assertThrows(IllegalStateException.class, () -> run(() -> service.update(a, id, params(new ParamUpdate("ewma.alpha", 0.4, null, null, null))))).getMessage().startsWith("RULESET_NOT_DRAFT"));
        assertTrue(assertThrows(IllegalStateException.class, () -> run(() -> service.submit(a, id))).getMessage().startsWith("RULESET_NOT_DRAFT"));
        assertEquals(List.of(id), service.listByStatus("PENDING_REVIEW").stream().map(RuleSetSummary::id).filter(x -> x == id).toList());
    }

    @Test
    void anInvalidDraftCannotBeSubmitted() {
        long a = coach();
        long id = draftBy(a).summary().id();
        jdbc.update("UPDATE engine_parameters SET param_value = 3 WHERE rule_set_id = ? AND param_key = 'initial.max_level_rank'", id);   // dữ liệu hỏng ngoài API
        assertTrue(assertThrows(IllegalArgumentException.class, () -> run(() -> service.submit(a, id))).getMessage().startsWith("RULESET_INVALID"));
        assertEquals("DRAFT", jdbc.queryForObject("SELECT status FROM rule_sets WHERE id = ?", String.class, id));
    }

    @Test
    void adminApproval_activatesAtOnce_recordsTheReviews_andFirstActivationCoversEveryScope() {
        long a = coach(), admin = admin();
        long id = draftBy(a).summary().id();
        run(() -> service.update(a, id, params(new ParamUpdate("regression.confirmations", 3.0, null, null, null))));
        assertTrue(assertThrows(IllegalStateException.class, () -> run(() -> service.decide(admin, id, new DecisionRequest("APPROVED", null)))).getMessage().startsWith("RULESET_NOT_PENDING_REVIEW"));
        run(() -> service.submit(a, id));

        RuleSetDetail done = run(() -> service.decide(admin, id, new DecisionRequest("approved", "Đã xem nhật ký thay đổi")));
        assertEquals("ACTIVE", done.summary().status());
        assertNotNull(done.summary().activatedAt());
        // lần kích hoạt đầu của dòng rule set: chưa từng có ai duyệt phần an toàn => phê duyệt mọi phạm vi
        assertEquals(new TreeSet<>(CoachRuleSetService.SCOPES), done.reviews().stream().map(ReviewView::scope).collect(java.util.stream.Collectors.toCollection(TreeSet::new)));
        assertTrue(done.reviews().stream().allMatch(r -> r.reviewerId() == admin && r.decision().equals("APPROVED")));
        assertEquals("DRAFT", jdbc.queryForObject("SELECT status FROM rule_sets WHERE id = ?", String.class, seedId), "bản v1 do migration không bị đụng tới");
        // bất biến V01 của _03_verify: rule set ACTIVE phải có review APPROVED
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets s WHERE s.id = ? AND s.status = 'ACTIVE' AND EXISTS (SELECT 1 FROM rule_set_reviews r WHERE r.rule_set_id = s.id AND r.decision = 'APPROVED')", Integer.class, id));
    }

    @Test
    void laterActivations_onlyNeedTheChangedScopes_andArchiveThePreviousActiveVersion() {
        long a = coach(), admin = admin();
        long first = draftBy(a).summary().id();
        run(() -> service.submit(a, first));
        run(() -> service.decide(admin, first, new DecisionRequest("APPROVED", null)));

        long second = draftBy(a).summary().id();
        run(() -> service.update(a, second, params(new ParamUpdate("overall.weight.PUSH", 0.25, null, null, null))));
        RuleSetDetail d = run(() -> service.detail(second));
        assertEquals(List.of("WEIGHTS"), d.requiredReviewScopes());
        run(() -> service.submit(a, second));
        RuleSetDetail active = run(() -> service.decide(admin, second, new DecisionRequest("APPROVED", null)));
        assertEquals(List.of("WEIGHTS"), active.reviews().stream().map(ReviewView::scope).toList());
        assertEquals("ARCHIVED", jdbc.queryForObject("SELECT status FROM rule_sets WHERE id = ?", String.class, first));
        assertEquals("ACTIVE", jdbc.queryForObject("SELECT status FROM rule_sets WHERE id = ?", String.class, second));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND status = 'ACTIVE'", Integer.class));
        assertEquals("ACTIVE", jdbc.queryForObject("SELECT status FROM rule_sets WHERE code = 'LEVEL_ENGINE' AND version = 2", String.class), "rule set của Level Engine cũ không bị đụng tới");

        // thay đổi ngưỡng level => phạm vi LEVEL_REQUIREMENTS
        long third = draftBy(a).summary().id();
        run(() -> service.update(a, third, new UpdateRuleSetRequest(null, null, List.of(new LevelUpdate("L4", 90.0, 82.0, null)), null)));
        assertEquals(List.of("LEVEL_REQUIREMENTS"), run(() -> service.detail(third)).requiredReviewScopes());
    }

    @Test
    void changesRequested_needsNotes_returnsToDraft_andTheCoachCanResubmit() {
        long a = coach(), admin = admin();
        long id = draftBy(a).summary().id();
        run(() -> service.update(a, id, params(new ParamUpdate("ewma.alpha", 0.4, null, null, null))));
        run(() -> service.submit(a, id));
        assertTrue(assertThrows(IllegalArgumentException.class, () -> run(() -> service.decide(admin, id, new DecisionRequest("CHANGES_REQUESTED", " ")))).getMessage().startsWith("NOTES_REQUIRED"));
        assertThrows(IllegalArgumentException.class, () -> run(() -> service.decide(admin, id, new DecisionRequest("MAYBE", "x"))));

        RuleSetDetail back = run(() -> service.decide(admin, id, new DecisionRequest("CHANGES_REQUESTED", "alpha quá thấp")));
        assertEquals("DRAFT", back.summary().status());
        assertNull(back.summary().submittedAt());
        assertEquals("CHANGES_REQUESTED", back.reviews().get(0).decision());
        assertNull(back.summary().activatedAt());

        run(() -> service.update(a, id, params(new ParamUpdate("ewma.alpha", 0.5, null, null, null))));
        run(() -> service.submit(a, id));
        assertEquals("ACTIVE", run(() -> service.decide(admin, id, new DecisionRequest("APPROVED", null))).summary().status());
    }

    @Test
    void anAdminCannotApproveARuleSetTheyAuthoredThemselves() {
        long admin = admin();
        long id = draftBy(admin).summary().id();                 // Admin cũng vào được đường /coach/** và có thể soạn
        run(() -> service.submit(admin, id));
        assertThrows(AccessDeniedException.class, () -> run(() -> service.decide(admin, id, new DecisionRequest("APPROVED", null))));
        assertEquals("PENDING_REVIEW", jdbc.queryForObject("SELECT status FROM rule_sets WHERE id = ?", String.class, id));
    }

    @Test
    void aDraftThatIsNotPendingReview_cannotBeDecided() {
        long a = coach(), admin = admin();
        long id = draftBy(a).summary().id();
        assertTrue(assertThrows(IllegalStateException.class, () -> run(() -> service.decide(admin, id, new DecisionRequest("APPROVED", null)))).getMessage().startsWith("RULESET_NOT_PENDING_REVIEW"));
    }

    @Test
    void onlyV2RuleSetsAreVisibleThroughThisApi() {
        long v1 = jdbc.queryForObject("SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE' LIMIT 1", Long.class);
        assertThrows(IllegalArgumentException.class, () -> service.detail(v1));
        assertTrue(service.list().stream().allMatch(s -> s.code().equals("LEVEL_ENGINE_V2")));
    }
}
