package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.ai.CloudinaryService;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Connection;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * L4 cần Coach xác nhận trên MySQL thật (cần migration 01, 02, 04, 05): camera đủ mọi cổng => L3 VERIFIED + gói review;
 * video chỉ khi user đồng ý; quyết định của Coach được ghi vào coach_overrides và không đổi dữ liệu đo.
 */
class L4ReviewIntegrationTest {
    private static final String CLOUD = "testcloud";

    private static JdbcTemplate jdbc;
    private static SafetyScreeningService screening;
    private static BaselineService baseline;
    private static L4ReviewService l4;
    private final List<Long> users = new ArrayList<>();
    private Instant clock;

    @BeforeAll
    static void connect() {
        String db = System.getProperty("V2_TEST_DB", "calishealth_le_test");
        // Một kết nối dùng chung: luồng Baseline đầy đủ sinh hàng nghìn truy vấn, DriverManagerDataSource (mỗi truy vấn một socket) làm cạn cổng tạm thời
        SingleConnectionDataSource ds = new SingleConnectionDataSource("jdbc:mysql://localhost:3306/" + db
                + "?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true", "root", "123456", true);
        try (Connection c = ds.getConnection()) { c.isValid(2); } catch (Exception e) { Assumptions.abort("Không có MySQL test: " + e.getMessage()); }
        jdbc = new JdbcTemplate(ds);
        Integer ready = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'l4_review_packages'", Integer.class);
        Assumptions.assumeTrue(ready != null && ready > 0, "Chưa chạy migration_assessment_v2_05 trên " + db);

        var json = JsonMapper.builder().build();
        AssessmentV2Settings settings = new AssessmentV2Settings(true, "LEVEL_ENGINE_V2", "CALISHEALTH_INITIAL_FW2", "CALISHEALTH_SAFETY_V1", 30, "1", "CALISHEALTH_PERIODIC_FW2");
        AssessmentSessionStore store = new AssessmentSessionStore(jdbc, json, settings);
        RuleSetV2Loader loader = new RuleSetV2Loader(jdbc, settings, json);
        SafetyStatusService status = new SafetyStatusService(jdbc, json, settings);
        screening = new SafetyScreeningService(store, new AnswerSupport(store), status, loader, settings, jdbc, json);
        SafetyConfigLoader cfg = new SafetyConfigLoader(jdbc, json);
        CloudinaryService cloudinary = new CloudinaryService();
        ReflectionTestUtils.setField(cloudinary, "cloudName", CLOUD);
        ReflectionTestUtils.setField(cloudinary, "apiKey", "test-key");
        ReflectionTestUtils.setField(cloudinary, "apiSecret", "test-secret");
        l4 = new L4ReviewService(jdbc, json, store, loader, cloudinary, CLOUD, new LevelStateV2Service(jdbc));
        baseline = new BaselineService(store, loader, new SafetyGateService(status, cfg), settings, jdbc, json, l4, new AttemptRecorder(jdbc), new ResultWriter(jdbc, json), new LevelStateV2Service(jdbc));
        Integer mobility = jdbc.queryForObject("SELECT COUNT(*) FROM engine_parameters WHERE param_key LIKE 'mobility.target.%'", Integer.class);
        Assumptions.assumeTrue(mobility != null && mobility >= 3, "Chưa chạy migration_assessment_v2_06 trên " + db);
    }

    @BeforeEach
    void resetClock() { clock = Instant.now().minusSeconds(8 * 3600); mobilityFactor = 1.0; }

    @AfterEach
    void cleanup() {
        for (Long u : users) {
            jdbc.update("DELETE FROM coach_overrides WHERE user_id = ?", u);
            jdbc.update("DELETE FROM level_decisions_v2 WHERE user_id = ?", u);
            jdbc.update("DELETE FROM user_level_state_v2 WHERE user_id = ?", u);
            jdbc.update("DELETE FROM l4_review_packages WHERE user_id = ?", u);
            jdbc.update("DELETE FROM assessment_recording_consents WHERE user_id = ?", u);
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
        String email = "v2l4+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'USER', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private long clearedUser() {
        long u = newUser();
        List<AnswerDto> a = new ArrayList<>();
        for (String q : List.of("SF_Q1_SUPERVISED", "SF_Q2_CHEST_ACTIVE", "SF_Q3_CHEST_REST", "SF_Q4_DIZZY", "SF_Q5_JOINT_BONE", "SF_Q6_MEDICATION", "SF_Q7_OTHER"))
            a.add(new AnswerDto(q, "NO"));
        a.add(new AnswerDto("SF_INJURY_REGIONS", List.of("NONE")));
        StartResponse s = screening.start(u);
        screening.saveAnswers(u, s.sessionId(), a);
        screening.complete(u, s.sessionId());
        return u;
    }

    /** Góc đo thực tế sát mục tiêu (shoulder 180°, pike 90°, squat 135°) nhân hệ số; hệ số thấp = linh hoạt kém. */
    private double mobilityFactor = 1.0;

    private double angleFor(String exercise) {
        double base = switch (exercise) { case "shoulder-flexion-test" -> 175; case "pike-fold-test" -> 85; case "overhead-squat-test" -> 130; default -> throw new IllegalArgumentException(exercise); };
        return base * mobilityFactor;
    }

    private SubmitAttemptRequest strongAttempt(String exercise) {
        Instant start = clock.plusSeconds(300), end = start.plusSeconds(60);
        clock = end;
        String metric = jdbc.queryForObject("SELECT JSON_UNQUOTE(JSON_EXTRACT(config_json, '$.metric')) FROM assessment_questions WHERE question_code = ?", String.class, "PA2_" + exercise);
        long movement = System.nanoTime() % 1_000_000_000L + new Random().nextInt(1000);
        boolean hold = "HOLD_SEC".equals(metric), angle = "ANGLE_DEG".equals(metric);
        return new SubmitAttemptRequest(exercise, movement, start, end, hold || angle ? null : 100, hold || angle ? null : 100,
                hold ? 300.0 : null, angle ? angleFor(exercise) : null, 90.0, 85.0, 0, 0.9, 0.9, 0.95, false, null);
    }

    /** Làm theo đúng bước `next` với kết quả rất mạnh cho tới khi Baseline kết thúc. */
    private BaselineProgressDto runToCompletion(long u, long s) {
        BaselineProgressDto p = baseline.next(u, s);
        for (int i = 0; i < 160 && "IN_PROGRESS".equals(p.outcome()); i++) {
            assertNotNull(p.next(), "IN_PROGRESS không có bước tiếp theo (lần " + i + ") reason=" + p.reasonCode() + " overall=" + p.overallScore() + " comps=" + p.competencies());
            p = baseline.submitAttempt(u, s, strongAttempt(p.next().exerciseCode()));
        }
        return p;
    }

    private record Done(long user, long session, BaselineProgressDto result) {}

    private Done completedL3Baseline(boolean consent) {
        long u = clearedUser();
        long s = baseline.start(u).sessionId();
        if (consent) l4.grantConsent(u, s, true);
        BaselineProgressDto r = runToCompletion(u, s);
        return new Done(u, s, r);
    }

    private String videoUrl(long user) { return "https://res.cloudinary.com/" + CLOUD + "/video/upload/v1/" + L4ReviewService.folderOf(user) + "/abc123.mp4"; }

    private long lastAttemptId(long session) { return jdbc.queryForObject("SELECT MAX(id) FROM assessment_attempts WHERE session_id = ?", Long.class, session); }

    // ------------------------------------------------------------------ tests

    @Test
    void cameraPassingEveryL4Gate_isL3Verified_withAPendingCoachPackage() {
        Done d = completedL3Baseline(true);
        assertEquals("VERIFIED", d.result().outcome());
        assertEquals("L3", d.result().finalLevel());
        assertEquals("L4_AWAITING_COACH_VERIFICATION", d.result().reasonCode());
        assertEquals("PENDING_COACH", d.result().l4Review());
        assertEquals("L3", jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, d.session()));

        L4ReviewSummaryDto pkg = l4.latestFor(d.user()).orElseThrow();
        assertEquals("PENDING", pkg.status());
        assertEquals("L3", pkg.verifiedLevel());
        assertEquals("L4", pkg.pendingLevel());
        L4ReviewDetailDto detail = l4.detail(pkg.id());
        assertFalse(detail.attempts().isEmpty());
        assertTrue(detail.attempts().stream().allMatch(a -> a.videoUrl() == null), "chưa upload video nào");
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_level_state WHERE user_id = ?", Integer.class, d.user()));
    }

    @Test
    void withoutRecordingConsent_userKeepsL3_andIsNotQueuedForCoach() {
        Done d = completedL3Baseline(false);
        assertEquals("L3", d.result().finalLevel());
        assertEquals("RECORDING_CONSENT_REQUIRED", d.result().l4Review());
        assertTrue(l4.latestFor(d.user()).isEmpty());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM l4_review_packages WHERE user_id = ?", Integer.class, d.user()));
        assertThrows(IllegalStateException.class, () -> l4.uploadSignature(d.user(), d.session()));
    }

    @Test
    void videoCanOnlyBeAttached_withConsent_toOwnAttempt_andFromTheUsersOwnCloudinaryFolder() {
        long u = clearedUser(), other = clearedUser();
        long s = baseline.start(u).sessionId();
        baseline.submitAttempt(u, s, strongAttempt("incline-push-up"));
        long attempt = lastAttemptId(s);

        IllegalStateException noConsent = assertThrows(IllegalStateException.class, () -> l4.attachVideo(u, s, attempt, videoUrl(u)));
        assertTrue(noConsent.getMessage().startsWith("RECORDING_CONSENT_REQUIRED"));

        l4.grantConsent(u, s, true);
        for (String bad : new String[]{"https://evil.example/video/upload/x.mp4", videoUrl(other), videoUrl(u) + "?token=1", videoUrl(u).replace("https", "http"),
                videoUrl(u).replace("testcloud", "other"), videoUrl(u) + "/../x", null})
            assertTrue(assertThrows(IllegalArgumentException.class, () -> l4.attachVideo(u, s, attempt, bad)).getMessage().startsWith("INVALID_VIDEO_URL"), String.valueOf(bad));
        assertThrows(IllegalArgumentException.class, () -> l4.attachVideo(other, s, attempt, videoUrl(other)));          // phiên của người khác

        l4.attachVideo(u, s, attempt, videoUrl(u));
        assertEquals(videoUrl(u), jdbc.queryForObject("SELECT video_url FROM assessment_attempts WHERE id = ?", String.class, attempt));
        assertNotNull(jdbc.queryForObject("SELECT video_expires_at FROM assessment_attempts WHERE id = ?", Timestamp.class, attempt));
    }

    @Test
    void uploadSignatureIsScopedToTheUsersFolder_andNeedsConsent() {
        long u = clearedUser();
        long s = baseline.start(u).sessionId();
        assertTrue(assertThrows(IllegalStateException.class, () -> l4.uploadSignature(u, s)).getMessage().startsWith("RECORDING_CONSENT_REQUIRED"));
        l4.grantConsent(u, s, true);
        Map<String, Object> sig = l4.uploadSignature(u, s);
        assertEquals(L4ReviewService.folderOf(u), sig.get("folder"));
        assertNotNull(sig.get("signature"));
        l4.grantConsent(u, s, false);                                                          // rút lại đồng ý
        assertThrows(IllegalStateException.class, () -> l4.uploadSignature(u, s));
    }

    @Test
    void coachCannotConfirmWithoutVideoEvidence_butCanConfirmWithIt_andTheDecisionIsAudited() {
        Done d = completedL3Baseline(true);
        long pkg = l4.latestFor(d.user()).orElseThrow().id();
        long coach = newUser();

        IllegalStateException noVideo = assertThrows(IllegalStateException.class, () -> l4.decide(coach, pkg, "CONFIRM", null));
        assertTrue(noVideo.getMessage().startsWith("VIDEO_EVIDENCE_REQUIRED"));
        assertEquals("PENDING", l4.latestFor(d.user()).orElseThrow().status());

        l4.attachVideo(d.user(), d.session(), lastAttemptId(d.session()), videoUrl(d.user()));   // phiên đã COMPLETED nhưng có gói PENDING => vẫn nhận video
        assertNotNull(l4.detail(pkg).attempts().stream().filter(a -> a.videoUrl() != null).findFirst().orElse(null));

        L4ReviewSummaryDto done = l4.decide(coach, pkg, "confirm", "Form ổn định, 3 rep rõ ràng");
        assertEquals("CONFIRMED", done.status());
        assertEquals("L4", done.confirmedLevel());
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM coach_overrides WHERE target_type = 'L4_REVIEW' AND target_id = ? AND coach_id = ? AND user_id = ?", Integer.class, pkg, coach, d.user()));
        assertTrue(jdbc.queryForObject("SELECT new_value_json FROM coach_overrides WHERE target_id = ? AND target_type = 'L4_REVIEW'", String.class, pkg).contains("COACH_VERIFIED"));

        // dữ liệu đo của camera không bị đụng tới
        assertEquals("L3", jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, d.session()));
        assertTrue(assertThrows(IllegalStateException.class, () -> l4.decide(coach, pkg, "CONFIRM", null)).getMessage().startsWith("REVIEW_NOT_PENDING"));
    }

    @Test
    void rejectAndRetest_needAReason_andAreNeverNegativeEvidence() {
        Done d = completedL3Baseline(true);
        long pkg = l4.latestFor(d.user()).orElseThrow().id();
        long coach = newUser();
        assertTrue(assertThrows(IllegalArgumentException.class, () -> l4.decide(coach, pkg, "REJECT", "  ")).getMessage().startsWith("REASON_REQUIRED"));
        assertThrows(IllegalArgumentException.class, () -> l4.decide(coach, pkg, "MAYBE", "x"));

        L4ReviewSummaryDto r = l4.decide(coach, pkg, "REQUEST_RETEST", "Video rep 3 bị che tay, cần quay lại");
        assertEquals("RETEST_REQUESTED", r.status());
        assertNull(r.confirmedLevel());
        assertEquals("L3", jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, d.session()));   // không hạ, không đổi
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM coach_overrides WHERE target_id = ? AND target_type = 'L4_REVIEW'", Integer.class, pkg));
    }

    @Test
    void coachCannotReviewTheirOwnLevel() {
        Done d = completedL3Baseline(true);
        long pkg = l4.latestFor(d.user()).orElseThrow().id();
        assertThrows(AccessDeniedException.class, () -> l4.decide(d.user(), pkg, "CONFIRM", null));
    }

    @Test
    void overduePackageExpires_andExpiredVideoIsHiddenAndCannotSupportConfirmation() {
        Done d = completedL3Baseline(true);
        long pkg = l4.latestFor(d.user()).orElseThrow().id();
        long attempt = lastAttemptId(d.session());
        l4.attachVideo(d.user(), d.session(), attempt, videoUrl(d.user()));

        jdbc.update("UPDATE assessment_attempts SET video_expires_at = ? WHERE id = ?", Timestamp.from(Instant.now().minusSeconds(60)), attempt);
        assertTrue(l4.detail(pkg).attempts().stream().allMatch(a -> a.videoUrl() == null));
        assertNull(jdbc.queryForObject("SELECT video_url FROM assessment_attempts WHERE id = ?", String.class, attempt));
        assertTrue(assertThrows(IllegalStateException.class, () -> l4.decide(newUser(), pkg, "CONFIRM", null)).getMessage().startsWith("VIDEO_EVIDENCE_REQUIRED"));

        jdbc.update("UPDATE l4_review_packages SET expires_at = ? WHERE id = ?", Timestamp.from(Instant.now().minusSeconds(60)), pkg);
        assertEquals("EXPIRED", l4.latestFor(d.user()).orElseThrow().status());
        assertTrue(assertThrows(IllegalStateException.class, () -> l4.decide(newUser(), pkg, "REJECT", "x")).getMessage().startsWith("REVIEW_NOT_PENDING"));
        assertEquals("L3", jdbc.queryForObject("SELECT level_code FROM assessment_sessions WHERE id = ?", String.class, d.session()));
    }

    @Test
    void aNewPackageSupersedesThePreviousPendingOne() {
        Done d = completedL3Baseline(true);
        long first = l4.latestFor(d.user()).orElseThrow().id();
        long second = l4.openPackage(d.user(), d.session(), "PERIODIC", 1, "L3", "L4", 80.0, 14);
        assertEquals("SUPERSEDED", jdbc.queryForObject("SELECT status FROM l4_review_packages WHERE id = ?", String.class, first));
        assertEquals("PENDING", jdbc.queryForObject("SELECT status FROM l4_review_packages WHERE id = ?", String.class, second));
        assertEquals(1, l4.list("PENDING").stream().filter(p -> p.userId() == d.user()).count());
    }

    // ------------------------------------------------------------------ MOBILITY (góc đo → điểm)

    @Test
    void mobilityTests_areProposedByNext_whenL4RequiresMobility_soTheBaselineNeverStalls() {
        long u = clearedUser();
        long s = baseline.start(u).sessionId();
        Set<String> proposed = new HashSet<>();
        BaselineProgressDto p = baseline.next(u, s);
        for (int i = 0; i < 160 && "IN_PROGRESS".equals(p.outcome()); i++) {
            assertNotNull(p.next(), "không được kẹt IN_PROGRESS mà không có bước tiếp (lần " + i + ")");
            proposed.add(p.next().exerciseCode());
            p = baseline.submitAttempt(u, s, strongAttempt(p.next().exerciseCode()));
        }
        assertTrue(proposed.containsAll(Set.of("shoulder-flexion-test", "pike-fold-test", "overhead-squat-test")), "phải đề xuất đủ 3 bài mobility: " + proposed);
        assertEquals("L3", p.finalLevel());
        assertEquals("PENDING_COACH", p.l4Review() == null ? "PENDING_COACH" : p.l4Review().equals("RECORDING_CONSENT_REQUIRED") ? "PENDING_COACH" : p.l4Review());
        assertTrue(p.competencies().stream().anyMatch(c -> "MOBILITY".equals(c.code()) && c.score() != null && c.score() >= 90));
    }

    @Test
    void completeButLowMobility_isAReliableFailOfL4_soL3WithoutAnyCoachFlag() {
        mobilityFactor = 0.5;                                    // 87° / 42° / 65° => điểm ~ 48, 47, 48 < 60
        long u = clearedUser();
        long s = baseline.start(u).sessionId();
        l4.grantConsent(u, s, true);
        BaselineProgressDto r = runToCompletion(u, s);
        assertEquals("VERIFIED", r.outcome());
        assertEquals("L3", r.finalLevel());
        assertNull(r.l4Review());                                // không đủ cổng L4 => không có cờ chờ Coach
        assertNull(r.reasonCode());
        assertTrue(l4.latestFor(u).isEmpty());
        assertTrue(r.competencies().stream().anyMatch(c -> "MOBILITY".equals(c.code()) && c.score() != null && c.score() < 60));
    }

    @Test
    void implausibleAngle_isInvalidMeasurement_neverAHighScore() {
        long u = clearedUser();
        long s = baseline.start(u).sessionId();
        Instant start = clock.plusSeconds(300);
        SubmitAttemptRequest absurd = new SubmitAttemptRequest("shoulder-flexion-test", System.nanoTime() % 1_000_000_000L, start, start.plusSeconds(60),
                null, null, null, 400.0, 90.0, 85.0, 0, 0.9, 0.9, 0.95, false, null);       // 400° > 1.5 × 180°
        l4.grantConsent(u, s, true);
        clock = start.plusSeconds(60);
        BaselineProgressDto r = baseline.submitAttempt(u, s, absurd);
        assertEquals("INVALID_MEASUREMENT", r.lastAttempt().measurementStatus());
        assertEquals("IMPLAUSIBLE_VALUE", r.lastAttempt().invalidReason());
        assertTrue(r.competencies().stream().noneMatch(c -> "MOBILITY".equals(c.code())), "số đo phi lý không được tạo ra điểm MOBILITY");

        // bài hỏng không bị bỏ qua để lấy trung bình hai bài còn lại: tới L4 thì chặn kết luận => RETEST_REQUIRED (không phải L3, không có cờ chờ Coach)
        BaselineProgressDto end = runToCompletion(u, s);
        assertEquals("RETEST_REQUIRED", end.outcome());
        assertNull(end.finalLevel());
        assertNull(end.l4Review());
        assertTrue(l4.latestFor(u).isEmpty());
    }
}
