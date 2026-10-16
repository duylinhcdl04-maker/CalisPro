package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.service.assessmentv2.RuleSetV2Validator.*;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class RuleSetV2ValidatorTest {
    private static Map<String, Double> goodParams() {
        Map<String, Double> p = new HashMap<>();
        p.put("initial.max_level_rank", 2.0); p.put("ewma.alpha", 0.5); p.put("regression.confirmations", 2.0); p.put("max_promotion_step", 1.0);
        p.put("fast_track.enabled", 1.0); p.put("level.L4.requiresCoachVerified", 1.0); p.put("baseline.attempts.L2", 2.0);
        p.put("overall.weight.PUSH", 0.5); p.put("overall.weight.PULL", 0.5); p.put("mobility.target.pike-fold-test", 90.0); p.put("mobility.capRatio", 1.5);
        p.put("gate.reliability.minPose", 0.6); p.put("l4.review.expiry_days", 14.0); p.put("l4.video.retention_days", 30.0);
        return p;
    }

    private static List<LevelSnap> goodLevels() {
        return List.of(
                new LevelSnap("L0", 0, 0, 0, List.of()),
                new LevelSnap("L1", 1, 25, 17, List.of(new ReqSnap("COMPETENCY", "PUSH", "SCORE", 20))),
                new LevelSnap("L2", 2, 50, 42, List.of(new ReqSnap("COMPETENCY", "PUSH", "SCORE", 45), new ReqSnap("PERFORMANCE", "PULL", "VALID_REPS", 3))));
    }

    private static List<String> check(Map<String, Double> p, List<LevelSnap> levels) {
        return RuleSetV2Validator.validate(new Snapshot(p, Map.of("baseline.attempt_aggregation", "MIN"), levels, Set.of("ewma.alpha")));
    }

    @Test
    void aWellFormedRuleSet_hasNoErrors() { assertEquals(List.of(), check(goodParams(), goodLevels())); }

    @Test
    void initialLevelCapInvariantCannotBeRaisedByACoach() {
        Map<String, Double> p = goodParams();
        p.put("initial.max_level_rank", 3.0);
        assertTrue(check(p, goodLevels()).stream().anyMatch(e -> e.contains("initial.max_level_rank") && e.contains("I18")));
    }

    @Test
    void numericParametersMustBeInTheirDomain() {
        Map<String, Double> p = goodParams();
        p.put("ewma.alpha", 0.0); p.put("regression.confirmations", 1.5); p.put("fast_track.enabled", 2.0); p.put("baseline.attempts.L2", 0.0);
        p.put("mobility.capRatio", 0.9); p.put("gate.reliability.minPose", 1.2); p.put("mobility.target.pike-fold-test", 0.0); p.put("max_promotion_step", -1.0);
        List<String> errors = check(p, goodLevels());
        for (String key : List.of("ewma.alpha", "regression.confirmations", "fast_track.enabled", "baseline.attempts.L2", "mobility.capRatio", "gate.reliability.minPose", "mobility.target.pike-fold-test", "max_promotion_step"))
            assertTrue(errors.stream().anyMatch(e -> e.contains(key)), key + " phải bị báo lỗi: " + errors);
    }

    @Test
    void missingRequiredKeyAndBadAggregationAreErrors() {
        Map<String, Double> p = goodParams();
        p.remove("ewma.alpha");
        List<String> errors = RuleSetV2Validator.validate(new Snapshot(p, Map.of("baseline.attempt_aggregation", "MAX"), goodLevels(), Set.of("ewma.alpha")));
        assertTrue(errors.stream().anyMatch(e -> e.contains("Thiếu tham số bắt buộc: ewma.alpha")));
        assertTrue(errors.stream().anyMatch(e -> e.contains("baseline.attempt_aggregation")));
    }

    @Test
    void levelThresholdsMustIncreaseStrictly_andKeepAHysteresisGap() {
        List<LevelSnap> bad = List.of(
                new LevelSnap("L0", 0, 0, 0, List.of()),
                new LevelSnap("L1", 1, 25, 25, List.of()),
                new LevelSnap("L2", 2, 25, 10, List.of()));
        List<String> errors = check(goodParams(), bad);
        assertTrue(errors.stream().anyMatch(e -> e.startsWith("L1") && e.contains("hysteresis")));
        assertTrue(errors.stream().anyMatch(e -> e.startsWith("L2") && e.contains("tăng nghiêm ngặt")));
    }

    @Test
    void competencyRequirementsMustBeCumulative() {
        List<LevelSnap> bad = List.of(
                new LevelSnap("L1", 1, 25, 17, List.of(new ReqSnap("COMPETENCY", "PUSH", "SCORE", 50))),
                new LevelSnap("L2", 2, 50, 42, List.of(new ReqSnap("COMPETENCY", "PUSH", "SCORE", 40))));
        assertTrue(check(goodParams(), bad).stream().anyMatch(e -> e.startsWith("L2") && e.contains("thấp hơn level trước")));
    }

    @Test
    void scopeOfParam_separatesWeightsFromEverythingElse() {
        assertEquals("WEIGHTS", RuleSetV2Validator.scopeOfParam("overall.weight.PUSH"));
        assertEquals("WEIGHTS", RuleSetV2Validator.scopeOfParam("group_weight.PERIODIC.LADDER_WEIGHT"));
        assertEquals("OTHER", RuleSetV2Validator.scopeOfParam("regression.confirmations"));
    }
}
