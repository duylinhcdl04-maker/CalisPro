package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Connection;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Baseline thực hành đầu tiên trên MySQL thật (cần migration 01, 02, 04). Kiểm chứng: staircase, attempt độc lập, RETEST_REQUIRED cho đo không tin cậy,
 * IN_PROGRESS cho thiếu bằng chứng (I19), kết luận ngay khi có bằng chứng tin cậy không đạt, và quy tắc tham gia của Safety.
 */
class BaselineIntegrationTest {
    private static final Set<String> HOLDS = Set.of("plank", "dead-hang", "hollow-body-hold", "l-sit", "wall-pike-hold", "crow-pose", "chest-to-wall-handstand", "handstand");

    private static JdbcTemplate jdbc;
    private static SafetyScreeningService screening;
    private static SafetyClearanceService clearance;
    private static BaselineService baseline;
    private final List<Long> users = new ArrayList<>();
    private Instant clock;

    @BeforeAll
    static void connect() {
        String db = System.getProperty("V2_TEST_DB", "calishealth_le_test");
        DriverManagerDataSource ds = new DriverManagerDataSource("jdbc:mysql://localhost:3306/" + db
                + "?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true", "root", "123456");
        try (Connection c = ds.getConnection()) { c.isValid(2); } catch (Exception e) { Assumptions.abort("Không có MySQL test: " + e.getMessage()); }
        jdbc = new JdbcTemplate(ds);
        Integer ready = jdbc.queryForObject("SELECT COUNT(*) FROM assessment_templates WHERE code = 'CALISHEALTH_PERIODIC_FW2'", Integer.class);
        Assumptions.assumeTrue(ready != null && ready > 0, "Chưa chạy migration_assessment_v2_04 trên " + db);

        var json = JsonMapper.builder().build();
        AssessmentV2Settings settings = new AssessmentV2Settings(true, "LEVEL_ENGINE_V2", "CALISHEALTH_INITIAL_FW2", "CALISHEALTH_SAFETY_V1", 30, "1", "CALISHEALTH_PERIODIC_FW2");
        AssessmentSessionStore store = new AssessmentSessionStore(jdbc, json, settings);
        RuleSetV2Loader loader = new RuleSetV2Loader(jdbc, settings, json);
        SafetyStatusService status = new SafetyStatusService(jdbc, json, settings);
        screening = new SafetyScreeningService(store, new AnswerSupport(store), status, loader, settings, jdbc, json);
        SafetyConfigLoader cfg = new SafetyConfigLoader(jdbc, json);
        clearance = new SafetyClearanceService(jdbc, json, status, cfg, loader, settings);
        baseline = new BaselineService(store, loader, new SafetyGateService(status, cfg), settings, jdbc, json,
                new L4ReviewService(jdbc, json, store, loader, new com.calishealth.api.service.ai.CloudinaryService(), "testcloud", new LevelStateV2Service(jdbc)), new AttemptRecorder(jdbc), new ResultWriter(jdbc, json), new LevelStateV2Service(jdbc));
    }

    @BeforeEach
    void resetClock() { clock = Instant.now().minusSeconds(4 * 3600); }

    @AfterEach
    void cleanup() {
        for (Long u : users) {
            jdbc.update("DELETE FROM baseline_deferrals WHERE user_id = ?", u);
            jdbc.update("DELETE p FROM l4_review_packages p WHERE p.user_id = ?", u);
            jdbc.update("DELETE FROM level_decisions_v2 WHERE user_id = ?", u);
            jdbc.update("DELETE FROM user_level_state_v2 WHERE user_id = ?", u);
            jdbc.update("DELETE c FROM assessment_recording_consents c WHERE c.user_id = ?", u);
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

    private long newUser() {
        String email = "v2base+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'USER', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private void screen(long user, String... yes) {
        List<AnswerDto> a = new ArrayList<>();
        for (String q : List.of("SF_Q1_SUPERVISED", "SF_Q2_CHEST_ACTIVE", "SF_Q3_CHEST_REST", "SF_Q4_DIZZY", "SF_Q5_JOINT_BONE", "SF_Q6_MEDICATION", "SF_Q7_OTHER"))
            a.add(new AnswerDto(q, Arrays.asList(yes).contains(q) ? "YES" : "NO"));
        a.add(new AnswerDto("SF_INJURY_REGIONS", List.of("NONE")));
        StartResponse s = screening.start(user);
        screening.saveAnswers(user, s.sessionId(), a);
        screening.complete(user, s.sessionId());
    }

    private long clearedUserWithSession() {
        long u = newUser();
        screen(u);
        return u;
    }

    /** Một attempt hợp lệ, đo tin cậy (pose .9, thấy .9, tracked .95, form 85). Giờ giả lập tăng dần, cách nhau đủ thời gian nghỉ. */
    private SubmitAttemptRequest attempt(String exercise, double value) {
        return attempt(exercise, value, 0.9, false, null);
    }

    private SubmitAttemptRequest attempt(String exercise, double value, double pose, boolean aborted, String abortReason) {
        Instant start = clock.plusSeconds(300), end = start.plusSeconds(60);
        clock = end;
        boolean hold = HOLDS.contains(exercise);
        return new SubmitAttemptRequest(exercise, System.nanoTime() % 1_000_000_000L + new Random().nextInt(1000), start, end,
                hold ? null : (int) value, hold ? null : (int) value, hold ? value : null, null, 85.0, 80.0, 0, pose, 0.9, 0.95, aborted, abortReason);
    }

    private BaselineProgressDto submit(long user, long session, String exercise, double value) {
        return baseline.submitAttempt(user, session, attempt(exercise, value));
    }

    // ------------------------------------------------------------------ tests

    @Test
    void baselineRequiresSafetyScreening() {
        long u = newUser();
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> baseline.start(u));
        assertTrue(e.getMessage().startsWith("SAFETY_SCREENING_REQUIRED"));
    }

    @Test
    void staircaseReachesL1Verified_whenLevel2RequirementReliablyFails() {
        long u = clearedUserWithSession();
        StartBaselineResponse start = baseline.start(u);
        long s = start.sessionId();
        assertNotNull(start.next(), "bắt đầu phải có bước tiếp theo");
        assertEquals(1, start.next().level());

        BaselineProgressDto last = null;
        int submitted = 0;
        // thứ tự cố ý lộn xộn; bài mang yêu cầu L1 + các bài bắt buộc áp dụng cho L1
        for (Object[] t : new Object[][]{{"incline-push-up", 20}, {"plank", 60}, {"push-up", 25}, {"dead-hang", 40}, {"australian-pull-up", 8},
                {"hollow-body-hold", 20}, {"bodyweight-squat", 25}, {"dips", 0}, {"pull-up", 0}}) {
            last = submit(u, s, (String) t[0], ((Number) t[1]).doubleValue());
            submitted++;
            if (!"IN_PROGRESS".equals(last.outcome())) break;
        }
        assertEquals("VERIFIED", last.outcome());
        assertEquals("L1", last.finalLevel());
        assertEquals("PROMOTED", last.decision());                       // provisional = L0 (chưa có Initial)
        assertTrue(last.fastTrackConsumed());
        assertEquals("FAIL", last.stabilityByLevel().get(2));            // attempt L2 tin cậy nhưng pull-up 0 < 5

        assertEquals("COMPLETED", jdbc.queryForObject("SELECT status FROM assessment_sessions WHERE id = ?", String.class, s));
        assertEquals("L1", jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, s));
        assertEquals("AI_MEASURED", jdbc.queryForObject("SELECT source FROM assessment_sessions WHERE id = ?", String.class, s));
        assertEquals(28, jdbc.queryForObject("SELECT COUNT(*) FROM assessment_evidence WHERE session_id = ?", Integer.class, s));
        assertEquals(submitted, jdbc.queryForObject("SELECT COUNT(*) FROM assessment_attempts WHERE session_id = ?", Integer.class, s));
        assertEquals("MEASURED_VERIFIED", jdbc.queryForObject("SELECT verification_status FROM assessment_ladder_results WHERE session_id = ? LIMIT 1", String.class, s));
        assertEquals("L1", baseline.result(u, s).finalLevel());           // đọc lại từ snapshot
        // V2 chưa ghi vào state của v1
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_level_state WHERE user_id = ?", Integer.class, u));
        assertThrows(IllegalStateException.class, () -> baseline.start(u));      // không có Baseline lần hai
    }

    @Test
    void unreliableMeasurement_isRetestRequired_neverALevelChange() {
        long u = clearedUserWithSession();
        long s = baseline.start(u).sessionId();
        BaselineProgressDto r = baseline.submitAttempt(u, s, attempt("incline-push-up", 20, 0.30, false, null));     // pose confidence thấp
        assertEquals("RETEST_REQUIRED", r.outcome());
        assertNull(r.finalLevel());
        assertNull(r.decision());
        assertFalse(r.fastTrackConsumed());
        assertNotNull(r.retestAfter());
        assertEquals("INVALID_MEASUREMENT", r.lastAttempt().measurementStatus());
        assertEquals("LOW_POSE_CONFIDENCE", r.lastAttempt().invalidReason());
        assertNull(jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, s));

        // không có Baseline nào bị tính là "đã xác minh": được bắt đầu lại, fast-track chưa tiêu thụ
        assertDoesNotThrow(() -> baseline.start(u));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM assessment_evidence e JOIN progression_stages s ON s.id = e.stage_id WHERE e.session_id = ? AND e.status = 'FAIL'", Integer.class, s));
    }

    @Test
    void painAbort_isRetestWithRescreenRecommendation_notALowerLevel() {
        long u = clearedUserWithSession();
        long s = baseline.start(u).sessionId();
        BaselineProgressDto r = baseline.submitAttempt(u, s, attempt("incline-push-up", 0, 0.9, true, "PAIN"));
        assertEquals("RETEST_REQUIRED", r.outcome());
        assertTrue(r.rescreenRecommended());
        assertNull(r.finalLevel());
        assertFalse(r.fastTrackConsumed());
    }

    @Test
    void insufficientEvidence_keepsTheBaselineOpen_andNeverConcludesALevel() {
        long u = clearedUserWithSession();
        long s = baseline.start(u).sessionId();
        BaselineProgressDto r = submit(u, s, "incline-push-up", 20);      // chỉ một bài, đạt: chưa đủ bằng chứng để kết luận
        assertEquals("IN_PROGRESS", r.outcome());
        assertNull(r.finalLevel());
        assertNotNull(r.next());
        assertEquals("IN_PROGRESS", jdbc.queryForObject("SELECT status FROM assessment_sessions WHERE id = ?", String.class, s));
        assertEquals("IN_PROGRESS", baseline.next(u, s).outcome());
        assertNull(jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, s));
    }

    @Test
    void partialPassingEvidence_neverConcludesALevel_untilCoverageIsComplete() {
        long u = clearedUserWithSession();
        long s = baseline.start(u).sessionId();
        BaselineProgressDto r = submit(u, s, "incline-push-up", 20);
        assertEquals("IN_PROGRESS", r.outcome());
        r = submit(u, s, "plank", 60);
        assertEquals("IN_PROGRESS", r.outcome());
        assertNull(r.finalLevel());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM assessment_results WHERE session_id = ?", Integer.class, s));
    }

    @Test
    void attemptsMustBeIndependent() {
        long u = clearedUserWithSession();
        long s = baseline.start(u).sessionId();
        SubmitAttemptRequest first = attempt("incline-push-up", 20);
        baseline.submitAttempt(u, s, first);

        // dùng lại cùng một lần quay
        SubmitAttemptRequest reuse = new SubmitAttemptRequest("plank", first.movementSessionId(), first.endedAt().plusSeconds(300), first.endedAt().plusSeconds(360),
                null, null, 40.0, null, 85.0, 80.0, 0, 0.9, 0.9, 0.95, false, null);
        IllegalStateException e1 = assertThrows(IllegalStateException.class, () -> baseline.submitAttempt(u, s, reuse));
        assertTrue(e1.getMessage().startsWith("ATTEMPT_NOT_INDEPENDENT"));

        // chồng lấn thời gian
        SubmitAttemptRequest overlap = new SubmitAttemptRequest("plank", 777000111L, first.startedAt(), first.endedAt(),
                null, null, 40.0, null, 85.0, 80.0, 0, 0.9, 0.9, 0.95, false, null);
        assertTrue(assertThrows(IllegalStateException.class, () -> baseline.submitAttempt(u, s, overlap)).getMessage().startsWith("ATTEMPT_NOT_INDEPENDENT"));

        // attempt kế tiếp của cùng bài mà chưa nghỉ đủ
        SubmitAttemptRequest tooSoon = new SubmitAttemptRequest("incline-push-up", 777000222L, first.endedAt().plusSeconds(10), first.endedAt().plusSeconds(70),
                20, 20, null, null, 85.0, 80.0, 0, 0.9, 0.9, 0.95, false, null);
        assertTrue(assertThrows(IllegalStateException.class, () -> baseline.submitAttempt(u, s, tooSoon)).getMessage().contains("nghỉ"));
    }

    @Test
    void unknownExercise_andForeignSession_areRejected() {
        long owner = clearedUserWithSession(), other = clearedUserWithSession();
        long s = baseline.start(owner).sessionId();
        assertThrows(IllegalArgumentException.class, () -> baseline.submitAttempt(owner, s, attempt("not-a-real-test", 5)));
        assertThrows(IllegalArgumentException.class, () -> baseline.next(other, s));
    }

    @Test
    void safetyParticipation_requiresAcknowledgement_thenBlocksMaxEffortTests_withoutLoweringAnything() {
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");                                          // REVIEW_REQUIRED + NO_MAX_EFFORT_TEST
        IllegalStateException noAck = assertThrows(IllegalStateException.class, () -> baseline.start(u));
        assertTrue(noAck.getMessage().startsWith("ACKNOWLEDGEMENT_REQUIRED"));

        clearance.acknowledge(u, null);
        IllegalStateException restricted = assertThrows(IllegalStateException.class, () -> baseline.start(u));
        assertTrue(restricted.getMessage().startsWith("ASSESSMENT_PARTICIPATION_RESTRICTED"));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM assessment_sessions s JOIN assessment_types t ON t.id = s.assessment_type_id WHERE s.user_id = ? AND t.code = 'PERIODIC'", Integer.class, u));
    }

    @Test
    void startingAgainResumesTheOpenBaseline() {
        long u = clearedUserWithSession();
        StartBaselineResponse a = baseline.start(u), b = baseline.start(u);
        assertEquals(a.sessionId(), b.sessionId());
        assertTrue(b.resumed());
    }

    // ------------------------------------------------------------------ §46: bỏ qua đo sau, kết thúc sớm, đo lại

    /** Giả lập khảo sát đã xong với level tạm `level` (INITIAL_V2, COMPLETED). */
    private void provisional(long user, String level) {
        jdbc.update("""
                INSERT INTO assessment_sessions (user_id, assessment_type_id, started_at, completed_at, status, version, created_at, template_id, template_version, purpose, source, execution_mode, level_code, current_step)
                SELECT ?, t.id, NOW(6), NOW(6), 'COMPLETED', '2.0', NOW(6), tpl.id, tpl.version, 'INITIAL_V2', 'SELF_REPORTED', t.execution_mode, ?, 0
                FROM assessment_types t JOIN assessment_templates tpl ON tpl.code = 'CALISHEALTH_PERIODIC_FW2' WHERE t.code = 'PERIODIC' LIMIT 1""", user, level);
    }

    /** Một Baseline kết thúc ở L1 (cùng bộ số liệu như staircase test). */
    private BaselineProgressDto runToL1(long u, long s) {
        BaselineProgressDto last = null;
        for (Object[] t : new Object[][]{{"incline-push-up", 20}, {"plank", 60}, {"push-up", 25}, {"dead-hang", 40}, {"australian-pull-up", 8},
                {"hollow-body-hold", 20}, {"bodyweight-squat", 25}, {"dips", 0}, {"pull-up", 0}}) {
            last = submit(u, s, (String) t[0], ((Number) t[1]).doubleValue());
            if (!"IN_PROGRESS".equals(last.outcome())) break;
        }
        return last;
    }

    @Test
    void deferUsesProvisionalLevel_andNeverCreatesAVerifiedLevel() {
        long u = clearedUserWithSession();
        provisional(u, "L2");
        LevelStatusDto before = baseline.levelStatus(u);
        assertEquals("PROVISIONAL", before.displayLabel());
        assertEquals("L2", before.displayLevel());
        assertNull(before.verifiedLevel());
        assertNull(before.deferredUntil());

        DeferDto d = baseline.defer(u);
        assertEquals(1, d.deferCount());
        assertTrue(d.remindAfter().isAfter(Instant.now().plusSeconds(6 * 86400)));
        assertEquals(2, baseline.defer(u).deferCount());

        LevelStatusDto after = baseline.levelStatus(u);
        assertEquals("PROVISIONAL", after.displayLabel());
        assertNotNull(after.deferredUntil());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_level_state_v2 WHERE user_id = ?", Integer.class, u));
        // làm bài đo thì hết trạng thái hoãn
        baseline.start(u);
        assertNull(baseline.levelStatus(u).deferredUntil());
    }

    @Test
    void finishEarlyWithoutEvidence_isRejected_andKeepsTheProvisionalLevel() {
        long u = clearedUserWithSession();
        provisional(u, "L2");
        long s = baseline.start(u).sessionId();
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> baseline.finishEarly(u, s));
        assertTrue(e.getMessage().startsWith("NO_EVIDENCE_FOR_EARLY_FINISH"));
        assertEquals("IN_PROGRESS", jdbc.queryForObject("SELECT status FROM assessment_sessions WHERE id = ?", String.class, s));
        assertEquals("PROVISIONAL", baseline.levelStatus(u).displayLabel());
    }

    @Test
    void firstResultBelowProvisional_allowsExactlyOneRetake_withinTheWindow() {
        long u = clearedUserWithSession();
        provisional(u, "L2");
        long s1 = baseline.start(u).sessionId();
        assertEquals("L1", runToL1(u, s1).finalLevel());

        LevelStatusDto st = baseline.levelStatus(u);
        assertEquals("VERIFIED", st.displayLabel());
        assertEquals("L1", st.displayLevel());
        assertTrue(st.retake().eligible());
        assertFalse(st.retake().used());
        assertTrue(st.retake().availableUntil().isAfter(Instant.now().plusSeconds(6 * 86400)));

        // đo lại: được bắt đầu, không cao hơn thì giữ L1 và hết lượt
        StartBaselineResponse r = baseline.start(u);
        assertNotEquals(s1, r.sessionId());
        BaselineProgressDto second = runToL1(u, r.sessionId());
        assertEquals("L1", second.finalLevel());
        assertEquals("L1", jdbc.queryForObject("SELECT level_code FROM user_level_state_v2 WHERE user_id = ?", String.class, u));
        LevelStatusDto after = baseline.levelStatus(u);
        assertTrue(after.retake().used());
        assertFalse(after.retake().eligible());
        assertThrows(IllegalStateException.class, () -> baseline.start(u));
    }

    @Test
    void retakeIsClosedAfterTheWindow_andWhenFirstResultIsNotBelowProvisional() {
        long u = clearedUserWithSession();
        provisional(u, "L2");
        long s1 = baseline.start(u).sessionId();
        runToL1(u, s1);
        jdbc.update("UPDATE assessment_sessions SET completed_at = ? WHERE id = ?", java.sql.Timestamp.from(Instant.now().minusSeconds(8 * 86400)), s1);
        assertFalse(baseline.levelStatus(u).retake().eligible());
        assertThrows(IllegalStateException.class, () -> baseline.start(u));

        long v = clearedUserWithSession();   // không có khảo sát: level tạm L0, kết quả L1 không thấp hơn => không có đo lại
        long sv = baseline.start(v).sessionId();
        runToL1(v, sv);
        assertFalse(baseline.levelStatus(v).retake().eligible());
        assertNull(baseline.levelStatus(v).retake().availableUntil());
    }
}
