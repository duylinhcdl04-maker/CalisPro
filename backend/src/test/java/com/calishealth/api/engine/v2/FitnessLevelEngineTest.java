package com.calishealth.api.engine.v2;

import com.calishealth.api.engine.v2.level.FitnessLevelEngine;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Nhóm G4 (trần L2 Initial) + I19 (thiếu bằng chứng không phải FAIL, không hạ level). */
class FitnessLevelEngineTest {
    private final FitnessLevelEngine engine = new FitnessLevelEngine();

    private static Map<String, Double> comp(double push, double pull, double legs, double core, double mob, double skill) {
        return Map.of("PUSH", push, "PULL", pull, "LEGS", legs, "CORE", core, "MOBILITY", mob, "SKILL", skill);
    }

    private InitialResult run(Double overall, Map<String, Double> c, Map<String, SkillState> skills, Set<String> conflicted, double conf, RuleParams p) {
        return engine.evaluateInitial(new InitialInput(overall, c, skills, conflicted, conf, V2TestFixtures.levels()), p);
    }

    private static Map<String, SkillState> selfReportedAdvanced() {
        Map<String, SkillState> s = new HashMap<>();
        for (String k : List.of("pull-up", "chest-to-wall-handstand", "shrimp-squat", "handstand", "muscle-up")) s.put(k, SkillState.ACHIEVED_SELF_REPORTED);
        return s;
    }

    @Test
    void specExample_overallSufficientForL2_butPullBelowMinimum_finalL1() {
        InitialResult r = run(54.1, comp(65, 38, 70, 60, 65, 30), Map.of("pull-up", SkillState.NOT_ACHIEVED), Set.of(), 0.68, V2TestFixtures.params());
        assertEquals("L2", r.candidateLevel());
        assertEquals("L1", r.gatedLevel());
        assertEquals("L1", r.finalLevel());
        assertFalse(r.capApplied());
        assertTrue(r.reasons().stream().anyMatch(x -> x.code().equals("COMPETENCY_GATE_FAILED") && "PULL".equals(x.subject()) && x.actual() == 38.0 && x.required() == 40.0));
        assertEquals("PROVISIONAL", r.levelStatus());
        assertEquals("NOT_VERIFIED", r.verificationStatus());
        assertEquals("SELF_REPORTED", r.source());
    }

    @Test
    void selfReportedL3_isCappedAtL2_provisional() {
        InitialResult r = run(80.0, comp(70, 70, 60, 70, 60, 55), selfReportedAdvanced(), Set.of(), 0.62, V2TestFixtures.params());
        assertEquals("L3", r.candidateLevel());
        assertEquals("L3", r.gatedLevel());
        assertEquals("L2", r.finalLevel());
        assertTrue(r.capApplied());
        assertEquals(GateStatus.PASS_SELF_REPORTED, r.gates().get("skill"));
        assertTrue(r.reasons().stream().anyMatch(x -> x.code().equals("INITIAL_LEVEL_CAP_APPLIED")));
        assertEquals("PROVISIONAL", r.levelStatus());
    }

    @Test
    void selfReportedL4_isCappedAtL2() {
        InitialResult r = run(95.0, comp(90, 90, 90, 90, 90, 90), selfReportedAdvanced(), Set.of(), 0.7, V2TestFixtures.params());
        assertEquals("L4", r.candidateLevel());
        assertEquals("L4", r.gatedLevel());
        assertEquals("L2", r.finalLevel());
        assertTrue(r.capApplied());
    }

    @Test
    void ruleSetCannotRaiseInitialCapAboveL2() {
        InitialResult r = run(95.0, comp(90, 90, 90, 90, 90, 90), selfReportedAdvanced(), Set.of(), 0.7, V2TestFixtures.params("initial.max_level_rank", 4));
        assertEquals("L2", r.finalLevel());
        assertEquals("L2", r.levelCap());
    }

    @Test
    void capCanBeLoweredByRuleSet() {
        InitialResult r = run(95.0, comp(90, 90, 90, 90, 90, 90), selfReportedAdvanced(), Set.of(), 0.7, V2TestFixtures.params("initial.max_level_rank", 1));
        assertEquals("L1", r.finalLevel());
    }

    @Test
    void missingCompetencyIsInsufficientEvidence_notFail_andNeverAPenalty() {
        Map<String, Double> c = new HashMap<>(comp(65, 60, 0, 60, 65, 30));
        c.remove("LEGS");                                         // chưa có dữ liệu LEGS (không phải 0)
        InitialResult r = run(60.0, c, Map.of("pull-up", SkillState.ACHIEVED_SELF_REPORTED), Set.of(), 0.5, V2TestFixtures.params());
        assertEquals("L2", r.candidateLevel());
        assertEquals("L1", r.gatedLevel());                         // chưa thể xếp L2 vì thiếu bằng chứng LEGS
        assertTrue(r.reasons().stream().anyMatch(x -> x.code().equals("INSUFFICIENT_EVIDENCE") && "LEGS".equals(x.subject())));
        assertTrue(r.reasons().stream().noneMatch(x -> x.code().equals("COMPETENCY_GATE_FAILED")));
    }

    @Test
    void unknownSkillIsInsufficientEvidence_notNotAchieved() {
        InitialResult r = run(60.0, comp(65, 60, 60, 60, 65, 30), Map.of(), Set.of(), 0.5, V2TestFixtures.params());
        assertEquals("L1", r.gatedLevel());
        assertTrue(r.reasons().stream().anyMatch(x -> x.code().equals("INSUFFICIENT_EVIDENCE") && "pull-up".equals(x.subject())));
        assertTrue(r.reasons().stream().noneMatch(x -> x.code().equals("SKILL_GATE_FAILED")));
    }

    @Test
    void conflictOnRequiredCompetency_downgradesOneLevel() {
        InitialResult r = run(60.0, comp(65, 60, 60, 60, 65, 30), Map.of("pull-up", SkillState.ACHIEVED_SELF_REPORTED), Set.of("PULL"), 0.3, V2TestFixtures.params());
        assertEquals("L2", r.gatedLevel());
        assertEquals("L1", r.adjustedLevel());
        assertEquals("L1", r.finalLevel());
        assertTrue(r.reasons().stream().anyMatch(x -> x.code().equals("CONFLICT_DOWNGRADE")));
    }

    @Test
    void lowConfidenceIsNotedButNeverDowngrades() {
        InitialResult low = run(60.0, comp(65, 60, 60, 60, 65, 30), Map.of("pull-up", SkillState.ACHIEVED_SELF_REPORTED), Set.of(), 0.05, V2TestFixtures.params());
        InitialResult high = run(60.0, comp(65, 60, 60, 60, 65, 30), Map.of("pull-up", SkillState.ACHIEVED_SELF_REPORTED), Set.of(), 0.9, V2TestFixtures.params());
        assertEquals(high.finalLevel(), low.finalLevel());
        assertTrue(low.reasons().stream().anyMatch(x -> x.code().equals("LOW_CONFIDENCE_NOTED")));
    }

    @Test
    void noOverallScoreFallsBackToLowestLevelWithoutPenalty() {
        InitialResult r = run(null, Map.of(), Map.of(), Set.of(), 0, V2TestFixtures.params());
        assertEquals("L0", r.finalLevel());
        assertNull(r.overall());
    }

    @Test
    void periodicOnlyStatesAreNotEvaluatedInInitial() {
        InitialResult r = run(54.1, comp(65, 60, 60, 60, 65, 30), Map.of("pull-up", SkillState.ACHIEVED_SELF_REPORTED), Set.of(), 0.7, V2TestFixtures.params());
        assertEquals(GateStatus.NOT_EVALUATED, r.gates().get("performance"));
        assertEquals(GateStatus.NOT_EVALUATED, r.gates().get("quality"));
        assertEquals(GateStatus.NOT_EVALUATED, r.gates().get("stability"));
        assertFalse(GateStatus.NOT_EVALUATED.passes() || GateStatus.INSUFFICIENT_EVIDENCE.passes() || GateStatus.UNRELIABLE.passes() || GateStatus.FAIL.passes());
    }
}
