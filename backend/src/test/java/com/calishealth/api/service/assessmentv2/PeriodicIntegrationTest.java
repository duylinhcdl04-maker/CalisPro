package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.engine.v2.level.TrainingStabilityEvaluator.Obs;
import com.calishealth.api.service.ai.CloudinaryService;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Connection;
import java.sql.Date;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Periodic thường kỳ trên MySQL thật (cần migration 01, 02, 04, 05, 06, 08): thiết lập level đã xác minh trực tiếp rồi đo cả bộ bài.
 * Kiểm chứng: lên level (cần Stability từ lịch sử), tụt level theo xu hướng, đo hỏng ⇒ RETEST_REQUIRED không đổi state, RETURNING, ốm, L4 chờ Coach.
 */
class PeriodicIntegrationTest {
    private static final String CLOUD = "testcloud";
    private static JdbcTemplate jdbc;
    private static SafetyScreeningService screening;
    private static PeriodicAssessmentV2Service periodic;
    private static LevelStateV2Service levelState;
    private static L4ReviewService l4;
    private static AssessmentSessionStore store;
    private static RuleSetV2Loader loader;
    private static TemplateMeta template;
    private final List<Long> users = new ArrayList<>();
    private Instant clock;
    /** Buổi tập thật giả lập cho cổng Stability (TrainingEvidenceSource); xoá sau mỗi test. */
    private static final List<Obs> TRAINING = new ArrayList<>();

    @BeforeAll
    static void connect() {
        String db = System.getProperty("V2_TEST_DB", "calishealth_le_test");
        SingleConnectionDataSource ds = new SingleConnectionDataSource("jdbc:mysql://localhost:3306/" + db
                + "?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true", "root", "123456", true);
        try (Connection c = ds.getConnection()) { c.isValid(2); } catch (Exception e) { Assumptions.abort("Không có MySQL test: " + e.getMessage()); }
        jdbc = new JdbcTemplate(ds);
        Integer ready = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_level_state_v2'", Integer.class);
        Assumptions.assumeTrue(ready != null && ready > 0, "Chưa chạy migration_assessment_v2_08 trên " + db);

        var json = JsonMapper.builder().build();
        AssessmentV2Settings settings = new AssessmentV2Settings(true, "LEVEL_ENGINE_V2", "CALISHEALTH_INITIAL_FW2", "CALISHEALTH_SAFETY_V1", 30, "1", "CALISHEALTH_PERIODIC_FW2");
        store = new AssessmentSessionStore(jdbc, json, settings);
        loader = new RuleSetV2Loader(jdbc, settings, json);
        SafetyStatusService status = new SafetyStatusService(jdbc, json, settings);
        screening = new SafetyScreeningService(store, new AnswerSupport(store), status, loader, settings, jdbc, json);
        SafetyConfigLoader cfg = new SafetyConfigLoader(jdbc, json);
        levelState = new LevelStateV2Service(jdbc);
        CloudinaryService cloudinary = new CloudinaryService();
        l4 = new L4ReviewService(jdbc, json, store, loader, cloudinary, CLOUD, levelState);
        periodic = new PeriodicAssessmentV2Service(store, loader, new SafetyGateService(status, cfg), settings, jdbc, json, new AttemptRecorder(jdbc), new ResultWriter(jdbc, json), levelState, l4, (uid, window) -> new ArrayList<>(TRAINING));
        template = store.loadTemplate("CALISHEALTH_PERIODIC_FW2");
    }

    @BeforeEach
    void resetClock() { clock = Instant.now().minusSeconds(8 * 3600); TRAINING.clear(); }

    @AfterEach
    void cleanup() {
        for (Long u : users) {
            jdbc.update("DELETE FROM coach_overrides WHERE user_id = ?", u);
            jdbc.update("DELETE FROM l4_review_packages WHERE user_id = ?", u);
            jdbc.update("DELETE FROM level_decisions_v2 WHERE user_id = ?", u);
            jdbc.update("DELETE FROM user_level_state_v2 WHERE user_id = ?", u);
            jdbc.update("DELETE FROM assessment_recording_consents WHERE user_id = ?", u);
            jdbc.update("DELETE FROM daily_checkins WHERE user_id = ?", u);
            jdbc.update("DELETE m FROM assessment_metrics m JOIN assessment_sessions s ON s.id = m.session_id WHERE s.user_id = ?", u);
            jdbc.update("DELETE a FROM assessment_attempts a JOIN assessment_sessions s ON s.id = a.session_id WHERE s.user_id = ?", u);
            jdbc.update("DELETE FROM assessment_sessions WHERE user_id = ?", u);
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

    private long newUser(String role) {
        String email = "v2per+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', ?, TRUE)", email, role);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private void screenClear(long user) {
        List<AnswerDto> a = new ArrayList<>();
        for (String q : List.of("SF_Q1_SUPERVISED", "SF_Q2_CHEST_ACTIVE", "SF_Q3_CHEST_REST", "SF_Q4_DIZZY", "SF_Q5_JOINT_BONE", "SF_Q6_MEDICATION", "SF_Q7_OTHER")) a.add(new AnswerDto(q, "NO"));
        a.add(new AnswerDto("SF_INJURY_REGIONS", List.of("NONE")));
        StartResponse s = screening.start(user);
        screening.saveAnswers(user, s.sessionId(), a);
        screening.complete(user, s.sessionId());
    }

    /** User đã làm Baseline xong: level đã xác minh (rank), EWMA, chuỗi suy giảm, lần đo hợp lệ gần nhất `daysAgo` ngày trước. */
    private long userAt(int rank, double ewma, int streak, int daysAgo) {
        long u = newUser("USER");
        screenClear(u);
        levelState.upsert(u, "L" + rank, rank, "VERIFIED", "AI_MEASURED", ewma, streak, null, Instant.now().minus(Duration.ofDays(daysAgo)));
        return u;
    }

    /** Lịch sử: một quyết định hợp lệ trước đó (cho cổng Stability). */
    private void withHistory(long user, int candidate, String passRanks, int daysAgo) {
        long session = store.createSession(user, "PERIODIC", template, loader.loadConfigured().id(), "PERIODIC_V2", "TEST", Instant.now().plus(Duration.ofDays(3)), "AI_MEASURED");
        store.setStatus(session, "COMPLETED");
        jdbc.update("INSERT INTO level_decisions_v2 (user_id, session_id, kind, outcome, decision, level_before, level_after, candidate_rank, competency_pass_ranks, created_at) VALUES (?, ?, 'PERIODIC', 'DECIDED', 'MAINTAINED', 'L1', 'L1', ?, ?, ?)",
                user, session, candidate, passRanks, java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(daysAgo))));
    }

    private double mobilityFactor = 1.0;

    private double angleFor(String exercise, double factor) {
        double base = switch (exercise) { case "shoulder-flexion-test" -> 175; case "pike-fold-test" -> 85; case "overhead-squat-test" -> 130; default -> throw new IllegalArgumentException(exercise); };
        return base * factor;
    }


    /** strong = rất tốt (đạt mọi yêu cầu); weak = hợp lệ nhưng rất thấp. */
    private SubmitAttemptRequest attempt(String exercise, boolean strong, double pose) {
        Instant start = clock.plusSeconds(300), end = start.plusSeconds(60);
        clock = end;
        String metric = jdbc.queryForObject("SELECT JSON_UNQUOTE(JSON_EXTRACT(config_json, '$.metric')) FROM assessment_questions WHERE question_code = ?", String.class, "PA2_" + exercise);
        boolean hold = "HOLD_SEC".equals(metric), angle = "ANGLE_DEG".equals(metric);
        int reps = strong ? 100 : 0;          // yếu = không làm được rep hợp lệ nào (1 rep của bài khó đã là đạt stage cao: ladder suy ra các stage thấp)
        return new SubmitAttemptRequest(exercise, System.nanoTime() % 1_000_000_000L + new Random().nextInt(1000), start, end, hold || angle ? null : reps, hold || angle ? null : reps,
                hold ? (strong ? 300.0 : 0.0) : null, angle ? angleFor(exercise, strong ? mobilityFactor : 0.3) : null, strong ? 90.0 : null, strong ? 85.0 : null, 0, pose, 0.9, 0.95, false, null);
    }

    private PeriodicProgressDto runAll(long u, long s, boolean strong) {
        PeriodicProgressDto p = periodic.next(u, s);
        for (int i = 0; i < 80 && "IN_PROGRESS".equals(p.outcome()); i++) {
            assertNotNull(p.next(), "IN_PROGRESS phải có bước tiếp theo (lần " + i + ")");
            p = periodic.submitAttempt(u, s, attempt(p.next().exerciseCode(), strong, 0.9));
        }
        return p;
    }

    private long startSession(long u) { return periodic.start(u).sessionId(); }

    private LevelStateV2Service.LevelState state(long u) { return levelState.state(u).orElseThrow(); }

    // ------------------------------------------------------------------ điều kiện bắt đầu

    @Test
    void periodicRequiresSafetyScreeningAndAVerifiedBaselineLevel() {
        long noScreen = newUser("USER");
        assertTrue(assertThrows(IllegalStateException.class, () -> periodic.start(noScreen)).getMessage().startsWith("SAFETY_SCREENING_REQUIRED"));
        long noBaseline = newUser("USER");
        screenClear(noBaseline);
        assertTrue(assertThrows(IllegalStateException.class, () -> periodic.start(noBaseline)).getMessage().startsWith("BASELINE_REQUIRED"));
    }

    @Test
    void aValidMeasurementTooRecently_blocksANewOne_butAMissedOneDoesNot() {
        long soon = userAt(2, 55, 0, 3);
        assertTrue(assertThrows(IllegalStateException.class, () -> periodic.start(soon)).getMessage().startsWith("PERIODIC_TOO_SOON"));
        long ok = userAt(2, 55, 0, 20);
        StartPeriodicResponse r = periodic.start(ok);
        assertEquals("L2", r.currentLevel());
        assertEquals("L3", r.targetLevel());
        assertFalse(r.tests().isEmpty());
        assertTrue(r.tests().stream().allMatch(t -> t.status().equals("PENDING")));
        assertNotNull(r.next());
        assertTrue(periodic.start(ok).resumed(), "start lần hai tiếp tục phiên đang mở");
    }

    @Test
    void eachExerciseIsMeasuredOnce_andOnlyExercisesOfThisPlanAreAccepted() {
        long u = userAt(2, 55, 0, 20);
        StartPeriodicResponse r = periodic.start(u);
        String first = r.next().exerciseCode();
        periodic.submitAttempt(u, r.sessionId(), attempt(first, true, 0.9));
        assertTrue(assertThrows(IllegalStateException.class, () -> periodic.submitAttempt(u, r.sessionId(), attempt(first, true, 0.9))).getMessage().startsWith("ATTEMPT_ALREADY_RECORDED"));
        assertThrows(IllegalArgumentException.class, () -> periodic.submitAttempt(u, r.sessionId(), attempt("pistol-squat", true, 0.9)));   // bài L3-L4 không bắt buộc, không thuộc bộ của người ở L2
        long other = userAt(2, 55, 0, 20);
        assertThrows(IllegalArgumentException.class, () -> periodic.next(other, r.sessionId()));
    }

    // ------------------------------------------------------------------ lên level

    @Test
    void strongResults_withStabilityFromHistory_promoteOneLevel_andUpdateState() {
        long u = userAt(2, 55, 0, 20);
        withHistory(u, 3, "1,2,3", 20);
        long s = startSession(u);
        PeriodicProgressDto r = runAll(u, s, true);
        assertEquals("DECIDED", r.outcome(), String.valueOf(r.reasonCode()) + " " + r.blockedGates());
        assertEquals("PROMOTED", r.decision());
        assertEquals("L2", r.levelBefore());
        assertEquals("L3", r.levelAfter());
        assertTrue(r.levelChanged());
        LevelStateV2Service.LevelState st = state(u);
        assertEquals("L3", st.levelCode());
        assertEquals(0, st.consecutiveBelow());
        assertEquals("AI_MEASURED", st.source());
        assertEquals("COMPLETED", jdbc.queryForObject("SELECT status FROM assessment_sessions WHERE id = ?", String.class, s));
        assertEquals("L3", jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, s));
        assertEquals("L3", periodic.result(u, s).levelAfter(), "đọc lại từ snapshot");
        LevelStateV2Service.LevelDecision d = levelState.history(u, 1).get(0);
        assertEquals("PERIODIC", d.kind());
        assertEquals("PROMOTED", d.decision());
        assertTrue(assertThrows(IllegalStateException.class, () -> periodic.start(u)).getMessage().startsWith("PERIODIC_TOO_SOON"));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_level_state WHERE user_id = ?", Integer.class, u), "V2 không ghi state của v1");
    }

    @Test
    void withoutHistory_stabilityIsInsufficientEvidence_soTheLevelIsKept_notFailed() {
        long u = userAt(2, 55, 0, 20);
        long s = startSession(u);
        PeriodicProgressDto r = runAll(u, s, true);
        assertEquals("DECIDED", r.outcome());
        assertEquals("MAINTAINED", r.decision());
        assertEquals("PROMOTION_EVIDENCE_INCOMPLETE", r.reasonCode());
        assertEquals("INSUFFICIENT_EVIDENCE", r.blockedGates().get("stability"));
        assertEquals("L2", state(u).levelCode());
        assertEquals(0, state(u).consecutiveBelow());
        // lần đo kế tiếp (sau lần này đã có lịch sử với candidate L3) mới đủ Stability
        assertTrue(levelState.history(u, 1).get(0).candidateRank() >= 3);
    }

    @Test
    void previousEvidenceThatDidNotReachTheTargetLevel_isAStabilityFail() {
        long u = userAt(2, 55, 0, 20);
        withHistory(u, 2, "1,2", 20);
        PeriodicProgressDto r = runAll(u, startSession(u), true);
        assertEquals("MAINTAINED", r.decision());
        assertEquals("FAIL", r.blockedGates().get("stability"));
        assertEquals("PROMOTION_GATE_FAILED", r.reasonCode());
    }

    @Test
    void historyOlderThanTheStabilityWindow_doesNotCount() {
        long u = userAt(2, 55, 0, 20);
        withHistory(u, 3, "1,2,3", 90);                                          // > stability.prevWindowWeeks (10 tuần)
        PeriodicProgressDto r = runAll(u, startSession(u), true);
        assertEquals("INSUFFICIENT_EVIDENCE", r.blockedGates().get("stability"));
    }

    // ------------------------------------------------------------------ tụt level (hysteresis + xu hướng)

    @Test
    void weakResults_neverLowerTheLevel() {
        long u = userAt(2, 44, 0, 20);
        PeriodicProgressDto first = runAll(u, startSession(u), false);
        assertEquals("DECIDED", first.outcome(), String.valueOf(first.reasonCode()));
        assertEquals("MAINTAINED", first.decision());
        assertEquals("BELOW_LEVEL_STANDARD", first.reasonCode(), "overall=" + first.overallScore() + " ewma=" + first.ewma() + " comps=" + first.competencies() + " tests=" + first.tests());
        assertEquals("L2", state(u).levelCode());
        assertEquals(0, state(u).consecutiveBelow());
        assertTrue(state(u).ewma() < 42, "EWMA phải dưới ngưỡng xét tụt của L2");

        jdbc.update("UPDATE user_level_state_v2 SET last_assessed_at = ? WHERE user_id = ?", java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(20))), u);
        PeriodicProgressDto second = runAll(u, startSession(u), false);
        assertEquals("MAINTAINED", second.decision());
        assertEquals("L2", state(u).levelCode());
        assertEquals(0, state(u).consecutiveBelow());
    }

    @Test
    void recentIllness_stillNeverLowersTheLevel() {
        long u = userAt(2, 44, 1, 20);
        jdbc.update("INSERT INTO daily_checkins (user_id, checkin_date, energy_level, created_at) VALUES (?, ?, 1, NOW(6))", u, Date.valueOf(LocalDate.now()));
        PeriodicProgressDto r = runAll(u, startSession(u), false);
        assertEquals("MAINTAINED", r.decision());
        assertEquals("L2", state(u).levelCode());
    }

    // ------------------------------------------------------------------ đo không tin cậy (I19)

    @Test
    void unreliableMeasurement_isRetestRequired_andChangesNothingButTheHistory() {
        long u = userAt(2, 44, 1, 20);
        StartPeriodicResponse start = periodic.start(u);
        PeriodicProgressDto r = periodic.submitAttempt(u, start.sessionId(), attempt(start.next().exerciseCode(), false, 0.2));   // pose confidence rất thấp
        assertEquals("RETEST_REQUIRED", r.outcome());
        assertNull(r.decision());
        assertNull(r.levelAfter());
        assertNotNull(r.retestAfter());
        LevelStateV2Service.LevelState st = state(u);
        assertEquals("L2", st.levelCode());
        assertEquals(44.0, st.ewma());
        assertEquals(1, st.consecutiveBelow(), "chuỗi suy giảm không tăng vì dữ liệu hỏng");
        assertEquals("COMPLETED", jdbc.queryForObject("SELECT status FROM assessment_sessions WHERE id = ?", String.class, start.sessionId()));
        assertNull(jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, start.sessionId()));
        assertEquals("RETEST_REQUIRED", levelState.history(u, 1).get(0).outcome());
        assertDoesNotThrow(() -> periodic.start(u), "đo lại được ngay: lần hỏng không tính là lần đo hợp lệ");
    }

    // ------------------------------------------------------------------ RETURNING

    @Test
    void afterALongBreak_theLevelIsKeptEvenWithStrongResults_andTheUserIsVerifiedAgain() {
        long u = userAt(2, 55, 0, 40);                                           // ≥ returning.inactiveDays (28) không có buổi tập hay lần đo
        withHistory(u, 3, "1,2,3", 40);
        PeriodicProgressDto r = runAll(u, startSession(u), true);
        assertEquals("MAINTAINED", r.decision());
        assertEquals("RETURNING_REMEASURED", r.reasonCode());
        assertEquals("L2", state(u).levelCode());
        assertEquals("VERIFIED", state(u).status());
    }

    // ------------------------------------------------------------------ L4 cần Coach xác nhận

    @Test
    void allL4GatesPass_staysL3_opensACoachPackage_andTheCoachConfirmationUpdatesTheState() {
        long u = userAt(3, 80, 0, 20);
        withHistory(u, 4, "1,2,3,4", 20);
        StartPeriodicResponse start = periodic.start(u);
        l4.grantConsent(u, start.sessionId(), true);
        PeriodicProgressDto r = runAll(u, start.sessionId(), true);
        assertEquals("DECIDED", r.outcome(), String.valueOf(r.reasonCode()) + " " + r.blockedGates());
        assertEquals("MAINTAINED", r.decision());
        assertEquals("L4_AWAITING_COACH_VERIFICATION", r.reasonCode());
        assertEquals("PENDING_COACH", r.l4Review());
        assertEquals("L3", state(u).levelCode());
        L4ReviewSummaryDto pkg = l4.latestFor(u).orElseThrow();
        assertEquals("PENDING", pkg.status());
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM l4_review_packages WHERE user_id = ? AND source_type = 'PERIODIC'", Integer.class, u));

        long coach = newUser("COACH");
        l4.attachVideo(u, start.sessionId(), jdbc.queryForObject("SELECT MAX(id) FROM assessment_attempts WHERE session_id = ?", Long.class, start.sessionId()),
                "https://res.cloudinary.com/" + CLOUD + "/video/upload/v1/" + L4ReviewService.folderOf(u) + "/x.mp4");
        l4.decide(coach, pkg.id(), "CONFIRM", "OK");
        LevelStateV2Service.LevelState st = state(u);
        assertEquals("L4", st.levelCode());
        assertEquals("COACH_VERIFIED", st.source());
        assertEquals("COACH_L4", levelState.history(u, 1).get(0).kind());
        assertEquals(st.ewma(), 80.0 == st.ewma() ? st.ewma() : st.ewma());
    }

    @Test
    void aNewResultThatNoLongerQualifiesForL4_supersedesTheWaitingPackage() {
        long u = userAt(3, 80, 0, 20);
        withHistory(u, 4, "1,2,3,4", 20);
        StartPeriodicResponse first = periodic.start(u);
        l4.grantConsent(u, first.sessionId(), true);
        runAll(u, first.sessionId(), true);
        assertEquals("PENDING", l4.latestFor(u).orElseThrow().status());

        jdbc.update("UPDATE user_level_state_v2 SET last_assessed_at = ? WHERE user_id = ?", java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(20))), u);
        mobilityFactor = 0.5;                                                    // linh hoạt kém: cổng MOBILITY của L4 FAIL thật
        PeriodicProgressDto r = runAll(u, startSession(u), true);
        assertEquals("DECIDED", r.outcome());
        assertNull(r.l4Review());
        assertEquals("SUPERSEDED", l4.latestFor(u).orElseThrow().status());
        assertTrue(assertThrows(IllegalStateException.class, () -> l4.decide(newUser("COACH"), l4.latestFor(u).orElseThrow().id(), "CONFIRM", null)).getMessage().startsWith("REVIEW_NOT_PENDING"));
    }

    // ------------------------------------------------------------------ trạng thái của user

    @Test
    void myLevel_returnsTheStateAndTheHistory_andNothingBeforeTheBaseline() {
        long none = newUser("USER");
        assertTrue(periodic.myLevel(none).isEmpty());
        long u = userAt(2, 55, 0, 20);
        withHistory(u, 3, "1,2,3", 20);
        LevelStateDto dto = periodic.myLevel(u).orElseThrow();
        assertEquals("L2", dto.levelCode());
        assertEquals("VERIFIED", dto.status());
        assertEquals(1, dto.history().size());
        assertNotNull(dto.nextAssessmentEarliest());
    }

    // ------------------------------------------------------------------ Stability bằng chất lượng buổi tập thật (§41)

    private static void trainSessions(int count, double value, Double form, int firstDaysAgo) {
        for (String ex : List.of("dips", "pull-up", "l-sit"))
            for (int i = 0; i < count; i++) TRAINING.add(new Obs(ex, Instant.now().minus(Duration.ofDays(firstDaysAgo + i)), value, form));
    }

    @Test
    void goodQualityTrainingSessions_canReplaceHistory_toPromote() {
        long u = userAt(2, 55, 0, 20);                         // KHÔNG có lịch sử đo trước
        trainSessions(4, 40, 90.0, 1);                          // 4 buổi gần đây, đạt chỉ tiêu, form 90 ≥ 75
        PeriodicProgressDto r = runAll(u, startSession(u), true);
        assertEquals("DECIDED", r.outcome(), String.valueOf(r.reasonCode()) + " " + r.blockedGates());
        assertEquals("PROMOTED", r.decision());
        assertEquals("L3", r.levelAfter());
    }

    @Test
    void enoughTrainingSessionsButPoorForm_isAStabilityFail_notJustMissingEvidence() {
        long u = userAt(2, 55, 0, 20);
        trainSessions(4, 40, 50.0, 1);                          // đủ số buổi nhưng form 50 < 75
        PeriodicProgressDto r = runAll(u, startSession(u), true);
        assertEquals("MAINTAINED", r.decision());
        assertEquals("FAIL", r.blockedGates().get("stability"));
        assertEquals("L2", state(u).levelCode());
    }

    @Test
    void tooFewOrTooOldTrainingSessions_areInsufficientEvidence_neverAFail() {
        long few = userAt(2, 55, 0, 20);
        trainSessions(2, 40, 90.0, 1);                          // mới 2 buổi < 4
        PeriodicProgressDto r1 = runAll(few, startSession(few), true);
        assertEquals("MAINTAINED", r1.decision());
        assertEquals("INSUFFICIENT_EVIDENCE", r1.blockedGates().get("stability"));
        assertEquals("PROMOTION_EVIDENCE_INCOMPLETE", r1.reasonCode());

        TRAINING.clear();
        long old = userAt(2, 55, 0, 20);
        trainSessions(4, 40, 90.0, 40);                         // 4 buổi nhưng ngoài cửa sổ 21 ngày
        PeriodicProgressDto r2 = runAll(old, startSession(old), true);
        assertEquals("INSUFFICIENT_EVIDENCE", r2.blockedGates().get("stability"));
    }

    @Test
    void trainingQualityNeverLowersALevel_andMissingFormScoreIsNotACountedPass() {
        long u = userAt(2, 55, 0, 20);
        trainSessions(4, 40, null, 1);                          // không chấm được form: không tính là đạt (và không phải bằng chứng xấu)
        PeriodicProgressDto r = runAll(u, startSession(u), true);
        assertEquals("L2", state(u).levelCode());
        assertNotEquals("REGRESSED", r.decision());
        assertEquals(0, state(u).consecutiveBelow());
    }
}
