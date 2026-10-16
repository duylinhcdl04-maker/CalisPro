package com.calishealth.api.engine.v2.level;

import com.calishealth.api.engine.v2.level.LevelModelsV2.CompetencyReq;
import com.calishealth.api.engine.v2.level.LevelModelsV2.Decision;
import com.calishealth.api.engine.v2.level.LevelModelsV2.GateStatus;

import java.util.List;
import java.util.Map;

/** Kiểu dữ liệu của Periodic thường kỳ (ASSESSMENT_FRAMEWORK_V2 §8, §30; [LAR] §11-§12). */
public final class PeriodicModels {
    private PeriodicModels() {}

    /** PROVISIONAL/UNASSESSED không có ở đây: level chưa xác minh phải đi qua Baseline (BaselineDecisionEngine). */
    public enum UserLevelStatus { VERIFIED, RETURNING }

    /** regressBelow = ngưỡng EWMA để xét tụt khỏi level (hysteresis: thấp hơn promoteMin của chính level đó). */
    public record PeriodicLevel(int rank, String code, double promoteMin, double regressBelow, List<CompetencyReq> competencyReqs) {}

    /** Năm cổng đánh giá việc LÊN level đích (Reliability được xét riêng, một lần cho cả lần đo). Chỉ PASS mới cho lên. */
    public record TargetGates(GateStatus performance, GateStatus quality, GateStatus competency, GateStatus skill, GateStatus stability) {
        Map<String, GateStatus> asMap() {
            return Map.of("performance", performance, "quality", quality, "competency", competency, "skill", skill, "stability", stability);
        }
    }

    /**
     * overall = null khi độ phủ bằng chứng chưa đủ (I19). competencies chỉ chứa năng lực có bằng chứng ĐỦ + TIN CẬY;
     * năng lực thiếu dữ liệu KHÔNG có mặt trong map (không được điền 0).
     * previousEwma: lần đầu sau Baseline = Overall của Baseline (F6). consecutiveBelow: số lần liên tiếp đã bị xếp "dưới ngưỡng".
     */
    public record PeriodicInput(int currentRank, UserLevelStatus status, Double overall, GateStatus reliability,
                                Map<String, Double> competencies, Double previousEwma, int consecutiveBelow,
                                boolean recentIllness, boolean coachBlocksRegression,
                                List<PeriodicLevel> levels, Map<Integer, TargetGates> gatesByTargetRank, Attendance attendance) {
        /** Không có dữ liệu chuyên cần: tính năng EXP tắt, không có cổng chuyên cần và không có điểm cộng. */
        public PeriodicInput(int currentRank, UserLevelStatus status, Double overall, GateStatus reliability,
                             Map<String, Double> competencies, Double previousEwma, int consecutiveBelow,
                             boolean recentIllness, boolean coachBlocksRegression,
                             List<PeriodicLevel> levels, Map<Integer, TargetGates> gatesByTargetRank) {
            this(currentRank, status, overall, reliability, competencies, previousEwma, consecutiveBelow, recentIllness, coachBlocksRegression, levels, gatesByTargetRank, null);
        }
    }

    /**
     * Chuyên cần của chu kỳ vừa qua (tính từ EXP). score thuộc [0, 100]; hasEvidence=false khi chưa có hoạt động nào trong cửa sổ xét
     * (thiếu bằng chứng, không phải bằng chứng tiêu cực, I19). Điểm cộng tối đa bonusMax và CHỈ dùng khi mọi cổng đã đạt; chuyên cần không thay được cổng nào.
     */
    public record Attendance(double score, boolean hasEvidence, double minScore, double bonusMax) {}

    /** DECIDED = có kết luận (PROMOTED/MAINTAINED/REGRESSED). RETEST_REQUIRED / INSUFFICIENT_EVIDENCE = không đổi bất cứ state nào. */
    public enum PeriodicOutcome { DECIDED, RETEST_REQUIRED, INSUFFICIENT_EVIDENCE }

    /**
     * Khi outcome ≠ DECIDED: decision = null, finalRank = currentRank, ewma = previousEwma, consecutiveBelow giữ nguyên.
     * blockedGates: cổng chặn việc lên level (chỉ có khi MAINTAINED vì cổng); reasonCode luôn có.
     */
    public record PeriodicResult(PeriodicOutcome outcome, Decision decision, int finalRank, UserLevelStatus statusAfter,
                                 Double ewma, int consecutiveBelow, String reasonCode, Map<String, GateStatus> blockedGates,
                                 Integer pendingCoachRank) {
        public PeriodicResult(PeriodicOutcome outcome, Decision decision, int finalRank, UserLevelStatus statusAfter,
                              Double ewma, int consecutiveBelow, String reasonCode, Map<String, GateStatus> blockedGates) {
            this(outcome, decision, finalRank, statusAfter, ewma, consecutiveBelow, reasonCode, blockedGates, null);
        }
    }
}
