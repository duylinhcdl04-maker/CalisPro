package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Connection;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tích hợp trên MySQL thật (mặc định DB scratch calishealth_le_test; đổi bằng -DV2_TEST_DB=...). Bỏ qua nếu không kết nối được hoặc chưa chạy
 * migration_assessment_v2_01/02. Không cần Spring context: các service dựng tay với JdbcTemplate.
 * Mỗi test tạo user riêng và dọn sạch sau khi chạy.
 */
class InitialAssessmentV2IntegrationTest {
    private static JdbcTemplate jdbc;
    private static InitialAssessmentV2Service initial;
    private static SafetyScreeningService safety;
    private final List<Long> users = new ArrayList<>();

    @BeforeAll
    static void connect() throws Exception {
        String db = System.getProperty("V2_TEST_DB", "calishealth_le_test");
        DriverManagerDataSource ds = new DriverManagerDataSource("jdbc:mysql://localhost:3306/" + db
                + "?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true", "root", "123456");
        try (Connection c = ds.getConnection()) { c.isValid(2); } catch (Exception e) { Assumptions.abort("Không có MySQL test: " + e.getMessage()); }
        jdbc = new JdbcTemplate(ds);
        Integer ready = jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2'", Integer.class);
        Assumptions.assumeTrue(ready != null && ready > 0, "Chưa chạy migration_assessment_v2_01/02 trên " + db);

        ObjectMapper json = JsonMapper.builder().build();
        AssessmentV2Settings settings = new AssessmentV2Settings(true, "LEVEL_ENGINE_V2", "CALISHEALTH_INITIAL_FW2", "CALISHEALTH_SAFETY_V1", 30, "1", "CALISHEALTH_PERIODIC_FW2");
        AssessmentSessionStore store = new AssessmentSessionStore(jdbc, json, settings);
        RuleSetV2Loader loader = new RuleSetV2Loader(jdbc, settings, json);
        AnswerSupport answers = new AnswerSupport(store);
        SafetyStatusService status = new SafetyStatusService(jdbc, json, settings);
        safety = new SafetyScreeningService(store, answers, status, loader, settings, jdbc, json);
        initial = new InitialAssessmentV2Service(store, answers, status, loader, settings, jdbc, json);
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
    }

    // ------------------------------------------------------------------ helpers

    private long newUser() {
        String email = "v2test+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'USER', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private static List<AnswerDto> list(Map<String, Object> m) {
        List<AnswerDto> out = new ArrayList<>();
        m.forEach((k, v) -> out.add(new AnswerDto(k, v)));
        return out;
    }

    private SafetyStatusDto screen(long user, String... yesQuestions) {
        Map<String, Object> a = new LinkedHashMap<>();
        for (String q : List.of("SF_Q1_SUPERVISED", "SF_Q2_CHEST_ACTIVE", "SF_Q3_CHEST_REST", "SF_Q4_DIZZY", "SF_Q5_JOINT_BONE", "SF_Q6_MEDICATION", "SF_Q7_OTHER"))
            a.put(q, Arrays.asList(yesQuestions).contains(q) ? "YES" : "NO");
        a.put("SF_INJURY_REGIONS", List.of("NONE"));
        StartResponse s = safety.start(user);
        safety.saveAnswers(user, s.sessionId(), list(a));
        return safety.complete(user, s.sessionId());
    }

    private static Map<String, Object> base(String experience) {
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("IA2_AGE", 30); a.put("IA2_EXP_MONTHS", experience); a.put("IA2_TRAIN_DAYS", "D3");
        a.put("IA2_MOB_DEEP_SQUAT", "CAN"); a.put("IA2_MOB_OVERHEAD", "EASY"); a.put("IA2_MOB_TOE_TOUCH", "CAN");
        a.put("IA2_PRIMARY_GOAL", "FIRST_PULL_UP"); a.put("IA2_TRAINING_FOCUS", "HEALTH"); a.put("IA2_DAYS_PER_WEEK", "DAYS_3"); a.put("IA2_SESSION_MINUTES", "M45");
        a.put("IA2_EQUIPMENT", List.of("PULL_UP_BAR"));
        return a;
    }

    private static void ladder(Map<String, Object> a, String comp, String node, Number value, String recency, String form) {
        a.put("IA2_" + comp + "_NODE", node);
        if (value != null) a.put("IA2_" + comp + "_VALUE", value);
        if (recency != null) a.put("IA2_" + comp + "_RECENCY", recency);
        if (form != null) a.put("IA2_" + comp + "_FORM_CONF", form);
    }

    /** Kịch bản A: tự khai báo trung bình (PULL yếu) ⇒ L1 (điểm tổng 43.7). */
    private static Map<String, Object> scenarioA(String experience) {
        Map<String, Object> a = base(experience);
        ladder(a, "PUSH", "dips", 6, "RECENT_30D", "VERY");
        a.put("IA2_PUSH_VERIFY", 25);
        ladder(a, "PULL", "australian-pull-up", 11, "RECENT_1_6M", "MODERATE");
        ladder(a, "LEGS", "bulgarian-split-squat", 8, "RECENT_30D", "MODERATE");
        ladder(a, "CORE", "hollow-body-hold", 40, "RECENT_30D", "VERY");
        ladder(a, "SKILL", "crow-pose", 10, "ESTIMATE", "SLIGHT");
        return a;
    }

    private InitialResultDto run(long user, Map<String, Object> answers) {
        StartResponse s = initial.start(user);
        initial.saveAnswers(user, s.sessionId(), list(answers));
        return initial.complete(user, s.sessionId());
    }

    private static Double score(InitialResultDto r, String comp) {
        return r.competencies().stream().filter(c -> c.code().equals(comp)).findFirst().orElseThrow().score();
    }

    // ------------------------------------------------------------------ tests

    @Test
    void initialRequiresSafetyScreening() {
        long u = newUser();
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> initial.start(u));
        assertTrue(e.getMessage().startsWith("SAFETY_SCREENING_REQUIRED"));
    }

    @Test
    void safetyStatusFollowsFlags_andNeverBlocksTheInitialQuestionnaire() {
        long u = newUser();
        SafetyStatusDto review = screen(u, "SF_Q2_CHEST_ACTIVE");
        assertEquals("REVIEW_REQUIRED", review.status());
        assertTrue(review.constraints().contains("NO_MAX_EFFORT_TEST"));
        assertDoesNotThrow(() -> initial.start(u));

        long r = newUser();
        SafetyStatusDto restricted = screen(r, "SF_Q1_SUPERVISED");
        assertEquals("RESTRICTED", restricted.status());
        assertTrue(restricted.activeFlags().stream().anyMatch(f -> f.code().equals("EXISTING_CONDITION") && f.sticky()));
        assertDoesNotThrow(() -> initial.start(r));              // blocked_actions rỗng ⇒ vẫn làm được bảng câu hỏi

        long c = newUser();
        assertEquals("CLEARED", screen(c).status());
    }

    @Test
    void stickyFlagSurvivesAnotherScreeningWithoutIt() {
        long u = newUser();
        screen(u, "SF_Q1_SUPERVISED");
        SafetyStatusDto again = screen(u);                       // lần 2 trả lời toàn "Không"
        assertEquals("RESTRICTED", again.status());
        assertTrue(again.activeFlags().stream().anyMatch(f -> f.code().equals("EXISTING_CONDITION")));
    }

    @Test
    void scenarioA_providesProvisionalL1_withEvidenceAndIsIdempotent() {
        long u = newUser();
        screen(u);
        InitialResultDto r = run(u, scenarioA("M6_12"));

        assertEquals(43.7, r.overallScore(), 0.01);
        assertEquals(56.0, score(r, "PUSH"), 1e-6);
        assertEquals(28.25, score(r, "PULL"), 1e-6);
        assertEquals("L1", r.level().finalLevel());
        assertEquals("L1", r.level().candidateLevel());
        assertFalse(r.level().capApplied());
        assertEquals("PROVISIONAL", r.level().levelStatus());
        assertEquals("NOT_VERIFIED", r.level().verificationStatus());
        assertEquals("SELF_REPORTED", r.level().source());
        assertEquals("HIGH", r.dataQuality());
        assertEquals("dips", r.progression().stream().filter(l -> l.competency().equals("PUSH")).findFirst().orElseThrow().highestAchievedStage());

        // bằng chứng: lưu mọi stage, kể cả bậc thấp (INFERRED) và bậc chưa đo
        Integer evidence = jdbc.queryForObject("SELECT COUNT(*) FROM assessment_evidence WHERE session_id = ?", Integer.class, r.sessionId());
        assertEquals(28, evidence);
        assertEquals("INFERRED_PASS", jdbc.queryForObject("""
                SELECT e.status FROM assessment_evidence e JOIN progression_stages s ON s.id = e.stage_id
                WHERE e.session_id = ? AND s.code = 'dead-hang'""", String.class, r.sessionId()));

        // kinh nghiệm chỉ là ngữ cảnh; mobility có điểm riêng; hồ sơ không vào điểm
        assertTrue(r.contextualAnswers().stream().anyMatch(a -> a.questionCode().equals("IA2_EXP_MONTHS")));
        assertTrue(r.contributingAnswers().stream().noneMatch(a -> a.questionCode().equals("IA2_EXP_MONTHS") || a.questionCode().equals("IA2_AGE")));

        InitialResultDto again = initial.complete(u, r.sessionId());                 // idempotent: cùng kết quả, không nhân bản bằng chứng
        assertEquals(r.overallScore(), again.overallScore());
        assertEquals(evidence, jdbc.queryForObject("SELECT COUNT(*) FROM assessment_evidence WHERE session_id = ?", Integer.class, r.sessionId()));
        assertEquals("COMPLETED", jdbc.queryForObject("SELECT status FROM assessment_sessions WHERE id = ?", String.class, r.sessionId()));
    }

    @Test
    void selfReportedL4Claims_areCappedAtL2_provisional() {
        long u = newUser();
        screen(u);
        Map<String, Object> a = base("GT_12M");
        a.put("IA2_MOB_DEEP_SQUAT", "VERY_EASY"); a.put("IA2_MOB_OVERHEAD", "VERY_EASY"); a.put("IA2_MOB_TOE_TOUCH", "VERY_EASY");
        ladder(a, "PUSH", "handstand-push-up", 8, "RECENT_30D", "VERY");
        ladder(a, "PULL", "muscle-up", 5, "RECENT_30D", "VERY");
        ladder(a, "LEGS", "pistol-squat", 8, "RECENT_30D", "VERY");
        ladder(a, "CORE", "dragon-flag", 8, "RECENT_30D", "VERY");
        ladder(a, "SKILL", "freestanding-handstand-push-up", 5, "RECENT_30D", "VERY");
        InitialResultDto r = run(u, a);

        assertEquals("L4", r.level().candidateLevel());
        assertEquals("L4", r.level().gatedLevel());
        assertEquals("L2", r.level().finalLevel());
        assertTrue(r.level().capApplied());
        assertEquals("PROVISIONAL", r.level().levelStatus());
        assertEquals("PASS_SELF_REPORTED", r.level().gates().get("skill"));
        assertTrue(r.reasons().stream().anyMatch(x -> x.code().equals("INITIAL_LEVEL_CAP_APPLIED")));
    }

    @Test
    void notTriedIsInsufficientEvidence_notZero_notFail() {
        long u = newUser();
        screen(u);
        Map<String, Object> a = scenarioA("M6_12");
        a.keySet().removeIf(k -> k.startsWith("IA2_PULL_"));
        a.put("IA2_PULL_NODE", "NOT_TRIED");                                           // không có xà đơn
        InitialResultDto r = run(u, a);

        assertNull(score(r, "PULL"));
        assertEquals("NO_EVIDENCE", r.progression().stream().filter(l -> l.competency().equals("PULL")).findFirst().orElseThrow().evidenceState());
        assertTrue(r.reasons().stream().anyMatch(x -> x.code().equals("INSUFFICIENT_EVIDENCE") && "PULL".equals(x.subject())));
        assertTrue(r.reasons().stream().noneMatch(x -> x.code().equals("COMPETENCY_GATE_FAILED") && "PULL".equals(x.subject())));
        assertEquals(0, jdbc.queryForObject("""
                SELECT COUNT(*) FROM assessment_evidence e JOIN progression_stages s ON s.id = e.stage_id JOIN progression_ladders l ON l.id = s.ladder_id
                WHERE e.session_id = ? AND l.code = 'PULL_LADDER' AND e.status = 'FAIL'""", Integer.class, r.sessionId()));
    }

    @Test
    void experienceNeverChangesCompetencyScores() {
        long u1 = newUser(), u2 = newUser();
        screen(u1); screen(u2);
        InitialResultDto none = run(u1, scenarioA("NONE"));
        InitialResultDto lots = run(u2, scenarioA("GT_12M"));
        for (String c : List.of("PUSH", "PULL", "LEGS", "CORE", "MOBILITY", "SKILL")) assertEquals(score(none, c), score(lots, c), c);
        assertEquals(none.overallScore(), lots.overallScore());
        assertEquals(none.level().finalLevel(), lots.level().finalLevel());
    }

    @Test
    void safetyStatusNeverChangesScoresOrLevel() {
        long cleared = newUser(), restricted = newUser();
        screen(cleared); screen(restricted, "SF_Q1_SUPERVISED", "SF_Q2_CHEST_ACTIVE");
        InitialResultDto a = run(cleared, scenarioA("M6_12"));
        InitialResultDto b = run(restricted, scenarioA("M6_12"));
        for (String c : List.of("PUSH", "PULL", "LEGS", "CORE", "MOBILITY", "SKILL")) assertEquals(score(a, c), score(b, c), c);
        assertEquals(a.level().finalLevel(), b.level().finalLevel());
        assertEquals("CLEARED", a.safety().status());
        assertEquals("RESTRICTED", b.safety().status());
    }

    @Test
    void neverTrainedButStrongClaims_isConflictedAndDowngraded() {
        long u = newUser();
        screen(u);
        Map<String, Object> a = scenarioA("NONE");
        ladder(a, "PULL", "pull-up", 12, "RECENT_30D", "VERY");                         // chưa từng tập nhưng 12 pull-up
        InitialResultDto r = run(u, a);
        assertEquals("CONFLICTED", r.dataQuality());
        assertTrue(r.consistencyFlags().stream().anyMatch(f -> f.code().equals("C01") && f.severity().equals("CONFLICT")));
        assertTrue(r.competencies().stream().anyMatch(c -> c.code().equals("PULL") && c.needsVerification()));
        assertNotNull(score(r, "PULL"));                                                 // đáp án KHÔNG bị xoá hay tự đổi điểm
    }

    @Test
    void changingTheNodeRemovesDependentAnswers_andHiddenAnswersAreRejected() {
        long u = newUser();
        screen(u);
        StartResponse s = initial.start(u);
        initial.saveAnswers(u, s.sessionId(), list(new LinkedHashMap<>(Map.of("IA2_PUSH_NODE", "push-up", "IA2_PUSH_VALUE", 12))));
        SaveAnswersResponse r = initial.saveAnswers(u, s.sessionId(), list(new LinkedHashMap<>(Map.of("IA2_PUSH_NODE", "NOT_TRIED"))));
        assertTrue(r.removedQuestions().contains("IA2_PUSH_VALUE"));
        assertThrows(IllegalArgumentException.class, () -> initial.saveAnswers(u, s.sessionId(), list(Map.of("IA2_PUSH_VALUE", 5))));
    }

    @Test
    void invalidAnswersAreRejected_andIncompleteCannotComplete() {
        long u = newUser();
        screen(u);
        StartResponse s = initial.start(u);
        assertThrows(IllegalArgumentException.class, () -> initial.saveAnswers(u, s.sessionId(), list(Map.of("IA2_EXP_MONTHS", "FOREVER"))));
        assertThrows(IllegalArgumentException.class, () -> initial.saveAnswers(u, s.sessionId(), list(Map.of("IA2_AGE", 5))));
        assertThrows(IllegalArgumentException.class, () -> initial.saveAnswers(u, s.sessionId(), list(Map.of("NO_SUCH_QUESTION", "x"))));
        assertThrows(IllegalArgumentException.class, () -> initial.saveAnswers(u, s.sessionId(),
                list(new LinkedHashMap<>(Map.of("IA2_PUSH_NODE", "push-up", "IA2_PUSH_VALUE", 99999)))));
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> initial.complete(u, s.sessionId()));
        assertTrue(e.getMessage().startsWith("ASSESSMENT_INCOMPLETE"));
    }

    @Test
    void anotherUserCannotTouchTheSession() {
        long owner = newUser(), other = newUser();
        screen(owner); screen(other);
        StartResponse s = initial.start(owner);
        assertThrows(IllegalArgumentException.class, () -> initial.questions(other, s.sessionId()));
        assertThrows(IllegalArgumentException.class, () -> initial.complete(other, s.sessionId()));
    }

    @Test
    void startingAgainResumesTheOpenSession() {
        long u = newUser();
        screen(u);
        StartResponse first = initial.start(u);
        StartResponse second = initial.start(u);
        assertEquals(first.sessionId(), second.sessionId());
        assertTrue(second.resumed());
    }
}
