package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** 20 ca kiểm thử của ruleEniges.md §61 + kiểm tra cấu hình. */
class MotionRuleEngineTest {

    // ------------------------------------------------------------ dữ liệu mẫu

    /** Rule ví dụ của ruleEniges §43: chuẩn 45–70, cảnh báo 40–44 / 71–75, lỗi 30–39 / 76–85, nghiêm trọng <30 / >85. */
    static RuleDef elbowRule(long id, String status, String phase, int persistence, boolean normalMaxInclusive) {
        List<Band> bands = List.of(
                new Band(Severity.WARNING, 40.0, 45.0, true, false), new Band(Severity.WARNING, 70.0, 75.0, false, true),
                new Band(Severity.ERROR, 30.0, 40.0, true, false), new Band(Severity.ERROR, 75.0, 85.0, false, true),
                new Band(Severity.CRITICAL, null, 30.0, false, false), new Band(Severity.CRITICAL, 85.0, null, false, false));
        return new RuleDef(id, "PUSHUP_ELBOW_FLARE_001", 1, "Khuỷu tay xòe quá rộng", status, phase,
                Measurement.angle(11, 13, 15), "DEGREE", Operator.BETWEEN, 60.0, 45.0, 70.0, true, normalMaxInclusive,
                bands, Severity.WARNING, 8, true, null, false, PersistenceType.FRAME, persistence, 3000, 0,
                "PUSHUP_ELBOW_FLARE_ERROR", null);
    }

    static RuleDef simpleRule(long id, String code, int priority, Operator op, Double min, Double max, Severity sev,
                              String phase, boolean invalidRep, boolean stop, String status, int version) {
        return new RuleDef(id, code, version, code, status, phase, Measurement.angle(11, 13, 15), "DEGREE", op, null, min, max,
                true, true, List.of(), sev, priority, invalidRep, null, stop, PersistenceType.FRAME, 1, 3000, 0, code + "_FB", null);
    }

    static ProfileDef profile(String movementType) {
        return new ProfileDef(1, "1.0", "SIDE", movementType, Measurement.angle(11, 13, 15), 160.0, 90.0, "DESCENDING_FIRST",
                0, 300, 10_000, 0.6, 0.5, Map.of());
    }

    /** Khung có góc khuỷu (11-13-15) = angle độ; mọi landmark visibility = vis. */
    static PoseFrame frame(long t, double angle, double vis) {
        List<Landmark> lm = new ArrayList<>();
        for (int i = 0; i < 33; i++) lm.add(new Landmark(0.5, 0.5, 0, vis));
        double rad = Math.toRadians(angle);
        lm.set(11, new Landmark(0.5, 0.3, 0, vis));                      // vai
        lm.set(13, new Landmark(0.5, 0.5, 0, vis));                      // khuỷu
        lm.set(15, new Landmark(0.5 + 0.2 * Math.sin(rad), 0.5 - 0.2 * Math.cos(rad), 0, vis));   // cổ tay
        lm.set(12, new Landmark(0.52, 0.3, 0, vis));
        lm.set(23, new Landmark(0.5, 0.7, 0, vis));
        lm.set(24, new Landmark(0.52, 0.7, 0, vis));
        return new PoseFrame(t, lm, 1.0);
    }

    static Status classify(RuleDef r, double v) { return ThresholdClassifier.classify(r, v).status(); }

    // ------------------------------------------------------------ 1–6 phân loại ngưỡng

    @Test void t01_normalAngle() { assertEquals(Status.NORMAL, classify(elbowRule(1, "PUBLISHED", "ALL", 1, true), 60)); }
    @Test void t02_warningAngle() { assertEquals(Status.WARNING, classify(elbowRule(1, "PUBLISHED", "ALL", 1, true), 72)); }
    @Test void t03_errorAngle() { assertEquals(Status.ERROR, classify(elbowRule(1, "PUBLISHED", "ALL", 1, true), 78)); }

    @Test void t04_criticalAngle() {
        RuleDef r = elbowRule(1, "PUBLISHED", "ALL", 1, true);
        assertEquals(Status.CRITICAL, classify(r, 90));
        assertEquals(Status.CRITICAL, classify(r, 25));
    }

    @Test void t05_exactBoundaries() {
        RuleDef r = elbowRule(1, "PUBLISHED", "ALL", 1, true);
        assertEquals(Status.NORMAL, classify(r, 70));
        assertEquals(Status.NORMAL, classify(r, 45));
        assertEquals(Status.WARNING, classify(r, 75));
        assertEquals(Status.ERROR, classify(r, 85));
        assertEquals(Status.CRITICAL, classify(r, 85.0001));
        assertEquals(Status.WARNING, classify(r, 44.5));     // không có "khe" 44–45 như cách viết 40–44
    }

    @Test void t06_inclusiveBoundary() {
        RuleDef exclusive = elbowRule(1, "PUBLISHED", "ALL", 1, false);
        assertEquals(Status.UNCLASSIFIED, classify(exclusive, 70));   // 70 không chuẩn (exclusive) nhưng dải cảnh báo bắt đầu > 70
        RuleDef deviation = new RuleDef(2, "BODY_LINE", 1, "Thân thẳng", "PUBLISHED", "ALL", Measurement.angle(11, 23, 27), "DEGREE",
                Operator.DEVIATION_FROM_TARGET, 180.0, null, 10.0, true, true,
                List.of(new Band(Severity.WARNING, 10.0, 20.0, false, true), new Band(Severity.ERROR, 20.0, null, false, false)),
                Severity.WARNING, 9, false, null, false, PersistenceType.FRAME, 1, 0, 0, "BODY_LINE_FB", null);
        assertEquals(Status.NORMAL, classify(deviation, 170));
        assertEquals(Status.WARNING, classify(deviation, 165));
        assertEquals(Status.ERROR, classify(deviation, 150));
    }

    // ------------------------------------------------------------ 7 cấu hình không hợp lệ

    @Test void t07_invalidLandmarkAndOverlap() {
        RuleDef bad = new RuleDef(1, "BAD_RULE", 1, "x", "DRAFT", "ALL",
                new Measurement(MetricType.ANGLE_3_POINT, List.of(11, 11, 40), null, null, null, null, null), "DEGREE",
                Operator.BETWEEN, 60.0, 45.0, 70.0, true, true,
                List.of(new Band(Severity.WARNING, 60.0, 80.0, true, true), new Band(Severity.ERROR, 75.0, 90.0, true, true)),
                Severity.WARNING, 11, false, null, true, PersistenceType.FRAME, 0, -1, 0, "", null);
        MotionRuleValidator.Result res = MotionRuleValidator.validate(bad, Set.of("BOTTOM"), false);
        String all = String.join(" | ", res.errors());
        assertFalse(res.valid());
        assertTrue(all.contains("khác nhau"), all);
        assertTrue(all.contains("#40"), all);
        assertTrue(all.contains("chồng lên biên độ chuẩn"), all);
        assertTrue(all.contains("chồng lấn"), all);
        assertTrue(all.contains("1 đến 10"), all);
        assertTrue(all.contains("persistence"), all);
        assertTrue(all.contains("CRITICAL"), all);
        assertTrue(all.contains("Feedback Code"), all);

        assertTrue(MotionRuleValidator.validate(elbowRule(1, "DRAFT", "ALL", 5, true), Set.of("BOTTOM"), true).valid());
    }

    // ------------------------------------------------------------ 8 dữ liệu kém tin cậy

    @Test void t08_lowPoseConfidence_noFormWarning() {
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(elbowRule(1, "PUBLISHED", "ALL", 1, true)), "SIDE", false);
        FrameEvaluation e = engine.process(frame(0, 90, 0.3));    // góc 90 = CRITICAL nhưng dữ liệu không tin cậy
        assertEquals(MotionRuleEngine.UNRELIABLE, e.measurementStatus());
        assertTrue(e.violations().isEmpty());
        assertEquals(Status.UNRELIABLE, e.results().get(0).status());
    }

    // ------------------------------------------------------------ 9–10 persistence

    @Test void t09_persistenceNotSatisfied() {
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(elbowRule(1, "PUBLISHED", "ALL", 3, true)), "SIDE", false);
        double[] seq = {78, 78, 60, 78};   // ERROR, ERROR, PASS, ERROR
        List<Violation> all = new ArrayList<>();
        for (int i = 0; i < seq.length; i++) all.addAll(engine.process(frame(i * 33L, seq[i], 0.9)).violations());
        assertTrue(all.isEmpty());
    }

    @Test void t10_persistenceSatisfied_bySeverityLevel() {
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(elbowRule(1, "PUBLISHED", "ALL", 3, true)), "SIDE", false);
        engine.process(frame(0, 72, 0.9));            // WARNING
        engine.process(frame(33, 78, 0.9));           // ERROR
        FrameEvaluation e3 = engine.process(frame(66, 78, 0.9));
        assertEquals(Severity.WARNING, e3.violations().get(0).severity());   // ≥ WARNING đã 3 khung, ERROR mới 2
        FrameEvaluation e4 = engine.process(frame(99, 78, 0.9));
        assertEquals(Severity.ERROR, e4.violations().get(0).severity());
        assertEquals(1, e4.newViolations().size());   // tăng mức -> sự kiện mới
        assertEquals(78, e4.violations().get(0).observedValue(), 0.01);
        assertEquals("45–70 DEGREE", e4.violations().get(0).expected());
    }

    @Test void timePersistence() {
        RuleDef r = elbowRule(1, "PUBLISHED", "ALL", 300, true);
        r = new RuleDef(r.id(), r.code(), r.version(), r.name(), r.status(), r.phase(), r.measurement(), r.unit(), r.operator(), r.target(),
                r.normalMin(), r.normalMax(), true, true, r.bands(), r.severity(), r.priority(), r.invalidRep(), null, r.stopExercise(),
                PersistenceType.TIME, 300, r.cooldownMs(), 0, r.feedbackCode(), null);
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(r), "SIDE", false);
        assertTrue(engine.process(frame(0, 78, 0.9)).violations().isEmpty());
        assertTrue(engine.process(frame(200, 78, 0.9)).violations().isEmpty());
        assertFalse(engine.process(frame(320, 78, 0.9)).violations().isEmpty());
    }

    // ------------------------------------------------------------ 11–14 cooldown, nhiều vi phạm, ưu tiên

    static Violation v(String code, int priority, Severity s, String phase) {
        return new Violation(code.hashCode(), code, 1, code, s, priority, MetricType.ANGLE_3_POINT, 0, 0, "DEGREE", null, null, null,
                "", code + "_FB", false, false, phase, 0, 1);
    }

    @Test void t11_t12_cooldown() {
        ViolationAggregator agg = new ViolationAggregator();
        Map<String, Long> cd = Map.of("HIP_FB", 3000L);
        assertEquals(FeedbackMode.SIMPLE, agg.decide(List.of(v("HIP", 9, Severity.ERROR, "BOTTOM")), cd, 10_000).mode());
        FeedbackDecision during = agg.decide(List.of(v("HIP", 9, Severity.ERROR, "BOTTOM")), cd, 11_000);
        assertEquals(FeedbackMode.NONE, during.mode());
        assertEquals(List.of("HIP_FB"), during.suppressedByCooldown());
        assertEquals(FeedbackMode.SIMPLE, agg.decide(List.of(v("HIP", 9, Severity.ERROR, "BOTTOM")), cd, 13_000).mode());
    }

    @Test void t13_t14_multipleViolations_priority() {
        ViolationAggregator agg = new ViolationAggregator();
        FeedbackDecision d = agg.decide(List.of(v("TEMPO", 3, Severity.WARNING, "BOTTOM"), v("ELBOW", 7, Severity.ERROR, "BOTTOM"),
                v("HIP", 9, Severity.WARNING, "BOTTOM")), Map.of(), 0);
        assertEquals("HIP", d.primary().ruleCode());          // ưu tiên cao nhất thắng dù mức thấp hơn
        assertEquals(FeedbackMode.COMBINED, d.mode());
        assertEquals(List.of("ELBOW", "TEMPO"), d.related().stream().map(x -> x.ruleCode()).toList());
    }

    // ------------------------------------------------------------ 15 rep không hợp lệ

    @Test void t15_invalidRep() {
        RuleDef depth = simpleRule(1, "PUSHUP_DEPTH", 7, Operator.MAXIMUM_ALLOWED, null, 85.0, Severity.ERROR, "BOTTOM", true, false, "PUBLISHED", 1);
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(depth), "SIDE", false);
        RepResult first = runRep(engine, 0, 88);    // đáy 88° > 85° -> rep không hợp lệ
        RepResult second = runRep(engine, 2000, 80);
        assertNotNull(first);
        assertFalse(first.valid());
        assertTrue(first.violationCodes().contains("PUSHUP_DEPTH"));
        assertTrue(second.valid());
        SessionSummary s = engine.summary();
        assertEquals(2, s.totalReps());
        assertEquals(1, s.validReps());
        assertEquals(1.0, s.trackedRatio(), 1e-9);
    }

    /** Một rep: 170 -> xuống -> đáy -> lên -> 170. Trả về kết quả rep. */
    static RepResult runRep(MotionRuleEngine engine, long t0, double bottom) {
        double[] seq = {170, 150, 120, bottom, bottom, 120, 150, 170};
        RepResult done = null;
        for (int i = 0; i < seq.length; i++) {
            FrameEvaluation e = engine.process(frame(t0 + i * 100L, seq[i], 0.9));
            if (e.completedRep() != null) done = e.completedRep();
        }
        return done;
    }

    @Test void romAndRepSequence_evaluatedAtRepEnd() {
        RuleDef rom = new RuleDef(5, "PUSHUP_ROM", 1, "Biên độ", "PUBLISHED", "ALL",
                new Measurement(MetricType.ROM, List.of(11, 13, 15), null, null, null, null, null), "DEGREE",
                Operator.MINIMUM_REQUIRED, null, 70.0, null, true, true, List.of(), Severity.ERROR, 6, true, null, false,
                PersistenceType.FRAME, 1, 0, 0, "ROM_FB", null);
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(rom), "SIDE", false);
        RepResult shallow = runRep(engine, 0, 105);   // không tới đáy 90 -> lần thử không trọn
        assertFalse(shallow.complete());
        assertFalse(shallow.valid());
        RepResult full = runRep(engine, 2000, 85);
        assertTrue(full.complete());
        assertEquals(85, full.metrics().get(rom.measurement().featureKey()), 0.01);   // 170 − 85
        assertTrue(full.valid());
    }

    // ------------------------------------------------------------ 16 critical dừng bài tập

    @Test void invalidRepMinSeverity_warningDoesNotInvalidate() {
        RuleDef base = elbowRule(1, "PUBLISHED", "ALL", 1, true);
        RuleDef errOnly = new RuleDef(1, base.code(), 1, base.name(), "PUBLISHED", "ALL", base.measurement(), "DEGREE", base.operator(),
                base.target(), base.normalMin(), base.normalMax(), true, true, base.bands(), base.severity(), 8, true, Severity.ERROR, false,
                PersistenceType.FRAME, 1, 0, 0, base.feedbackCode(), null);
        assertFalse(errOnly.invalidatesRep(Severity.WARNING));
        assertTrue(errOnly.invalidatesRep(Severity.ERROR));
        assertTrue(base.invalidatesRep(Severity.WARNING));
    }

    @Test void t16_criticalStopExercise() {
        RuleDef critical = simpleRule(1, "UNSAFE", 10, Operator.MINIMUM_REQUIRED, 30.0, null, Severity.CRITICAL, "ALL", true, true, "PUBLISHED", 1);
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(critical), "SIDE", false);
        assertTrue(engine.process(frame(0, 20, 0.9)).stopRequested());
        RuleDef noStop = simpleRule(2, "UNSAFE2", 10, Operator.MINIMUM_REQUIRED, 30.0, null, Severity.CRITICAL, "ALL", true, false, "PUBLISHED", 1);
        assertFalse(new MotionRuleEngine(profile("REPS"), List.of(noStop), "SIDE", false).process(frame(0, 20, 0.9)).stopRequested());
    }

    // ------------------------------------------------------------ 17 khác pha

    @Test void t17_ruleOnlyInConfiguredPhase() {
        RuleDef bottomOnly = elbowRule(1, "PUBLISHED", "BOTTOM", 1, true);
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(bottomOnly), "SIDE", false);
        FrameEvaluation top = engine.process(frame(0, 170, 0.9));     // pha TOP: rule BOTTOM không xét
        assertEquals("TOP", top.phase());
        assertTrue(top.results().isEmpty());
        engine.process(frame(100, 120, 0.9));
        FrameEvaluation bottom = engine.process(frame(200, 88, 0.9));
        assertEquals("BOTTOM", bottom.phase());
        assertEquals(Severity.CRITICAL, bottom.violations().get(0).severity());
    }

    // ------------------------------------------------------------ 18–20 version & trạng thái

    @Test void t18_ruleVersionCarriedIntoViolation() {
        RuleDef v2 = simpleRule(9, "PUSHUP_DEPTH", 7, Operator.MAXIMUM_ALLOWED, null, 85.0, Severity.ERROR, "ALL", false, false, "PUBLISHED", 2);
        Violation v = new MotionRuleEngine(profile("REPS"), List.of(v2), "SIDE", false).process(frame(0, 100, 0.9)).violations().get(0);
        assertEquals(2, v.ruleVersion());
        assertEquals(9, v.ruleId());
    }

    @Test void t19_t20_draftAndArchivedNotExecuted() {
        RuleDef draft = elbowRule(1, "DRAFT", "ALL", 1, true);
        RuleDef archived = elbowRule(2, "ARCHIVED", "ALL", 1, true);
        RuleDef pending = elbowRule(3, "PENDING_REVIEW", "ALL", 1, true);
        MotionRuleEngine engine = new MotionRuleEngine(profile("REPS"), List.of(draft, archived, pending), "SIDE", false);
        assertTrue(engine.activeRules().isEmpty());
        assertTrue(engine.process(frame(0, 90, 0.9)).violations().isEmpty());
        // Rule Tester được phép chạy bản nháp
        assertEquals(1, new MotionRuleEngine(profile("REPS"), List.of(draft), "SIDE", true).activeRules().size());
    }

    @Test void cameraViewMismatch_skipsRule() {
        RuleDef front = elbowRule(1, "PUBLISHED", "ALL", 1, true);
        front = new RuleDef(front.id(), front.code(), 1, front.name(), "PUBLISHED", "ALL", front.measurement(), "DEGREE", front.operator(),
                front.target(), front.normalMin(), front.normalMax(), true, true, front.bands(), front.severity(), 8, true, null, false,
                PersistenceType.FRAME, 1, 0, 0, front.feedbackCode(), "FRONT");
        FrameEvaluation e = new MotionRuleEngine(profile("REPS"), List.of(front), "SIDE", false).process(frame(0, 90, 0.9));
        assertEquals(Status.SKIPPED, e.results().get(0).status());
        assertTrue(e.violations().isEmpty());
    }

    @Test void holdExercise_durationTracked() {
        ProfileDef hold = new ProfileDef(2, "1.0", "SIDE", "HOLD", Measurement.angle(11, 13, 15), 180.0, 150.0, null, 0, 0, 0, 0.6, 0.5, Map.of());
        MotionRuleEngine engine = new MotionRuleEngine(hold, List.of(), "SIDE", false);
        for (int i = 0; i <= 30; i++) engine.process(frame(i * 100L, 170, 0.9));
        assertEquals(3.0, engine.summary().holdSec(), 0.01);
    }

    @Test void visibilityAverageCountsTheRepMetricLandmarks_evenWithoutAnyPublishedRule() {
        MotionRuleEngine seen = new MotionRuleEngine(profile("REPS"), List.of(), "SIDE", false);
        for (int i = 0; i < 10; i++) seen.process(frame(i * 100L, 170, 0.9));
        assertEquals(0.9, seen.summary().visibilityAvg(), 1e-9, "không có rule vẫn phải có độ thấy khớp thật, không phải 0");

        MotionRuleEngine hidden = new MotionRuleEngine(profile("REPS"), List.of(), "SIDE", false);
        for (int i = 0; i < 10; i++) hidden.process(frame(i * 100L, 170, 0.3));
        assertTrue(hidden.summary().visibilityAvg() < 0.5, "khớp bị che thì độ thấy phải thấp");
    }
}
