package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.consistency.ConsistencyChecker;
import com.calishealth.api.engine.v2.level.LevelModelsV2.LevelDef;
import com.calishealth.api.engine.v2.progression.ProgressionModels.Ladder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Ảnh chụp cấu hình một rule set V2 đã nạp từ DB (engine chỉ đọc cấu hình qua đây). */
public record RuleSetV2(long id, String code, int version, String status, RuleParams params, List<Ladder> ladders,
                        Map<String, Integer> verifyFromRank, List<LevelDef> levels,
                        List<ConsistencyChecker.RuleDef> consistencyRules, List<String> primaryCompetencies,
                        Map<String, String> textParams, Map<Integer, List<PerformanceReq>> performance, Map<Integer, List<QualityReq>> quality) {

    /** Yêu cầu hiệu năng của một level trên một bài (metric: VALID_REPS | HOLD_SEC | ANGLE_DEG; op: GTE | LTE). */
    public record PerformanceReq(String exercise, String metric, String op, double value) {}

    /** Yêu cầu chất lượng chuyển động (FORM_SCORE | VALID_RATIO | MAJOR_VIOLATIONS). */
    public record QualityReq(String metric, String op, double value) {}

    public Optional<Ladder> ladderByCode(String code) {
        return ladders.stream().filter(l -> l.code().equals(code)).findFirst();
    }

    public Optional<Ladder> ladderOfStage(String stage) {
        return ladders.stream().filter(l -> l.stages().stream().anyMatch(s -> s.code().equals(stage))).findFirst();
    }

    public List<PerformanceReq> performance(int levelRank) { return performance.getOrDefault(levelRank, List.of()); }

    public List<QualityReq> quality(int levelRank) { return quality.getOrDefault(levelRank, List.of()); }

    public LevelDef level(int rank) {
        return levels.stream().filter(l -> l.rank() == rank).findFirst().orElseThrow(() -> new IllegalStateException("Rule set thiếu level hạng " + rank));
    }
}
