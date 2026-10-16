package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.EmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Cầu nối V2 -> v1 khi V2 chạy thật (cả context Spring, V2 bật): khảo sát rồi Baseline thực hành phải xuất hiện đúng ở các bảng v1
 * (level, năng lực, ràng buộc, mục tiêu, chu kỳ tập) mà trang Lộ trình đọc.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true",
        "app.assessment-v2.enabled=true", "app.assessment-v2.allow-draft=true"})
class V2LevelBridgeIntegrationTest {
    private static final Set<String> HOLDS = Set.of("plank", "dead-hang", "hollow-body-hold", "l-sit", "wall-pike-hold", "crow-pose", "chest-to-wall-handstand", "handstand");

    @Autowired JdbcTemplate jdbc;
    @Autowired SafetyScreeningService safety;
    @Autowired InitialAssessmentV2Service initial;
    @Autowired BaselineService baseline;
    @Autowired V2LevelBridge bridge;
    @Autowired com.calishealth.api.service.level.PlanChoiceService planChoice;
    @Autowired com.calishealth.api.service.level.SelfPlanService selfPlan;
    @Autowired PeriodicAssessmentV2Service periodic;
    @Autowired PeriodicEligibilityService eligibility;
    @Autowired com.calishealth.api.service.level.TrainingLogService trainingLog;
    @Autowired com.calishealth.api.service.level.ExerciseRecommendationService recommendations;
    @MockitoBean EmailService emailService;
    private final List<Long> users = new ArrayList<>();
    private Instant clock = Instant.now().minusSeconds(4 * 3600);

    @AfterEach
    void cleanup() {
        for (Long u : users) {
            jdbc.update("DELETE e FROM workout_session_exercises e JOIN workout_sessions s ON s.id = e.workout_session_id WHERE s.user_id = ?", u);
            jdbc.update("DELETE FROM workout_sessions WHERE user_id = ?", u);
            jdbc.update("DELETE FROM notifications WHERE user_id = ?", u);
            jdbc.update("DELETE e FROM workout_plan_exercises e JOIN workout_plan_days d ON d.id = e.workout_plan_day_id JOIN workout_plans p ON p.id = d.workout_plan_id WHERE p.user_id = ?", u);
            jdbc.update("DELETE d FROM workout_plan_days d JOIN workout_plans p ON p.id = d.workout_plan_id WHERE p.user_id = ?", u);
            jdbc.update("DELETE FROM workout_plans WHERE user_id = ?", u);
            for (String t : List.of("user_skill_progress", "user_competency_scores", "user_level_state", "user_goals", "user_training_constraints", "baseline_deferrals",
                    "level_decisions_v2", "user_level_state_v2", "user_safety_flags", "safety_acknowledgements", "safety_clearances"))
                jdbc.update("DELETE FROM " + t + " WHERE user_id = ?", u);
            jdbc.update("DELETE FROM level_evaluations WHERE user_id = ?", u);
            jdbc.update("DELETE p FROM l4_review_packages p WHERE p.user_id = ?", u);
            jdbc.update("DELETE c FROM assessment_recording_consents c WHERE c.user_id = ?", u);
            for (String t : List.of("assessment_metrics", "assessment_attempts", "assessment_evidence", "assessment_ladder_results", "assessment_reliability", "assessment_consistency_flags"))
                jdbc.update("DELETE x FROM " + t + " x JOIN assessment_sessions s ON s.id = x.session_id WHERE s.user_id = ?", u);
            jdbc.update("DELETE x FROM assessment_responses x JOIN assessment_sessions s ON s.id = x.assessment_session_id WHERE s.user_id = ?", u);
            jdbc.update("DELETE c FROM assessment_result_competencies c JOIN assessment_results r ON r.id = c.result_id JOIN assessment_sessions s ON s.id = r.session_id WHERE s.user_id = ?", u);
            jdbc.update("DELETE r FROM assessment_results r JOIN assessment_sessions s ON s.id = r.session_id WHERE s.user_id = ?", u);
            jdbc.update("DELETE FROM assessment_sessions WHERE user_id = ?", u);
            jdbc.update("UPDATE user_safety_status SET supersedes_id = NULL WHERE user_id = ?", u);
            jdbc.update("DELETE FROM user_safety_status WHERE user_id = ?", u);
            jdbc.update("DELETE FROM users WHERE id = ?", u);
        }
        users.clear();
    }

    private long newUser() {
        String email = "v2bridge+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'USER', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private void screen(long user) {
        List<AnswerDto> a = new ArrayList<>();
        for (String q : List.of("SF_Q1_SUPERVISED", "SF_Q2_CHEST_ACTIVE", "SF_Q3_CHEST_REST", "SF_Q4_DIZZY", "SF_Q5_JOINT_BONE", "SF_Q6_MEDICATION", "SF_Q7_OTHER")) a.add(new AnswerDto(q, "NO"));
        a.add(new AnswerDto("SF_INJURY_REGIONS", List.of("NONE")));
        StartResponse s = safety.start(user);
        safety.saveAnswers(user, s.sessionId(), a);
        safety.complete(user, s.sessionId());
    }

    private static void ladder(Map<String, Object> a, String comp, String node, Number value, String recency, String form) {
        a.put("IA2_" + comp + "_NODE", node);
        if (value != null) a.put("IA2_" + comp + "_VALUE", value);
        if (recency != null) a.put("IA2_" + comp + "_RECENCY", recency);
        if (form != null) a.put("IA2_" + comp + "_FORM_CONF", form);
    }

    /** Khảo sát trung bình (PULL yếu) cho L1, kèm lịch tập, dụng cụ và mục tiêu để kiểm tra việc sao chép ràng buộc. */
    private InitialResultDto survey(long user) {
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("IA2_AGE", 30); a.put("IA2_EXP_MONTHS", "M6_12"); a.put("IA2_TRAIN_DAYS", "D3");
        a.put("IA2_MOB_DEEP_SQUAT", "CAN"); a.put("IA2_MOB_OVERHEAD", "EASY"); a.put("IA2_MOB_TOE_TOUCH", "CAN");
        a.put("IA2_PRIMARY_GOAL", "FIRST_PULL_UP"); a.put("IA2_TRAINING_FOCUS", "SKILL"); a.put("IA2_DAYS_PER_WEEK", "DAYS_3"); a.put("IA2_SESSION_MINUTES", "M45");
        a.put("IA2_EQUIPMENT", List.of("PULL_UP_BAR"));
        ladder(a, "PUSH", "dips", 6, "RECENT_30D", "VERY"); a.put("IA2_PUSH_VERIFY", 25);
        ladder(a, "PULL", "australian-pull-up", 11, "RECENT_1_6M", "MODERATE");
        ladder(a, "LEGS", "bulgarian-split-squat", 8, "RECENT_30D", "MODERATE");
        ladder(a, "CORE", "hollow-body-hold", 40, "RECENT_30D", "VERY");
        ladder(a, "SKILL", "crow-pose", 10, "ESTIMATE", "SLIGHT");
        StartResponse s = initial.start(user);
        List<AnswerDto> list = new ArrayList<>();
        a.forEach((k, v) -> list.add(new AnswerDto(k, v)));
        initial.saveAnswers(user, s.sessionId(), list);
        return initial.complete(user, s.sessionId());
    }

    private SubmitAttemptRequest attempt(String exercise, double value) {
        Instant start = clock.plusSeconds(300), end = start.plusSeconds(60);
        clock = end;
        boolean hold = HOLDS.contains(exercise);
        return new SubmitAttemptRequest(exercise, System.nanoTime() % 1_000_000_000L + new Random().nextInt(1000), start, end,
                hold ? null : (int) value, hold ? null : (int) value, hold ? value : null, null, 85.0, 80.0, 0, 0.9, 0.9, 0.95, false, null);
    }

    private void baselineToL1(long user) {
        long s = baseline.start(user).sessionId();
        for (Object[] t : new Object[][]{{"incline-push-up", 20}, {"plank", 60}, {"push-up", 25}, {"dead-hang", 40}, {"australian-pull-up", 8},
                {"hollow-body-hold", 20}, {"bodyweight-squat", 25}, {"dips", 0}, {"pull-up", 0}}) {
            BaselineProgressDto p = baseline.submitAttempt(user, s, attempt((String) t[0], ((Number) t[1]).doubleValue()));
            if (!"IN_PROGRESS".equals(p.outcome())) { assertEquals("VERIFIED", p.outcome()); return; }
        }
        fail("Baseline không kết thúc");
    }

    private Map<String, Object> state(long u) { return jdbc.queryForMap("SELECT level_code, status FROM user_level_state WHERE user_id = ?", u); }

    @Test
    void surveyThenBaseline_flowIntoTheV1Tables() {
        long u = newUser();
        screen(u);

        // 1. Khảo sát: level tạm thời, năng lực, ràng buộc, mục tiêu, skill tree, chu kỳ đầu tiên
        InitialResultDto r = survey(u);
        assertEquals("L1", r.level().finalLevel());
        assertEquals("L1", state(u).get("level_code"));
        assertEquals("PROVISIONAL", state(u).get("status"));
        assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM user_competency_scores WHERE user_id = ?", Integer.class, u) >= 5, "mỗi năng lực có điểm hiện tại");
        assertEquals("SELF_REPORTED", jdbc.queryForObject("SELECT source FROM user_competency_scores WHERE user_id = ? LIMIT 1", String.class, u));
        var c = jdbc.queryForMap("SELECT days_per_week, session_minutes, equipment_json FROM user_training_constraints WHERE user_id = ?", u);
        assertEquals(3, ((Number) c.get("days_per_week")).intValue());
        assertEquals(45, ((Number) c.get("session_minutes")).intValue());
        assertTrue(String.valueOf(c.get("equipment_json")).contains("PULL_UP_BAR"));
        assertEquals("FIRST_PULL_UP", jdbc.queryForObject("SELECT g.code FROM user_goals ug JOIN goals g ON g.id = ug.goal_id WHERE ug.user_id = ? AND ug.priority = 1", String.class, u));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM level_evaluations WHERE user_id = ? AND basis = 'V2_INITIAL'", Integer.class, u));
        // Chưa chọn cách tập: hệ thống KHÔNG tự sinh chu kỳ; người dùng phải quyết định trước
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", Integer.class, u));
        assertTrue(planChoice.status(u).needsDecision());
        planChoice.choose(u, "SYSTEM", "HEALTH");
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", Integer.class, u));
        assertFalse(planChoice.status(u).needsDecision());
        assertEquals("HEALTH", planChoice.status(u).trainingFocus());
        assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM user_skill_progress WHERE user_id = ?", Integer.class, u) > 0, "skill tree được khởi tạo từ tự khai");

        // Khảo sát chỉ phân loại level và chỉ làm một lần: không mở lại được
        IllegalStateException again = assertThrows(IllegalStateException.class, () -> initial.start(u));
        assertTrue(again.getMessage().startsWith("INITIAL_ALREADY_DONE"), again.getMessage());

        // 2. Baseline thực hành: level đã xác minh, chu kỳ mới
        baselineToL1(u);
        assertEquals("L1", state(u).get("level_code"));
        assertEquals("VERIFIED", state(u).get("status"));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM level_evaluations WHERE user_id = ? AND basis = 'V2_BASELINE'", Integer.class, u));
        assertEquals("BASELINE_RECALIBRATION", jdbc.queryForObject("SELECT generation_reason FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", String.class, u));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", Integer.class, u), "luôn đúng một chu kỳ đang chạy");

        // 3. Chạy lại cầu nối không nhân đôi (idempotent)
        long session = jdbc.queryForObject("SELECT MAX(session_id) FROM level_decisions_v2 WHERE user_id = ?", Long.class, u);
        bridge.syncDecision(u, session, "BASELINE");
        assertEquals(2, jdbc.queryForObject("SELECT COUNT(*) FROM level_evaluations WHERE user_id = ?", Integer.class, u));
    }

    @Test
    void aSelfReportedSurveyNeverOverwritesAMeasuredLevel() {
        long u = newUser();
        screen(u);
        baselineToL1(u);
        assertEquals("VERIFIED", state(u).get("status"));
        // V2 đã chặn làm lại khảo sát sau khi có level đo thực tế; cầu nối cũng tự bảo vệ nếu có đường nào khác lọt qua
        assertThrows(IllegalStateException.class, () -> survey(u));
        long anySession = jdbc.queryForObject("SELECT MAX(id) FROM assessment_sessions WHERE user_id = ?", Long.class, u);
        bridge.syncInitial(u, anySession);
        assertEquals("VERIFIED", state(u).get("status"));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM level_evaluations WHERE user_id = ? AND basis = 'V2_INITIAL'", Integer.class, u));
    }

    @Test
    void selfListIsNotOverwrittenAndNeverChangesLevel() {
        long u = newUser();
        screen(u);
        survey(u);
        List<Long> ex = jdbc.queryForList("SELECT id FROM exercises WHERE active = 1 ORDER BY id LIMIT 3", Long.class);
        var view = selfPlan.save(u, new com.calishealth.api.dto.PlanChoiceDtos.SaveSelfPlanRequest(List.of(
                new com.calishealth.api.dto.PlanChoiceDtos.SelfPlanItemInput(ex.get(0), 4, 6, 10, null, 60),
                new com.calishealth.api.dto.PlanChoiceDtos.SelfPlanItemInput(ex.get(1), null, null, null, 30, null))));
        assertTrue(view.active());
        assertEquals(2, view.items().size());
        assertEquals(4, view.items().get(0).sets());
        assertEquals(30, view.items().get(1).holdSec());
        var status = planChoice.status(u);
        assertEquals("SELF", status.effectiveMode());
        assertEquals("SELF", status.activePlanSource());
        assertFalse(status.needsDecision());
        long planId = status.activePlanId();
        assertEquals("USER_SELF_BUILT", jdbc.queryForObject("SELECT generation_reason FROM workout_plans WHERE id = ?", String.class, planId));

        // Danh sách trùng bài bị từ chối
        assertThrows(IllegalArgumentException.class, () -> selfPlan.save(u, new com.calishealth.api.dto.PlanChoiceDtos.SaveSelfPlanRequest(List.of(
                new com.calishealth.api.dto.PlanChoiceDtos.SelfPlanItemInput(ex.get(0), null, null, null, null, null),
                new com.calishealth.api.dto.PlanChoiceDtos.SelfPlanItemInput(ex.get(0), null, null, null, null, null)))));

        // Level mới do Baseline không đè danh sách tự tạo
        baselineToL1(u);
        assertEquals("VERIFIED", state(u).get("status"));
        assertEquals(planId, jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", Long.class, u));

        // Muốn nâng/hạ level phải tập theo giáo án hệ thống: đo định kỳ bị khóa khi đang tự tạo
        IllegalStateException locked = assertThrows(IllegalStateException.class, () -> periodic.start(u));
        assertTrue(locked.getMessage().startsWith("SYSTEM_PLAN_REQUIRED"), locked.getMessage());

        // Chuyển sang giáo án hệ thống: có chu kỳ hệ thống mới, danh sách tự tạo được giữ lại; hết bị khóa vì lý do giáo án
        var system = planChoice.choose(u, "SYSTEM", null);
        assertEquals("SYSTEM", system.activePlanSource());
        assertNotEquals(planId, system.activePlanId());
        assertEquals(2, selfPlan.get(u).items().size());
        IllegalStateException next = assertThrows(IllegalStateException.class, () -> periodic.start(u));
        assertFalse(next.getMessage().startsWith("SYSTEM_PLAN_REQUIRED"), next.getMessage());
    }

    @Test
    void recommendationsFollowTheUsersState() {
        // Chưa làm khảo sát: bài nền tảng cho người mới
        long u = newUser();
        var none = recommendations.recommend(u);
        assertEquals("FOUNDATION", none.source());
        assertFalse(none.items().isEmpty());

        // Đã khảo sát nhưng chưa tập theo giáo án hệ thống: theo mục tiêu đã chọn (FIRST_PULL_UP)
        screen(u);
        survey(u);
        var byGoal = recommendations.recommend(u);
        assertEquals("GOAL", byGoal.source());
        assertFalse(byGoal.items().isEmpty());

        // Đang tập theo giáo án hệ thống: các bài trong chu kỳ hiện tại
        planChoice.choose(u, "SYSTEM", null);
        var byPlan = recommendations.recommend(u);
        assertEquals("PLAN", byPlan.source());
        assertFalse(byPlan.items().isEmpty());
    }

    /** Chỉ bài nằm trong giáo án HỆ THỐNG (và thuộc buổi của giáo án đó) mới là bằng chứng nâng level: buổi tự do, danh sách tự tạo, bài ngoài giáo án đều không. */
    @Test
    void trainingEvidenceIgnoresSelfBuiltSessions() {
        long u = newUser();
        screen(u);
        survey(u);
        long ex = jdbc.queryForObject("SELECT id FROM exercises WHERE active = 1 ORDER BY id LIMIT 1", Long.class);
        selfPlan.save(u, new com.calishealth.api.dto.PlanChoiceDtos.SaveSelfPlanRequest(List.of(new com.calishealth.api.dto.PlanChoiceDtos.SelfPlanItemInput(ex, null, null, null, null, null))));
        long selfPlanId = jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? AND generation_reason = 'USER_SELF_BUILT'", Long.class, u);
        session(u, selfPlanId, ex);
        assertEquals(0, trainingLog.observations(u, 30).size(), "buổi tập của danh sách tự tạo không được tính");

        planChoice.choose(u, "SYSTEM", null);
        long systemPlanId = jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", Long.class, u);
        long inPlan = jdbc.queryForObject("SELECT e.exercise_id FROM workout_plan_exercises e JOIN workout_plan_days d ON d.id = e.workout_plan_day_id WHERE d.workout_plan_id = ? ORDER BY e.id LIMIT 1", Long.class, systemPlanId);
        long outOfPlan = jdbc.queryForObject("SELECT id FROM exercises WHERE active = 1 AND id NOT IN (SELECT e.exercise_id FROM workout_plan_exercises e JOIN workout_plan_days d ON d.id = e.workout_plan_day_id WHERE d.workout_plan_id = ?) ORDER BY id LIMIT 1", Long.class, systemPlanId);
        session(u, systemPlanId, outOfPlan);
        session(u, null, inPlan);
        assertEquals(0, trainingLog.observations(u, 30).size(), "bài ngoài giáo án và buổi tự do không được tính");
        session(u, systemPlanId, inPlan);
        assertEquals(1, trainingLog.observations(u, 30).size(), "bài trong giáo án hệ thống được tính");
    }

    private void session(long user, Long planId, long exercise) {
        jdbc.update("INSERT INTO workout_sessions (user_id, workout_plan_id, started_at, completed_at, status) VALUES (?, ?, NOW(6), NOW(6), 'COMPLETED')", user, planId);
        long id = jdbc.queryForObject("SELECT MAX(id) FROM workout_sessions WHERE user_id = ?", Long.class, user);
        jdbc.update("INSERT INTO workout_session_exercises (workout_session_id, exercise_id, completed_sets, sequence_no) VALUES (?, ?, 1, 1)", id, exercise);
    }

    /** Đo định kỳ chỉ mở khi chu kỳ hệ thống kết thúc (hết ngày hoặc làm đủ buổi); không có ngoại lệ mở sớm. */
    @Test
    void periodicOpensOnlyWhenTheCycleEnds() {
        long u = newUser();
        screen(u);
        baselineToL1(u);
        planChoice.choose(u, "SYSTEM", null);
        // Qua ngưỡng ngày tối thiểu để chỉ còn điều kiện hết chu kỳ
        jdbc.update("UPDATE user_level_state_v2 SET last_assessed_at = ? WHERE user_id = ?", java.sql.Timestamp.from(Instant.now().minusSeconds(20L * 86400)), u);
        long planId = jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", Long.class, u);
        jdbc.update("UPDATE workout_plans SET end_date = DATE_ADD(CURDATE(), INTERVAL 10 DAY) WHERE id = ?", planId);

        IllegalStateException inCycle = assertThrows(IllegalStateException.class, () -> periodic.start(u));
        assertTrue(inCycle.getMessage().startsWith("CYCLE_IN_PROGRESS"), inCycle.getMessage());
        assertEquals("CYCLE_IN_PROGRESS", periodic.myLevel(u).orElseThrow().periodicGate());

        // Hết ngày kết thúc chu kỳ: mở
        jdbc.update("UPDATE workout_plans SET end_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) WHERE id = ?", planId);
        assertEquals("OPEN", periodic.myLevel(u).orElseThrow().periodicGate());
        assertNotNull(periodic.start(u).sessionId());

    }

    /** Làm đủ số buổi đã lên lịch cũng kết thúc chu kỳ dù chưa tới ngày kết thúc. */
    @Test
    void completingAllPlannedSessionsEndsTheCycle() {
        long u = newUser();
        screen(u);
        baselineToL1(u);
        planChoice.choose(u, "SYSTEM", null);
        jdbc.update("UPDATE user_level_state_v2 SET last_assessed_at = ? WHERE user_id = ?", java.sql.Timestamp.from(Instant.now().minusSeconds(20L * 86400)), u);
        long planId = jdbc.queryForObject("SELECT id FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", Long.class, u);
        jdbc.update("UPDATE workout_plans SET end_date = DATE_ADD(CURDATE(), INTERVAL 30 DAY) WHERE id = ?", planId);
        int planned = jdbc.queryForObject("SELECT COUNT(*) FROM workout_plan_days WHERE workout_plan_id = ? AND rest_day = 0", Integer.class, planId);
        long ex = jdbc.queryForObject("SELECT id FROM exercises WHERE active = 1 ORDER BY id LIMIT 1", Long.class);
        assertTrue(planned > 0);
        for (int i = 0; i < planned - 1; i++) session(u, planId, ex);
        assertEquals("CYCLE_IN_PROGRESS", periodic.myLevel(u).orElseThrow().periodicGate());
        session(u, planId, ex);
        var level = periodic.myLevel(u).orElseThrow();
        assertEquals("OPEN", level.periodicGate());
        assertEquals(planned, level.cycleSessionsDone());
    }

    /** Bài chưa tập đủ buổi bị coi là chưa quen; tập đủ thì quen. */
    @Test
    void familiarityNeedsEnoughCompletedSessions() {
        long u = newUser();
        long ex = jdbc.queryForObject("SELECT id FROM exercises WHERE active = 1 ORDER BY id LIMIT 1", Long.class);
        String code = jdbc.queryForObject("SELECT code FROM exercises WHERE id = ?", String.class, ex);
        assertTrue(eligibility.familiar(u, List.of(code), 2).isEmpty());
        session(u, null, ex);
        assertTrue(eligibility.familiar(u, List.of(code), 2).isEmpty(), "một buổi chưa đủ");
        session(u, null, ex);
        assertEquals(Set.of(code), eligibility.familiar(u, List.of(code), 2));
    }

    /** Đo định kỳ chưa đủ để lên level: gợi ý bài cho phần yếu; khi đạt rồi hoặc không có kết luận như vậy thì quay lại gợi ý theo giáo án. */
    @Test
    void weakAreasAreRecommendedAfterANoPromotionResult() {
        long u = newUser();
        screen(u);
        baselineToL1(u);
        planChoice.choose(u, "SYSTEM", null);
        assertEquals("PLAN", recommendations.recommend(u).source());
        long session = jdbc.queryForObject("SELECT MAX(id) FROM assessment_sessions WHERE user_id = ?", Long.class, u);
        jdbc.update("INSERT INTO level_decisions_v2 (user_id, session_id, kind, outcome, decision, level_before, level_after, reason_code, created_at) VALUES (?, ?, 'PERIODIC', 'DECIDED', 'MAINTAINED', 'L1', 'L1', 'BELOW_LEVEL_STANDARD', NOW(6))", u, session);
        var weak = recommendations.recommend(u);
        assertEquals("WEAK_AREAS", weak.source());
        assertFalse(weak.items().isEmpty());
    }

    /** Nhãn "Đề xuất cho bạn": không chọn gì thì không có; tự tạo/không theo hệ thống thì theo hướng đã chọn; theo giáo án hệ thống thì các bài trong giáo án. */
    @Test
    void recommendedIdsFollowFocusOrTheSystemPlan() {
        long u = newUser();
        assertEquals("NONE", recommendations.recommendedIds(u).source());
        screen(u);
        survey(u);
        assertEquals("SKILL", planChoice.status(u).trainingFocus(), "hướng tập lấy từ câu trả lời trong khảo sát");
        var skill = recommendations.recommendedIds(u);
        assertEquals("FOCUS", skill.source());
        assertFalse(skill.ids().isEmpty());
        planChoice.choose(u, "SYSTEM", null);
        var plan = recommendations.recommendedIds(u);
        assertEquals("PLAN", plan.source());
        assertFalse(plan.ids().isEmpty());
        // Giáo án hệ thống không phụ thuộc số buổi khai báo: đổi 1 buổi/tuần vẫn có giáo án dựng theo level
        jdbc.update("UPDATE user_training_constraints SET days_per_week = 1, session_minutes = 10 WHERE user_id = ?", u);
        planChoice.choose(u, "SYSTEM", null);
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE'", Integer.class, u));
        assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM workout_plan_days d JOIN workout_plans p ON p.id = d.workout_plan_id WHERE p.user_id = ? AND p.status = 'ACTIVE' AND d.rest_day = 0", Integer.class, u) >= 3,
                "không cắt buổi theo số ngày khai báo");
    }
}
