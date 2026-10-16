package com.calishealth.api.engine.v2.level;

import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;

import java.util.*;

/**
 * Quyết định level của Baseline thực hành ĐẦU TIÊN (ASSESSMENT_FRAMEWORK_V2 §8.1.3-§8.1.6).
 *
 * Staircase từ L1 lên L4; dừng ở level đầu tiên KHÔNG đạt trên dữ liệu ĐỦ + TIN CẬY.
 *  - attempt không tin cậy / user dừng  → RETEST_REQUIRED (không nâng, không hạ, không đổi state, không tiêu thụ fast-track)
 *  - thiếu attempt/bài/cổng chưa đủ bằng chứng → INCOMPLETE (I19: dừng sớm KHÔNG phải bằng chứng "không đạt")
 *  - level đích đòi N attempt độc lập (sàn bất biến L0-L1: 1; L2-L4: 2) và MỌI attempt phải thoả; một attempt không thoả
 *    trên dữ liệu tin cậy => Stability không PASS (không trung bình hai attempt).
 * Fast-track: chỉ gỡ giới hạn ±max_promotion_step; không bỏ cổng nào (I10).
 */
public final class BaselineDecisionEngine {

    /** Level duy nhất camera không tự xác minh được (tham số level.L4.requiresCoachVerified). */
    public static final int COACH_GATED_RANK = 4;

    public static int attemptsFloor(int levelRank) { return levelRank <= 1 ? 1 : 2; }

    public int attemptsRequired(int levelRank, RuleParams p) {
        return Math.max(attemptsFloor(levelRank), (int) p.require("baseline.attempts.L" + levelRank));
    }

    public BaselineResult decide(BaselineInput in, RuleParams params) { return walk(in, params, false); }

    /**
     * Kết thúc SỚM (người dùng không có dụng cụ cho bài kế tiếp, hoặc muốn dừng): chốt level cao nhất mà MỌI attempt của level đó và mọi cổng đều PASS trên dữ liệu đủ + tin cậy.
     * Thiếu/không tin cậy ở level kế tiếp chỉ là thiếu bằng chứng (I19): không hạ, chỉ không nâng thêm. Nếu level đủ bằng chứng THẤP HƠN level tạm thì KHÔNG chốt (INCOMPLETE,
     * PARTIAL_EVIDENCE_BELOW_PROVISIONAL): thiếu dữ liệu không được dùng để hạ. Kết quả là VERIFIED với reasonCode PARTIAL_EVIDENCE
     * (cận dưới của level thật). Chưa có level nào đủ bằng chứng ⇒ INCOMPLETE (NO_EVIDENCE_FOR_EARLY_FINISH). Một attempt hợp lệ mà không đạt vẫn là kết luận thật như thường.
     */
    public BaselineResult decideEarly(BaselineInput in, RuleParams params) { return walk(in, params, true); }

    private BaselineResult walk(BaselineInput in, RuleParams params, boolean early) {
        if (!in.firstBaseline()) throw new IllegalArgumentException("BaselineDecisionEngine chỉ dùng cho Baseline thực hành đầu tiên");
        boolean fastTrack = params.require("fast_track.enabled") >= 1;
        int step = (int) params.require("max_promotion_step");
        boolean coachL4 = params.require("level.L4.requiresCoachVerified") >= 1;
        Map<Integer, GateStatus> stability = new LinkedHashMap<>();
        int verified = 0;

        for (LevelEvidence ev : in.levels().stream().sorted(Comparator.comparingInt(LevelEvidence::rank)).toList()) {
            int required = attemptsRequired(ev.rank(), params);

            // 1) attempt: không tin cậy => RETEST; thiếu => INCOMPLETE; có attempt hợp lệ không thoả => dừng (FAIL thật)
            for (int i = 0; i < required; i++) {
                Attempt a = i < ev.attempts().size() ? ev.attempts().get(i) : new Attempt(AttemptStatus.NOT_DONE, false);
                switch (a.status()) {
                    case INVALID_MEASUREMENT -> { return early ? stopEarly(verified, in, fastTrack, step, coachL4, stability) : retest("INVALID_MEASUREMENT", stability); }
                    case USER_ABORTED -> { return early ? stopEarly(verified, in, fastTrack, step, coachL4, stability) : retest("USER_ABORTED", stability); }
                    case NOT_DONE -> { return early ? stopEarly(verified, in, fastTrack, step, coachL4, stability) : incomplete("ATTEMPT_MISSING_L" + ev.rank(), stability); }
                    // Một attempt hợp lệ, tin cậy mà không thoả ⇒ Stability không thể PASS: kết luận ngay, không bắt user làm thêm attempt vô ích
                    case VALID -> { if (!a.meetsLevelRequirements()) { stability.put(ev.rank(), GateStatus.FAIL); return finalize(verified, in, fastTrack, step, coachL4, stability); } }
                }
            }
            stability.put(ev.rank(), GateStatus.PASS);

            // 2) cổng tổng hợp
            if (ev.reliability() != GateStatus.PASS) {
                if (early) return stopEarly(verified, in, fastTrack, step, coachL4, stability);
                return ev.reliability() == GateStatus.INSUFFICIENT_EVIDENCE || ev.reliability() == GateStatus.NOT_EVALUATED
                        ? incomplete("RELIABILITY_UNKNOWN_L" + ev.rank(), stability) : retest("RELIABILITY_GATE", stability);
            }
            for (GateStatus g : List.of(ev.overall(), ev.competency(), ev.skill())) {
                if (g == GateStatus.UNRELIABLE) return early ? stopEarly(verified, in, fastTrack, step, coachL4, stability) : retest("UNRELIABLE_EVIDENCE_L" + ev.rank(), stability);
                if (g == GateStatus.INSUFFICIENT_EVIDENCE || g == GateStatus.NOT_EVALUATED || g == GateStatus.PASS_SELF_REPORTED)
                    return early ? stopEarly(verified, in, fastTrack, step, coachL4, stability) : incomplete("INSUFFICIENT_EVIDENCE_L" + ev.rank(), stability);
            }
            if (ev.overall() == GateStatus.FAIL || ev.competency() == GateStatus.FAIL || ev.skill() == GateStatus.FAIL)
                return finalize(verified, in, fastTrack, step, coachL4, stability);

            verified = ev.rank();
        }
        if (verified < 4) return early ? stopEarly(verified, in, fastTrack, step, coachL4, stability) : incomplete("NEXT_LEVEL_NOT_TESTED", stability);   // đã đạt hết bằng chứng hiện có nhưng chưa thử level kế
        return finalize(verified, in, fastTrack, step, coachL4, stability);
    }

    /** Dừng sớm: chốt level đã đủ bằng chứng; chưa có level nào thì chưa kết thúc được. */
    private BaselineResult stopEarly(int verified, BaselineInput in, boolean fastTrack, int step, boolean coachL4, Map<Integer, GateStatus> stability) {
        if (verified < 1) return incomplete("NO_EVIDENCE_FOR_EARLY_FINISH", stability);
        // Chưa đủ bằng chứng để khẳng định MỨC THẤP HƠN level tạm: dữ liệu thiếu không được dùng để hạ level (I19) - giữ nguyên level tạm
        if (verified < in.provisionalRank()) return incomplete("PARTIAL_EVIDENCE_BELOW_PROVISIONAL", stability);
        BaselineResult r = finalize(verified, in, fastTrack, step, coachL4, stability);
        return new BaselineResult(BaselineOutcome.VERIFIED, r.decision(), r.finalRank(), true, "PARTIAL_EVIDENCE", stability, r.pendingCoachRank());
    }

    private BaselineResult finalize(int verified, BaselineInput in, boolean fastTrack, int step, boolean coachL4, Map<Integer, GateStatus> stability) {
        // Camera đo đủ mọi cổng L4 nhưng L4 cần Coach xác nhận: kết luận L3, giữ cờ chờ (không phải bằng chứng tiêu cực)
        Integer pending = null;
        if (coachL4 && verified >= COACH_GATED_RANK) { verified = COACH_GATED_RANK - 1; pending = COACH_GATED_RANK; }
        int fin = verified;
        if (!fastTrack) fin = Math.max(in.provisionalRank() - step, Math.min(in.provisionalRank() + step, verified));
        Decision d = fin > in.provisionalRank() ? Decision.PROMOTED : fin == in.provisionalRank() ? Decision.MAINTAINED : Decision.REGRESSED;
        String reason = d == Decision.REGRESSED ? "BASELINE_RECALIBRATION" : pending != null ? "L4_AWAITING_COACH_VERIFICATION" : null;
        return new BaselineResult(BaselineOutcome.VERIFIED, d, fin, true, reason, stability, fin < COACH_GATED_RANK ? pending : null);
    }

    private BaselineResult retest(String reason, Map<Integer, GateStatus> stability) {
        return new BaselineResult(BaselineOutcome.RETEST_REQUIRED, null, null, false, reason, stability);
    }

    private BaselineResult incomplete(String reason, Map<Integer, GateStatus> stability) {
        return new BaselineResult(BaselineOutcome.INCOMPLETE, null, null, false, reason, stability);
    }
}
