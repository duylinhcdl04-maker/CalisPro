package com.calishealth.api.engine;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.CompetencyScoringEngine;
import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;
import com.calishealth.api.engine.level.CompetencyScoringEngine.NodeObservation;
import com.calishealth.api.engine.level.CompetencyScoringEngine.ScoreObservation;
import com.calishealth.api.engine.level.ConsistencyChecker;
import com.calishealth.api.engine.level.LevelEvaluationEngine;
import com.calishealth.api.engine.level.LevelModels.*;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static com.calishealth.api.engine.TestRuleSets.id;
import static com.calishealth.api.engine.level.LevelModels.*;
import static org.junit.jupiter.api.Assertions.*;

/** Các ví dụ số end-to-end trong backend/docs/LEVEL_ASSESSMENT_ROADMAP_DESIGN.md §20 (golden tests). */
class LevelEngineExamplesTest {
    private final RuleSetConfig rs = TestRuleSets.defaults();
    private final Instant now = Instant.parse("2026-10-07T00:00:00Z");

    // ---------------------------------------------------------------- Ví dụ 1
    @Test
    void example1_questionnaireOnly_givesProvisionalBeginner() {
        Map<String, Double> ladder = CompetencyScoringEngine.ladderScores(rs, List.of(
                new NodeObservation(id("push-up"), 15),
                new NodeObservation(id("australian-pull-up"), 10),
                new NodeObservation(id("bodyweight-squat"), 30),
                new NodeObservation(id("plank"), 60),
                new NodeObservation(id("wall-pike-hold"), 0)));   // "chưa làm được bài kỹ năng nào"
        Map<String, Double> obs = CompetencyScoringEngine.combine(rs, ladder, List.of(new ScoreObservation("MOBILITY", 50, 1)));

        assertEquals(35.0, obs.get("PUSH"));
        assertEquals(27.5, obs.get("PULL"));
        assertEquals(35.0, obs.get("LEGS"));
        assertEquals(25.0, obs.get("CORE"));
        assertEquals(50.0, obs.get("MOBILITY"));
        assertEquals(0.0, obs.get("SKILL"));

        Map<String, CompetencyResult> comps = blendSelfReport(obs);
        Double overall = CompetencyScoringEngine.overall(rs, comps);
        assertEquals(27.75, overall);
        assertEquals(0.5, comps.get("PUSH").confidence());

        var result = LevelEvaluationEngine.provisional(rs, comps, overall, Set.of(), false);
        assertEquals("L1", result.finalLevel());
    }

    @Test
    void provisional_isCappedAtL2_andDowngradedOnConflict() {
        Map<String, CompetencyResult> strong = new LinkedHashMap<>();
        for (String c : List.of("PUSH", "PULL", "LEGS", "CORE", "MOBILITY", "SKILL")) strong.put(c, res(c, 95, 0.5));
        assertEquals("L2", LevelEvaluationEngine.provisional(rs, strong, 95.0, Set.of(), false).finalLevel());
        assertEquals("L1", LevelEvaluationEngine.provisional(rs, strong, 95.0, Set.of("PULL"), false).finalLevel());
        assertEquals("L1", LevelEvaluationEngine.provisional(rs, strong, 95.0, Set.of(), true).finalLevel());
    }

    @Test
    void consistencyRule_flagsNeverTrainedButTenPullUps() {
        var r = ConsistencyChecker.check(rs, Map.of("CH_EXPERIENCE", "NONE"), Map.of("pull-up", 12.0), Map.of("PULL", 52.0), 1.0);
        assertTrue(r.conflictedCompetencies().contains("PULL"));
        assertEquals("CONFLICTED", r.qualityByCompetency().get("PULL"));
        assertEquals("HIGH", r.qualityByCompetency().get("PUSH"));
    }

    // ---------------------------------------------------------------- Ví dụ 2
    @Test
    void example2_highOverallButWeakPull_isMaintained() {
        Map<String, CompetencyResult> comps = measured(62, 38, 60, 55, 55, 30);
        assertEquals(50.0, CompetencyScoringEngine.overall(rs, comps));
        LevelContext ctx = ctx("L1", "VERIFIED", 48.0, comps, List.of(
                test("push-up", "PUSH", 28, 25, 81), test("pull-up", "PULL", 4, 3, 81),
                test("dips", "PUSH", 7, 6, 81), test("bodyweight-squat", "LEGS", 44, 40, 81)),
                Map.of(), null, List.of());
        Outcome o = LevelEvaluationEngine.evaluate(ctx, rs);
        assertEquals(MAINTAINED, o.decision());
        assertEquals("L2", o.candidateLevel());
        assertEquals("L1", o.finalLevel());
        assertEquals(FAIL, o.gate(G_COMPETENCY));
        assertEquals(FAIL, o.gate(G_PERFORMANCE));
        assertTrue(o.reasons().stream().anyMatch(r -> "PULL".equals(r.competency()) && !r.passed() && G_COMPETENCY.equals(r.gate())));
        assertEquals("INTERMEDIATE", rs.band(62.0, null));
        assertEquals("BEGINNER", rs.band(38.0, null));
    }

    // ---------------------------------------------------------------- Ví dụ 3
    @Test
    void example3_allSixGatesPass_promotesToIntermediate() {
        Map<String, CompetencyResult> comps = measured(68, 55, 64, 60, 52, 40);
        assertEquals(57.4, CompetencyScoringEngine.overall(rs, comps));
        List<TrainingObservation> logs = List.of(
                new TrainingObservation(id("pull-up"), now.minus(2, ChronoUnit.DAYS), 6, 80.0),
                new TrainingObservation(id("pull-up"), now.minus(5, ChronoUnit.DAYS), 5, 78.0),
                new TrainingObservation(id("pull-up"), now.minus(9, ChronoUnit.DAYS), 4, 82.0),
                new TrainingObservation(id("pull-up"), now.minus(12, ChronoUnit.DAYS), 7, 79.0));
        LevelContext ctx = ctx("L1", "VERIFIED", 51.0, comps, List.of(
                test("push-up", "PUSH", 34, 30, 83), test("pull-up", "PULL", 8, 7, 83),
                test("dips", "PUSH", 9, 8, 83), test("bodyweight-squat", "LEGS", 51, 45, 83)),
                Map.of(id("pull-up"), "ACHIEVED"),
                new PreviousEvaluation("L2", FAIL, MAINTAINED, now.minus(35, ChronoUnit.DAYS)), logs);
        Outcome o = LevelEvaluationEngine.evaluate(ctx, rs);
        assertEquals(PROMOTED, o.decision(), () -> o.reasons().toString());
        assertEquals("L2", o.finalLevel());
        assertEquals(54.2, o.ewma());
        for (String g : List.of(G_RELIABILITY, G_PERFORMANCE, G_QUALITY, G_COMPETENCY, G_SKILL, G_STABILITY)) assertEquals(PASS, o.gate(g), g);
        assertTrue(o.reasons().stream().anyMatch(r -> "TRAINING_LOG_WINDOW".equals(r.code()) && r.passed()));
    }

    @Test
    void stabilityFails_withoutPreviousOrTrainingConfirmation() {
        Map<String, CompetencyResult> comps = measured(68, 55, 64, 60, 52, 40);
        LevelContext ctx = ctx("L1", "VERIFIED", 51.0, comps, List.of(
                test("push-up", "PUSH", 34, 30, 83), test("pull-up", "PULL", 8, 7, 83),
                test("dips", "PUSH", 9, 8, 83), test("bodyweight-squat", "LEGS", 51, 45, 83)),
                Map.of(id("pull-up"), "ACHIEVED"), null, List.of());
        Outcome o = LevelEvaluationEngine.evaluate(ctx, rs);
        assertEquals(MAINTAINED, o.decision());
        assertEquals(FAIL, o.gate(G_STABILITY));
    }

    // ---------------------------------------------------------------- Ví dụ 4
    @Test
    void example4_oneBadAssessmentDoesNotRegress_butConfirmedDeclineDoes() {
        List<TestOutcome> tests = List.of(test("push-up", "PUSH", 20, 18, 70));
        Outcome a = LevelEvaluationEngine.evaluate(ctx("L2", "VERIFIED", 55.0, 0, flat(36), tests), rs);
        assertEquals(MAINTAINED, a.decision());
        assertEquals(45.5, a.ewma());
        assertEquals(0, a.consecutiveBelow());

        Outcome b = LevelEvaluationEngine.evaluate(ctx("L2", "VERIFIED", a.ewma(), a.consecutiveBelow(), flat(38), tests), rs);
        assertEquals(MAINTAINED, b.decision());
        assertEquals(41.75, b.ewma());
        assertEquals(1, b.consecutiveBelow());

        Outcome c = LevelEvaluationEngine.evaluate(ctx("L2", "VERIFIED", b.ewma(), b.consecutiveBelow(), flat(37), tests), rs);
        assertEquals(REGRESSED, c.decision());
        assertEquals("L1", c.finalLevel());
    }

    @Test
    void hysteresis_scoresAroundThresholdDoNotOscillate() {
        List<TestOutcome> tests = List.of(test("push-up", "PUSH", 20, 18, 70));
        double ewma = 50;
        int below = 0;
        for (double score : new double[]{49, 51, 47, 50, 46, 49}) {
            Outcome o = LevelEvaluationEngine.evaluate(ctx("L2", "VERIFIED", ewma, below, flat(score), tests), rs);
            assertEquals("L2", o.finalLevel());
            ewma = o.ewma();
            below = o.consecutiveBelow();
        }
    }

    // ---------------------------------------------------------------- Ví dụ 5
    @Test
    void example5_unreliableMeasurement_requiresRetest() {
        TestOutcome poor = new TestOutcome(id("push-up"), "push-up", "PUSH", "VALID_REPS", 20, 18, null, null, 80.0, 80.0, 0,
                0.45, 0.9, null, 0.69, 0.4, "AI_MEASURED", "VALID", true);
        Outcome o = LevelEvaluationEngine.evaluate(ctx("L1", "VERIFIED", 40.0, 0, measured(60, 60, 60, 60, 60, 60), List.of(poor)), rs);
        assertEquals(RETEST_REQUIRED, o.decision());
        assertEquals("L1", o.finalLevel());
        assertEquals(FAIL, o.gate(G_RELIABILITY));
    }

    @Test
    void calibration_replacesProvisionalLevelWithMeasuredLevel() {
        // Tự khai được L2 nhưng đo thực tế chỉ đạt L1 (pull-up 2 rep)
        Map<String, CompetencyResult> comps = measured(55, 35, 50, 50, 50, 30);
        LevelContext ctx = ctx("L2", "PROVISIONAL", 52.0, comps, List.of(
                test("push-up", "PUSH", 25, 22, 80), test("pull-up", "PULL", 3, 2, 80),
                test("plank", "CORE", null, null, 80, 70.0), test("incline-push-up", "PUSH", 30, 28, 80)),
                Map.of(), null, List.of());
        Outcome o = LevelEvaluationEngine.evaluate(ctx, rs);
        assertTrue(o.calibration());
        assertEquals("L1", o.finalLevel());
        assertEquals(REGRESSED, o.decision());
        assertEquals("VERIFIED", o.newStatus());
    }

    // ================================================================= helpers

    private Map<String, CompetencyResult> blendSelfReport(Map<String, Double> obs) {
        Map<String, CompetencyScoringEngine.Observation> cur = new LinkedHashMap<>();
        obs.forEach((c, v) -> cur.put(c, new CompetencyScoringEngine.Observation(c, v, "SELF_REPORTED", 0.5, 1.0, now)));
        return CompetencyScoringEngine.blend(rs, List.of(), cur, Map.of(), now);
    }

    private CompetencyResult res(String c, double score, double conf) {
        return new CompetencyResult(c, score, score, conf, rs.band(score, null), null, "AI_MEASURED", null);
    }

    private Map<String, CompetencyResult> measured(double push, double pull, double legs, double core, double mob, double skill) {
        Map<String, CompetencyResult> m = new LinkedHashMap<>();
        m.put("PUSH", res("PUSH", push, 0.92)); m.put("PULL", res("PULL", pull, 0.92)); m.put("LEGS", res("LEGS", legs, 0.92));
        m.put("CORE", res("CORE", core, 0.92)); m.put("MOBILITY", res("MOBILITY", mob, 0.92)); m.put("SKILL", res("SKILL", skill, 0.92));
        return m;
    }

    private Map<String, CompetencyResult> flat(double v) { return measured(v, v, v, v, v, v); }

    private TestOutcome test(String code, String comp, Integer total, Integer valid, double form) {
        return test(code, comp, total, valid, form, null);
    }

    private TestOutcome test(String code, String comp, Integer total, Integer valid, double form, Double hold) {
        return new TestOutcome(id(code), code, comp, hold != null ? "HOLD_SEC" : "VALID_REPS", total, valid, hold, null,
                form, 88.0, 0, 0.82, 0.90, null, 0.93, 0.85, "AI_MEASURED", "VALID", true);
    }

    private LevelContext ctx(String level, String status, Double ewma, Map<String, CompetencyResult> comps, List<TestOutcome> tests,
                             Map<Long, String> nodes, PreviousEvaluation prev, List<TrainingObservation> logs) {
        return new LevelContext(level, status, ewma, 0, comps, CompetencyScoringEngine.overall(rs, comps), tests, nodes,
                TestRuleSets.graph().harderEquivalents(), prev, logs, false, false, false, now);
    }

    private LevelContext ctx(String level, String status, Double ewma, int below, Map<String, CompetencyResult> comps, List<TestOutcome> tests) {
        return new LevelContext(level, status, ewma, below, comps, CompetencyScoringEngine.overall(rs, comps), tests, Map.of(),
                TestRuleSets.graph().harderEquivalents(), null, List.of(), false, false, false, now);
    }
}
