package com.calishealth.api.engine.v2;

import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import com.calishealth.api.engine.v2.progression.ProgressionModels.*;

import java.util.*;

/** Dữ liệu dùng chung cho test V2: tham số = giá trị seed của migration_assessment_v2_02_seed.sql (khởi điểm, không phải chuẩn). */
public final class V2TestFixtures {
    private V2TestFixtures() {}

    public static Map<String, Double> baseParams() {
        Map<String, Double> p = new HashMap<>();
        p.put("group_weight.INITIAL.LADDER_WEIGHT", 1.0);
        p.put("group_weight.INITIAL.CHOICE_WEIGHT", 1.0);
        p.put("group_weight.PERIODIC.LADDER_WEIGHT", 0.75);
        p.put("group_weight.PERIODIC.QUALITY_WEIGHT", 0.25);
        p.put("reliability_class.HIGH", 0.9); p.put("reliability_class.MEDIUM", 0.7); p.put("reliability_class.LOW", 0.4);
        p.put("form_factor.NOT_CONFIDENT", 0.7); p.put("form_factor.SLIGHT", 0.8); p.put("form_factor.MODERATE", 0.9);
        p.put("form_factor.VERY", 1.0); p.put("form_factor.EXTREMELY", 1.0);
        p.put("recency.RECENT_30D", 1.0); p.put("recency.RECENT_1_6M", 0.85); p.put("recency.ESTIMATE", 0.6);
        p.put("overall.weight.PUSH", 0.20); p.put("overall.weight.PULL", 0.20); p.put("overall.weight.LEGS", 0.15);
        p.put("overall.weight.CORE", 0.20); p.put("overall.weight.MOBILITY", 0.10); p.put("overall.weight.SKILL", 0.15);
        p.put("initial.max_level_rank", 2.0); p.put("initial.low_confidence_threshold", 0.40); p.put("initial.conflict_downgrade_levels", 1.0);
        p.put("baseline.attempts.L0", 1.0); p.put("baseline.attempts.L1", 1.0); p.put("baseline.attempts.L2", 2.0);
        p.put("baseline.attempts.L3", 2.0); p.put("baseline.attempts.L4", 2.0);
        p.put("fast_track.enabled", 1.0); p.put("max_promotion_step", 1.0);
        p.put("level.L4.requiresCoachVerified", 1.0);
        p.put("ewma.alpha", 0.5); p.put("regression.confirmations", 2.0); p.put("regression.competencyMargin", 10.0);
        return p;
    }

    public static RuleParams params() { return new RuleParams(baseParams()); }

    public static RuleParams params(String key, double value) {
        Map<String, Double> p = baseParams();
        p.put(key, value);
        return new RuleParams(p);
    }

    /** Thang PUSH minh hoạ của spec §5.4 (pass 5/3/3, band 20-50-65-75). */
    public static Ladder pushLadder(boolean dipsBypassPushUp) {
        List<Stage> stages = List.of(
                new Stage("incline-push-up", 1, "VALID_REPS", 1, 20, 0, 20),
                new Stage("push-up", 2, "VALID_REPS", 5, 30, 20, 30),
                new Stage("dips", 3, "VALID_REPS", 3, 15, 50, 15),
                new Stage("pike-push-up", 4, "VALID_REPS", 3, 15, 65, 10));
        List<Prerequisite> pre = List.of(
                new Prerequisite("push-up", "incline-push-up", true, false),
                new Prerequisite("dips", "push-up", true, dipsBypassPushUp),
                new Prerequisite("pike-push-up", "push-up", true, false));
        return new Ladder("PUSH_LADDER", "PUSH", stages, pre);
    }

    public static List<LevelDef> levels() {
        List<SkillReq> none = List.of();
        return List.of(
                new LevelDef("L0", 0, 0, List.of(), none),
                new LevelDef("L1", 1, 25, List.of(new CompetencyReq("PUSH", 20), new CompetencyReq("PULL", 15), new CompetencyReq("CORE", 20)), none),
                new LevelDef("L2", 2, 50, List.of(new CompetencyReq("PUSH", 45), new CompetencyReq("PULL", 40), new CompetencyReq("CORE", 45), new CompetencyReq("LEGS", 40)),
                        List.of(new SkillReq("pull-up", true))),
                new LevelDef("L3", 3, 72, List.of(new CompetencyReq("PUSH", 65), new CompetencyReq("PULL", 65), new CompetencyReq("CORE", 65), new CompetencyReq("LEGS", 55), new CompetencyReq("SKILL", 50)),
                        List.of(new SkillReq("chest-to-wall-handstand", true), new SkillReq("shrimp-squat", true))),
                new LevelDef("L4", 4, 88, List.of(new CompetencyReq("PUSH", 80), new CompetencyReq("PULL", 80), new CompetencyReq("CORE", 80), new CompetencyReq("LEGS", 80),
                        new CompetencyReq("SKILL", 75), new CompetencyReq("MOBILITY", 60)),
                        List.of(new SkillReq("handstand", true), new SkillReq("muscle-up", true))));
    }
}
