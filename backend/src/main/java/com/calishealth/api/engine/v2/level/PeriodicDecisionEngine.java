package com.calishealth.api.engine.v2.level;

import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import com.calishealth.api.engine.v2.level.PeriodicModels.*;

import java.util.*;

/**
 * Quyết định level của Periodic thường kỳ SAU Baseline (ASSESSMENT_FRAMEWORK_V2 §8, §30; [LAR] §11-§12).
 *
 *  1. Reliability: không tin cậy ⇒ RETEST_REQUIRED; chưa đủ bằng chứng ⇒ INSUFFICIENT_EVIDENCE.
 *     Cả hai KHÔNG đổi level, EWMA, chuỗi suy giảm (I19: thiếu/không tin cậy không phải bằng chứng tiêu cực).
 *  2. RETURNING: giữ level (chưa có bằng chứng để hạ, và phải đo lại trước khi xét lên) - chuyển về VERIFIED.
 *  3. Lên level: Overall ≥ promote_min, tối đa +max_promotion_step; mọi cổng phải PASS (đo thật). Cổng không PASS ⇒ MAINTAINED.
 *     Chuyên cần (EXP, tùy chọn): thêm cổng "attendance" (điểm ≥ ngưỡng). Điểm cộng chuyên cần (≤ bonusMax) chỉ giúp vượt ngưỡng Overall khi MỌI cổng,
 *     kể cả chuyên cần, đã PASS; không bao giờ thay thế một cổng và không làm đổi level khi một cổng khác chưa đạt.
 *  4. KHÔNG hạ level: kết quả chưa đủ để lên chỉ giữ level (BELOW_LEVEL_STANDARD khi EWMA/năng lực dưới chuẩn của level, WITHIN_STABLE_BAND nếu không). Trước đây: tụt level khi EWMA < regress_below (hoặc năng lực bắt buộc < ngưỡng − margin) trong
 *     N lần ĐO HỢP LỆ liên tiếp; ốm/chấn thương gần đây hoặc Coach chặn ⇒ không tính. Mỗi lần tụt tối đa 1 level.
 * Không có số ngưỡng trong code: mọi giá trị lấy từ rule set.
 */
public final class PeriodicDecisionEngine {

    public PeriodicResult decide(PeriodicInput in, RuleParams params) {
        List<PeriodicLevel> levels = in.levels().stream().sorted(Comparator.comparingInt(PeriodicLevel::rank)).toList();
        PeriodicLevel current = levels.stream().filter(l -> l.rank() == in.currentRank()).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Rule set không có level rank " + in.currentRank()));

        // 1) Độ tin cậy của lần đo - không đổi state khi không kết luận được
        switch (in.reliability()) {
            case PASS -> { }
            case FAIL, UNRELIABLE -> { return unchanged(in, PeriodicOutcome.RETEST_REQUIRED, "MEASUREMENT_UNRELIABLE"); }
            default -> { return unchanged(in, PeriodicOutcome.INSUFFICIENT_EVIDENCE, "RELIABILITY_UNKNOWN"); }
        }
        if (in.overall() == null) return unchanged(in, PeriodicOutcome.INSUFFICIENT_EVIDENCE, "OVERALL_INCOMPLETE_COVERAGE");

        double overall = in.overall();
        double alpha = params.require("ewma.alpha");
        if (alpha <= 0 || alpha > 1) throw new IllegalStateException("ewma.alpha phải thuộc (0,1]: " + alpha);
        double ewma = in.previousEwma() == null ? round(overall) : round(alpha * overall + (1 - alpha) * in.previousEwma());

        // 2) Quay lại sau thời gian nghỉ: giữ level; lần đo hợp lệ này đưa user về VERIFIED
        if (in.status() == UserLevelStatus.RETURNING) {
            return new PeriodicResult(PeriodicOutcome.DECIDED, Decision.MAINTAINED, current.rank(), UserLevelStatus.VERIFIED,
                    ewma, 0, "RETURNING_REMEASURED", Map.of());
        }

        // 3) Lên level
        int step = (int) params.require("max_promotion_step");
        Attendance att = in.attendance();
        GateStatus attendanceGate = att == null ? null : att.score() >= att.minScore() ? GateStatus.PASS : att.hasEvidence() ? GateStatus.FAIL : GateStatus.INSUFFICIENT_EVIDENCE;
        double bonus = attendanceGate == GateStatus.PASS ? round(Math.max(0, att.bonusMax()) * Math.min(100, att.score()) / 100.0) : 0;
        int topByOverall = topRank(levels, current.rank(), overall);
        int rawCandidate = Math.min(topByOverall, current.rank() + step);
        int candidate = Math.min(Math.max(topByOverall, topRank(levels, current.rank(), overall + bonus)), current.rank() + step);
        if (candidate > current.rank()) {
            Map<String, GateStatus> blocked = null;
            boolean coachL4 = params.require("level.L4.requiresCoachVerified") >= 1;
            Integer pendingCoach = null;
            for (int rank = candidate; rank > current.rank(); rank--) {
                Map<String, GateStatus> gates = in.gatesByTargetRank().getOrDefault(rank,
                        new TargetGates(GateStatus.NOT_EVALUATED, GateStatus.NOT_EVALUATED, GateStatus.NOT_EVALUATED,
                                GateStatus.NOT_EVALUATED, GateStatus.NOT_EVALUATED)).asMap();
                Map<String, GateStatus> notPass = new TreeMap<>();
                gates.forEach((k, v) -> { if (v != GateStatus.PASS) notPass.put(k, v); });
                if (attendanceGate != null && attendanceGate != GateStatus.PASS) notPass.put("attendance", attendanceGate);
                boolean bonusOnly = rank > rawCandidate;      // level chỉ với tới được nhờ điểm cộng chuyên cần
                if (notPass.isEmpty()) {
                    // Đủ mọi cổng đo nhưng L4 cần Coach xác nhận: không tự lên L4, thử level thấp hơn, giữ cờ chờ
                    if (coachL4 && rank >= BaselineDecisionEngine.COACH_GATED_RANK) { pendingCoach = rank; continue; }
                    String reason = pendingCoach != null ? "L4_AWAITING_COACH_VERIFICATION" : bonusOnly ? "PROMOTED_WITH_ATTENDANCE_BONUS" : null;
                    return new PeriodicResult(PeriodicOutcome.DECIDED, Decision.PROMOTED, rank, UserLevelStatus.VERIFIED, ewma, 0, reason, Map.of(), pendingCoach);
                }
                if (bonusOnly) continue;                      // cổng chưa đạt: điểm cộng không được tính, và không báo là cổng đang chặn level này
                if (blocked == null) blocked = notPass;   // báo cổng của level cao nhất đang xét
            }
            if (pendingCoach != null) {
                return new PeriodicResult(PeriodicOutcome.DECIDED, Decision.MAINTAINED, current.rank(), UserLevelStatus.VERIFIED, ewma, 0,
                        "L4_AWAITING_COACH_VERIFICATION", Map.of(), pendingCoach);
            }
            if (blocked == null) return stayWithinBand(current, in, params, ewma);   // chỉ có level nhờ điểm cộng mà cổng chưa đạt: coi như chưa đủ điểm
            boolean anyFail = blocked.containsValue(GateStatus.FAIL);
            return new PeriodicResult(PeriodicOutcome.DECIDED, Decision.MAINTAINED, current.rank(), UserLevelStatus.VERIFIED, ewma, 0,
                    anyFail ? "PROMOTION_GATE_FAILED" : "PROMOTION_EVIDENCE_INCOMPLETE", blocked);
        }

        return stayWithinBand(current, in, params, ewma);
    }

    private static int topRank(List<PeriodicLevel> levels, int currentRank, double overall) {
        int top = currentRank;
        for (PeriodicLevel l : levels) if (overall >= l.promoteMin()) top = Math.max(top, l.rank());
        return top;
    }

    /** 4) KHÔNG hạ level. Kết quả chưa đủ để lên chỉ giữ nguyên level: người dùng tập cải thiện phần yếu rồi đo lại ở cuối chu kỳ sau.
     *     (Quy định sản phẩm: level chỉ đi lên qua đánh giá định kỳ; nghỉ dài chỉ chuyển RETURNING, không hạ.) */
    private PeriodicResult stayWithinBand(PeriodicLevel current, PeriodicInput in, RuleParams params, double ewma) {
        List<PeriodicLevel> levels = in.levels().stream().sorted(Comparator.comparingInt(PeriodicLevel::rank)).toList();
        boolean below = false;
        if (current.rank() > levels.get(0).rank()) {
            if (ewma < current.regressBelow()) below = true;
            double margin = params.require("regression.competencyMargin");
            for (CompetencyReq r : current.competencyReqs()) {
                Double s = in.competencies().get(r.competency());      // null = thiếu bằng chứng ⇒ không tính là "thấp"
                if (s != null && s < r.min() - margin) below = true;
            }
        }
        return new PeriodicResult(PeriodicOutcome.DECIDED, Decision.MAINTAINED, current.rank(), UserLevelStatus.VERIFIED, ewma, 0,
                below ? "BELOW_LEVEL_STANDARD" : "WITHIN_STABLE_BAND", Map.of());
    }

    private PeriodicResult unchanged(PeriodicInput in, PeriodicOutcome outcome, String reason) {
        return new PeriodicResult(outcome, null, in.currentRank(), in.status(), in.previousEwma(), in.consecutiveBelow(), reason, Map.of());
    }

    private static double round(double v) { return Math.round(v * 100.0) / 100.0; }
}
