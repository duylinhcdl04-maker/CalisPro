package com.calishealth.api.engine.v2.level;

import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;

import java.util.*;

/**
 * Level Engine V2 - chế độ INITIAL (ASSESSMENT_FRAMEWORK_V2 §6.3). Chuỗi bốn bước:
 *   candidate (theo điểm tổng) → gated (sau cổng) → adjusted (sau CONFLICT) → final = min(adjusted, trần L2).
 * KHÔNG có tham số an toàn (I3). Không có số ngưỡng trong code ngoài bất biến I18 (Initial ≤ L2).
 */
public final class FitnessLevelEngine {

    /** Bất biến I1/I18: level Initial (tự khai báo) không bao giờ vượt L2, dù rule set cấu hình thế nào. */
    public static final int INITIAL_HARD_CAP_RANK = 2;

    public InitialResult evaluateInitial(InitialInput in, RuleParams params) {
        List<LevelDef> levels = in.levels().stream().sorted(Comparator.comparingInt(LevelDef::rank)).toList();
        LevelDef lowest = levels.get(0);

        // 1. candidate theo điểm tổng
        LevelDef candidate = lowest;
        if (in.overall() != null) {
            for (LevelDef l : levels) if (in.overall() >= l.promoteMin()) candidate = l;
        }

        // 2. gated: level cao nhất ≤ candidate mà mọi cổng đánh giá được đều đạt (cổng thiếu bằng chứng KHÔNG phải FAIL nhưng chặn level đó)
        List<Reason> reasons = new ArrayList<>();
        LevelDef gated = lowest;
        Map<String, GateStatus> gatedGates = gateMap(lowest, in);
        for (int i = levels.indexOf(candidate); i >= 0; i--) {
            LevelDef l = levels.get(i);
            Map<String, GateStatus> gates = gateMap(l, in);
            if (gates.get("competency").passes() && gates.get("skill").passes()) { gated = l; gatedGates = gates; break; }
            reasons.addAll(gateReasons(l, in));
        }

        // 3. adjusted: CONFLICT ở năng lực bắt buộc của level đã gated => hạ level (dữ liệu mâu thuẫn, KHÔNG phải thiếu bằng chứng)
        LevelDef adjusted = gated;
        boolean conflicted = gated.competencyReqs().stream().anyMatch(r -> in.conflictedCompetencies().contains(r.competency()));
        if (conflicted && gated.rank() > lowest.rank()) {
            int down = (int) params.require("initial.conflict_downgrade_levels");
            int rank = Math.max(lowest.rank(), gated.rank() - down);
            adjusted = levels.stream().filter(l -> l.rank() <= rank).max(Comparator.comparingInt(LevelDef::rank)).orElse(lowest);
            reasons.add(new Reason("CONFLICT_DOWNGRADE", "COMPETENCY", null, null, null, "Dữ liệu tự khai báo mâu thuẫn ở năng lực bắt buộc của level."));
        }
        // Độ chắc chắn thấp (thiếu/ước chừng) chỉ được GHI NHẬN, không hạ level: thiếu bằng chứng không phải bằng chứng tiêu cực (I19).
        if (in.answerConfidence() < params.require("initial.low_confidence_threshold")) {
            reasons.add(new Reason("LOW_CONFIDENCE_NOTED", "RELIABILITY", null, null, in.answerConfidence(), "Độ chắc chắn thấp - cần xác minh bằng bài thực hành."));
        }

        // 4. trần Initial
        int capRank = Math.min(INITIAL_HARD_CAP_RANK, (int) params.require("initial.max_level_rank"));
        LevelDef cap = levels.stream().filter(l -> l.rank() <= capRank).max(Comparator.comparingInt(LevelDef::rank)).orElse(lowest);
        LevelDef fin = adjusted.rank() > cap.rank() ? cap : adjusted;
        boolean capApplied = adjusted.rank() > cap.rank();
        if (capApplied) {
            reasons.add(new Reason("INITIAL_LEVEL_CAP_APPLIED", "LEVEL", cap.code(), null, null, "Initial self-reported assessment cannot verify L3/L4."));
        }
        if (fin.rank() > INITIAL_HARD_CAP_RANK) throw new IllegalStateException("Bất biến I1 bị vi phạm: Initial vượt L" + INITIAL_HARD_CAP_RANK);

        return new InitialResult(candidate.code(), gated.code(), adjusted.code(), fin.code(), cap.code(), capApplied,
                "PROVISIONAL", "NOT_VERIFIED", "SELF_REPORTED", in.overall(), in.answerConfidence(), gatedGates, reasons);
    }

    private Map<String, GateStatus> gateMap(LevelDef l, InitialInput in) {
        Map<String, GateStatus> m = new LinkedHashMap<>();
        m.put("overall", GateStatus.PASS);
        m.put("competency", competencyGate(l, in));
        m.put("skill", skillGate(l, in));
        m.put("reliability", GateStatus.PASS);
        m.put("performance", GateStatus.NOT_EVALUATED);
        m.put("quality", GateStatus.NOT_EVALUATED);
        m.put("stability", GateStatus.NOT_EVALUATED);
        return m;
    }

    private GateStatus competencyGate(LevelDef l, InitialInput in) {
        boolean insufficient = false;
        for (CompetencyReq r : l.competencyReqs()) {
            Double s = in.competencies().get(r.competency());
            if (s == null) insufficient = true;                    // null = chưa có dữ liệu: KHÔNG phải FAIL
            else if (s < r.min()) return GateStatus.FAIL;
        }
        return insufficient ? GateStatus.INSUFFICIENT_EVIDENCE : GateStatus.PASS;
    }

    private GateStatus skillGate(LevelDef l, InitialInput in) {
        GateStatus result = GateStatus.PASS;
        for (SkillReq r : l.skillReqs()) {
            SkillState st = in.skills().getOrDefault(r.stage(), SkillState.UNKNOWN);
            switch (st) {
                case ACHIEVED -> { }
                case ACHIEVED_SELF_REPORTED -> {
                    if (!r.selfReportedAcceptable()) return GateStatus.INSUFFICIENT_EVIDENCE;
                    result = GateStatus.PASS_SELF_REPORTED;
                }
                case NOT_ACHIEVED -> { return GateStatus.FAIL; }
                case UNKNOWN -> { return GateStatus.INSUFFICIENT_EVIDENCE; }
            }
        }
        return result;
    }

    private List<Reason> gateReasons(LevelDef l, InitialInput in) {
        List<Reason> out = new ArrayList<>();
        for (CompetencyReq r : l.competencyReqs()) {
            Double s = in.competencies().get(r.competency());
            if (s == null) out.add(new Reason("INSUFFICIENT_EVIDENCE", "COMPETENCY", r.competency(), r.min(), null, "Chưa đủ dữ liệu cho " + r.competency() + " để xếp " + l.code() + "."));
            else if (s < r.min()) out.add(new Reason("COMPETENCY_GATE_FAILED", "COMPETENCY", r.competency(), r.min(), s, l.code() + ": " + r.competency() + " " + s + " < " + r.min()));
        }
        for (SkillReq r : l.skillReqs()) {
            SkillState st = in.skills().getOrDefault(r.stage(), SkillState.UNKNOWN);
            if (st == SkillState.NOT_ACHIEVED) out.add(new Reason("SKILL_GATE_FAILED", "SKILL", r.stage(), null, null, l.code() + ": chưa đạt " + r.stage()));
            else if (st == SkillState.UNKNOWN || (st == SkillState.ACHIEVED_SELF_REPORTED && !r.selfReportedAcceptable()))
                out.add(new Reason("INSUFFICIENT_EVIDENCE", "SKILL", r.stage(), null, null, "Chưa đủ bằng chứng cho " + r.stage()));
        }
        return out;
    }
}
