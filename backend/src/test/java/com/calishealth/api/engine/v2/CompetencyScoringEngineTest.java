package com.calishealth.api.engine.v2;

import com.calishealth.api.engine.v2.competency.CompetencyScoringEngine;
import com.calishealth.api.engine.v2.competency.CompetencyScoringEngine.*;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Nhóm G1 (kinh nghiệm không vào điểm) + G6 (trọng số cấu hình). */
class CompetencyScoringEngineTest {
    private final CompetencyScoringEngine engine = new CompetencyScoringEngine();

    private static GroupEvidence ladder(double score, double r) { return GroupEvidence.of(EvidenceRole.PERFORMANCE_LADDER, Group.LADDER, score, r); }
    private static GroupEvidence quality(double score, double r) { return GroupEvidence.of(EvidenceRole.QUALITY_MEASURED, Group.QUALITY, score, r); }

    @Test
    void experienceAndOtherContextRolesCannotBecomeScoringEvidence() {
        for (EvidenceRole role : EvidenceRole.values()) {
            if (role.contributesToScore()) continue;
            for (Group g : Group.values())
                assertThrows(IllegalArgumentException.class, () -> GroupEvidence.of(role, g, 50, 1), role + " không được vào điểm");
        }
        assertFalse(EvidenceRole.CONTEXT_EXPERIENCE.contributesToScore());
        assertFalse(EvidenceRole.SAFETY.contributesToScore());
        assertFalse(EvidenceRole.RELIABILITY_MODIFIER.contributesToScore());
    }

    @Test
    void roleMustMatchGroup() {
        assertThrows(IllegalArgumentException.class, () -> GroupEvidence.of(EvidenceRole.SELF_RATING_CHOICE, Group.LADDER, 50, 1));
    }

    @Test
    void initialLadderOnly_scoreEqualsLadderScore() {
        CompetencyScore s = engine.score("INITIAL", "PULL", List.of(ladder(54.0, 0.9)), Set.of(Group.LADDER), 1.0, V2TestFixtures.params());
        assertEquals(54.0, s.score(), 1e-9);
        assertEquals(1.0, s.coverage(), 1e-9);
        assertEquals(0.9, s.answerConfidence(), 1e-9);
    }

    @Test
    void periodicWeightsComeFromRuleSet() {
        List<GroupEvidence> ev = List.of(ladder(80, 1), quality(60, 1));
        Set<Group> shown = Set.of(Group.LADDER, Group.QUALITY);
        assertEquals(75.0, engine.score("PERIODIC", "PUSH", ev, shown, 1, V2TestFixtures.params()).score(), 1e-9);              // .75/.25
        assertEquals(70.0, engine.score("PERIODIC", "PUSH", ev, shown, 1, rule(0.5, 0.5)).score(), 1e-9);                       // đổi cấu hình
        assertEquals(80.0, engine.score("PERIODIC", "PUSH", ev, shown, 1, rule(1.0, 0.0)).score(), 1e-9);                       // QUALITY_WEIGHT = 0
    }

    private static RuleParams rule(double ladder, double quality) {
        Map<String, Double> p = V2TestFixtures.baseParams();
        p.put("group_weight.PERIODIC.LADDER_WEIGHT", ladder);
        p.put("group_weight.PERIODIC.QUALITY_WEIGHT", quality);
        return new RuleParams(p);
    }

    @Test
    void missingOrNegativeWeightIsAConfigurationError() {
        Map<String, Double> p = V2TestFixtures.baseParams();
        p.remove("group_weight.PERIODIC.QUALITY_WEIGHT");
        assertThrows(IllegalStateException.class, () -> engine.score("PERIODIC", "PUSH", List.of(ladder(80, 1), quality(60, 1)),
                Set.of(Group.LADDER, Group.QUALITY), 1, new RuleParams(p)));
        assertThrows(IllegalStateException.class, () -> engine.score("PERIODIC", "PUSH", List.of(ladder(80, 1), quality(60, 1)),
                Set.of(Group.LADDER, Group.QUALITY), 1, V2TestFixtures.params("group_weight.PERIODIC.QUALITY_WEIGHT", -1)));
    }

    @Test
    void perCompetencyOverrideBeatsTypeDefault() {
        RuleParams p = V2TestFixtures.params("group_weight.PERIODIC.PUSH.QUALITY_WEIGHT", 0.0);
        List<GroupEvidence> ev = List.of(ladder(80, 1), quality(60, 1));
        assertEquals(80.0, engine.score("PERIODIC", "PUSH", ev, Set.of(Group.LADDER, Group.QUALITY), 1, p).score(), 1e-9);
        assertEquals(75.0, engine.score("PERIODIC", "PULL", ev, Set.of(Group.LADDER, Group.QUALITY), 1, p).score(), 1e-9);
    }

    @Test
    void noEvidenceGivesNullScoreAndZeroConfidence_notZeroScore() {
        CompetencyScore s = engine.score("INITIAL", "LEGS", List.of(), Set.of(Group.LADDER), 1, V2TestFixtures.params());
        assertNull(s.score());
        assertEquals(0, s.answerConfidence());
    }

    @Test
    void missingGroupLowersCoverageAndConfidenceNotTheScore() {
        CompetencyScore s = engine.score("PERIODIC", "PUSH", List.of(ladder(80, 1)), Set.of(Group.LADDER, Group.QUALITY), 1, V2TestFixtures.params());
        assertEquals(80.0, s.score(), 1e-9);
        assertEquals(0.75, s.coverage(), 1e-9);
        assertEquals(0.75, s.answerConfidence(), 1e-9);
    }

    @Test
    void dataQualityFactorOnlyAffectsConfidence() {
        CompetencyScore good = engine.score("INITIAL", "PULL", List.of(ladder(50, 1)), Set.of(Group.LADDER), 1.0, V2TestFixtures.params());
        CompetencyScore conflicted = engine.score("INITIAL", "PULL", List.of(ladder(50, 1)), Set.of(Group.LADDER), 0.3, V2TestFixtures.params());
        assertEquals(good.score(), conflicted.score());
        assertEquals(0.3, conflicted.answerConfidence(), 1e-9);
    }

    @Test
    void overallScoreMatchesSpecExample() {
        Map<String, Double> c = Map.of("PUSH", 65.0, "PULL", 38.0, "LEGS", 70.0, "CORE", 60.0, "MOBILITY", 65.0, "SKILL", 30.0);
        Double overall = engine.overall(c, List.of("PUSH", "PULL", "LEGS", "CORE", "MOBILITY", "SKILL"), V2TestFixtures.params());
        assertEquals(54.1, overall, 1e-9);
    }

    @Test
    void overallRenormalizesOverCompetenciesThatHaveData() {
        Map<String, Double> c = new HashMap<>();
        c.put("PUSH", 60.0); c.put("PULL", 40.0); c.put("MOBILITY", null);
        Double overall = engine.overall(c, List.of("PUSH", "PULL", "MOBILITY"), V2TestFixtures.params());
        assertEquals(50.0, overall, 1e-9);                      // (0.2*60+0.2*40)/0.4
        assertNull(engine.overall(Map.of(), List.of("PUSH"), V2TestFixtures.params()));
    }

    @Test
    void itemReliabilityNeverExceedsOne_andUnansweredModifiersAreConservative() {
        RuleParams p = V2TestFixtures.params();
        assertEquals(0.9, engine.itemReliability(p, "HIGH", "EXTREMELY", "RECENT_30D"), 1e-9);
        assertEquals(0.9 * 0.7 * 0.85, engine.itemReliability(p, "HIGH", "NOT_CONFIDENT", "RECENT_1_6M"), 1e-9);
        assertEquals(0.9 * 0.7 * 0.6, engine.itemReliability(p, "HIGH", null, null), 1e-9);    // bỏ qua => hệ số thấp nhất, chỉ hạ confidence
        RuleParams over = V2TestFixtures.params("form_factor.EXTREMELY", 5.0);                 // cấu hình sai > 1 vẫn bị chặn ở 1
        assertEquals(0.9, engine.itemReliability(over, "HIGH", "EXTREMELY", "RECENT_30D"), 1e-9);
    }
}
