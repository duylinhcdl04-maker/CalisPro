package com.calishealth.api.engine.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.LevelDef;
import com.calishealth.api.engine.config.RuleSetConfig.RequirementDef;
import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;
import com.calishealth.api.engine.level.LevelModels.*;

import java.util.*;

import static com.calishealth.api.engine.level.LevelModels.*;

/**
 * Level Evaluation Engine (tất định, giải thích được, không truy cập DB).
 *
 *  - Reliability Gate chạy đầu tiên: FAIL -> RETEST_REQUIRED, không lên/không tụt.
 *  - candidate = level cao nhất có Overall ≥ promote_min (tối đa current + 1, trừ fast-track).
 *  - Lên level khi Performance, Quality, Competency, Skill, Stability đều PASS.
 *  - Tụt level khi EWMA < regress_below (hoặc năng lực bắt buộc < ngưỡng − margin) ở N lần đánh giá liên tiếp.
 *  - Level đang PROVISIONAL (chỉ có dữ liệu tự khai): lần đo đầu tiên HIỆU CHỈNH thẳng về level cao nhất đạt
 *    4 cổng Performance/Quality/Competency/Skill (không cần Stability vì level tạm thời không phải bằng chứng).
 */
public final class LevelEvaluationEngine {
    private LevelEvaluationEngine() {}

    // ============================== LEVEL TẠM THỜI (questionnaire) ==============================

    public record ProvisionalResult(String candidateLevel, String finalLevel, List<Reason> reasons, GateResult competencyGate) {}

    public static ProvisionalResult provisional(RuleSetConfig rs, Map<String, CompetencyResult> competencies, Double overall,
                                                Set<String> conflictedCompetencies, boolean screeningFlag) {
        List<Reason> reasons = new ArrayList<>();
        double score = overall == null ? 0 : overall;
        LevelDef candidate = rs.levelByRank(0);
        GateResult candidateGate = null;
        for (LevelDef l : rs.levelsAsc()) {
            if (score < l.promoteMin()) break;
            GateResult g = LevelGates.competency(competencies, l, true);
            if (!g.pass()) {
                reasons.add(new Reason(G_COMPETENCY, "PROVISIONAL_BLOCKED", null, null, l.promoteMin(), score, false,
                        "Chưa xếp " + l.name() + ": " + failedSummary(g)));
                break;
            }
            candidate = l;
            candidateGate = g;
        }
        reasons.add(new Reason(G_DECISION, "PROVISIONAL_CANDIDATE", null, null, candidate.promoteMin(), score, true,
                "Điểm tổng tự khai " + LevelGates.fmt(score) + " → mức ứng viên " + candidate.name() + "."));

        int rank = candidate.rank();
        int maxRank = (int) rs.param("provisional.maxRank", 2);
        if (rank > maxRank) {
            rank = maxRank;
            reasons.add(new Reason(G_DECISION, "PROVISIONAL_CAP", null, null, (double) maxRank, (double) candidate.rank(), false,
                    "Dữ liệu tự khai báo chỉ xếp tối đa " + rs.levelByRank(maxRank).name() + "; cần bài đánh giá thực hành để xác nhận cao hơn."));
        }
        LevelDef capped = rs.levelByRank(rank);
        boolean conflictOnMandatory = capped.requirements(G_COMPETENCY).stream()
                .anyMatch(r -> r.mandatory() && conflictedCompetencies.contains(r.competency()));
        if (conflictOnMandatory && rank > 0) {
            rank--;
            reasons.add(new Reason(G_DECISION, "CONFLICT_DOWNGRADE", null, null, null, null, false,
                    "Câu trả lời mâu thuẫn ở năng lực bắt buộc " + conflictedCompetencies + " → xếp thấp hơn 1 mức để an toàn."));
        }
        int screeningMax = (int) rs.param("provisional.screeningMaxRank", 1);
        if (screeningFlag && rank > screeningMax) {
            rank = screeningMax;
            reasons.add(new Reason(G_DECISION, "SCREENING_CAP", null, null, null, null, false,
                    "Có dấu hiệu cần lưu ý trong phần sàng lọc an toàn → giới hạn ở " + rs.levelByRank(screeningMax).name() + "."));
        }
        return new ProvisionalResult(candidate.code(), rs.levelByRank(rank).code(), reasons, candidateGate);
    }

    // ============================== ĐÁNH GIÁ ĐỊNH KỲ ==============================

    public static Outcome evaluate(LevelContext ctx, RuleSetConfig rs) {
        LevelDef current = rs.level(ctx.currentLevel());
        Map<String, GateResult> gates = new LinkedHashMap<>();
        List<Reason> reasons = new ArrayList<>();

        GateResult reliability = LevelGates.reliability(ctx, rs);
        gates.put(G_RELIABILITY, reliability);
        if (!reliability.pass()) {
            reasons.addAll(reliability.reasons().stream().filter(r -> !r.passed()).toList());
            reasons.add(new Reason(G_DECISION, RETEST_REQUIRED, null, null, null, null, false,
                    "Dữ liệu đo chưa đủ tin cậy nên không thay đổi level. Vui lòng làm lại bài test theo hướng dẫn camera."));
            return new Outcome(current.code(), null, current.code(), ctx.overall(), ctx.previousEwma(), gates, RETEST_REQUIRED,
                    reasons, ctx.consecutiveBelow(), ctx.status(), false, false);
        }

        double overall = ctx.overall() == null ? 0 : ctx.overall();
        double alpha = rs.param("ewma.alpha", 0.5);
        double ewma = ctx.previousEwma() == null ? overall : round(alpha * overall + (1 - alpha) * ctx.previousEwma());
        LevelDef uncapped = highestByOverall(rs, overall);

        // ---------- Hiệu chỉnh level tạm thời bằng dữ liệu đo ----------
        if ("PROVISIONAL".equals(ctx.status())) {
            LevelDef chosen = rs.levelByRank(0);
            Map<String, GateResult> chosenGates = null, topGates = null;
            for (int rank = uncapped.rank(); rank >= 1; rank--) {
                LevelDef l = rs.levelByRank(rank);
                Map<String, GateResult> g = coreGates(ctx, l, rs);
                if (topGates == null) topGates = g;
                if (g.values().stream().allMatch(gateResult -> gateResult.pass())) { chosen = l; chosenGates = g; break; }
            }
            Map<String, GateResult> shown = chosenGates != null ? chosenGates : topGates;
            if (shown != null) gates.putAll(shown);
            gates.put(G_STABILITY, new GateResult(G_STABILITY, NA, List.of(new Reason(G_STABILITY, "CALIBRATION", null, null, null, null, true,
                    "Lần đo đầu tiên thay thế level tạm thời nên không xét cổng ổn định."))));
            gates.values().forEach(g -> reasons.addAll(g.reasons()));
            String decision = chosen.rank() > current.rank() ? PROMOTED : chosen.rank() < current.rank() ? REGRESSED : MAINTAINED;
            reasons.add(new Reason(G_DECISION, "CALIBRATION", null, null, null, overall, true,
                    "Level tạm thời " + current.name() + " được hiệu chỉnh bằng kết quả đo thành " + chosen.name() + "."));
            return new Outcome(current.code(), uncapped.code(), chosen.code(), overall, ewma, gates, decision, reasons, 0,
                    "VERIFIED", true, false);
        }

        // ---------- Xét lên level ----------
        boolean fastTrack = fastTrackEligible(ctx, rs, uncapped, overall);
        LevelDef candidate = fastTrack ? uncapped : rs.levelByRank(Math.min(uncapped.rank(), current.rank() + 1));
        if (candidate.rank() > current.rank()) {
            Map<String, GateResult> topGates = null;
            for (int rank = candidate.rank(); rank > current.rank(); rank--) {
                LevelDef l = rs.levelByRank(rank);
                Map<String, GateResult> g = coreGates(ctx, l, rs);
                g.put(G_STABILITY, LevelGates.stability(ctx, l, rs, fastTrack));
                if (topGates == null) topGates = g;
                if (g.values().stream().allMatch(gateResult -> gateResult.pass())) {
                    gates.putAll(g);
                    g.values().forEach(x -> reasons.addAll(x.reasons()));
                    reasons.add(new Reason(G_DECISION, PROMOTED, null, null, l.promoteMin(), overall, true,
                            "Đạt đủ các cổng của " + l.name() + " → lên level."));
                    return new Outcome(current.code(), candidate.code(), l.code(), overall, ewma, gates, PROMOTED, reasons, 0,
                            "VERIFIED", false, fastTrack);
                }
            }
            Map<String, GateResult> shownGates = topGates != null ? topGates : Map.of();  // vòng lặp luôn chạy ≥ 1 lần
            gates.putAll(shownGates);
            shownGates.values().forEach(x -> reasons.addAll(x.reasons()));
            List<String> failed = shownGates.entrySet().stream().filter(e -> !e.getValue().pass()).map(entry -> entry.getKey()).toList();
            reasons.add(new Reason(G_DECISION, MAINTAINED, null, null, candidate.promoteMin(), overall, false,
                    "Điểm tổng đủ cho " + candidate.name() + " nhưng chưa qua cổng: " + String.join(", ", failed) + " → giữ " + current.name() + "."));
            return new Outcome(current.code(), candidate.code(), current.code(), overall, ewma, gates, MAINTAINED, reasons, 0,
                    "VERIFIED", false, fastTrack);
        }

        // ---------- Xét tụt level (theo xu hướng) ----------
        if ("RETURNING".equals(ctx.status())) {
            reasons.add(new Reason(G_DECISION, "RETURNING", null, null, null, null, true,
                    "Bạn vừa quay lại sau thời gian nghỉ: giữ level, giảm khối lượng tập để thích nghi lại."));
            return new Outcome(current.code(), candidate.code(), current.code(), overall, ewma, gates, MAINTAINED, reasons, 0,
                    "VERIFIED", false, false);
        }
        List<Reason> belowReasons = new ArrayList<>();
        boolean below = false;
        if (current.rank() > 0 && ewma < current.regressBelow()) {
            below = true;
            belowReasons.add(new Reason(G_DECISION, "EWMA_BELOW", null, null, current.regressBelow(), ewma, false,
                    "Điểm trung bình trượt " + LevelGates.fmt(ewma) + " < ngưỡng xét tụt " + LevelGates.fmt(current.regressBelow()) + "."));
        }
        double margin = rs.param("regression.competencyMargin", 10);
        for (RequirementDef r : current.requirements(G_COMPETENCY)) {
            CompetencyResult c = ctx.competencies().get(r.competency());
            if (current.rank() > 0 && r.mandatory() && c != null && c.score() != null && c.score() < r.value() - margin) {
                below = true;
                belowReasons.add(new Reason(G_COMPETENCY, "COMPETENCY_FAR_BELOW", r.competency(), null, r.value() - margin, c.score(), false,
                        r.competency() + " = " + LevelGates.fmt(c.score()) + " thấp hơn nhiều so với yêu cầu của " + current.name() + "."));
            }
        }
        reasons.addAll(belowReasons);
        if (below && ctx.recentIllness()) {
            reasons.add(new Reason(G_DECISION, "ILLNESS_FLAG", null, null, null, null, true,
                    "Check-in gần đây cho thấy sức khoẻ/thể trạng chưa tốt → không tính lần này vào xu hướng giảm."));
            return new Outcome(current.code(), candidate.code(), current.code(), overall, ewma, gates, MAINTAINED, reasons,
                    ctx.consecutiveBelow(), "VERIFIED", false, false);
        }
        int consecutive = below ? ctx.consecutiveBelow() + 1 : 0;
        int confirmations = (int) rs.param("regression.confirmations", 2);
        if (below && consecutive >= confirmations) {
            LevelDef lower = rs.levelByRank(current.rank() - 1);
            reasons.add(new Reason(G_DECISION, REGRESSED, null, null, (double) confirmations, (double) consecutive, false,
                    "Suy giảm được xác nhận qua " + consecutive + " lần đánh giá liên tiếp → " + current.name() + " → " + lower.name() + "."));
            return new Outcome(current.code(), candidate.code(), lower.code(), overall, ewma, gates, REGRESSED, reasons, 0,
                    "VERIFIED", false, false);
        }
        reasons.add(new Reason(G_DECISION, MAINTAINED, null, null, null, overall, true, below
                ? "Kết quả thấp hơn ngưỡng (" + consecutive + "/" + confirmations + " lần) - theo dõi thêm, chưa tụt level."
                : "Kết quả nằm trong vùng ổn định của " + current.name() + " → giữ level."));
        return new Outcome(current.code(), candidate.code(), current.code(), overall, ewma, gates, MAINTAINED, reasons, consecutive,
                "VERIFIED", false, false);
    }

    // ============================== HELPERS ==============================

    private static Map<String, GateResult> coreGates(LevelContext ctx, LevelDef l, RuleSetConfig rs) {
        Map<String, GateResult> g = new LinkedHashMap<>();
        g.put(G_PERFORMANCE, LevelGates.performance(ctx, l));
        g.put(G_QUALITY, LevelGates.quality(ctx, l));
        g.put(G_COMPETENCY, LevelGates.competency(ctx, l, false));
        g.put(G_SKILL, LevelGates.skill(ctx, l, rs));
        return g;
    }

    static LevelDef highestByOverall(RuleSetConfig rs, double overall) {
        LevelDef best = rs.levelByRank(0);
        for (LevelDef l : rs.levelsAsc()) if (overall >= l.promoteMin()) best = l;
        return best;
    }

    /** Fast-track: vượt xa ngưỡng + mọi bài đo có độ tin cậy cao + (Baseline Test hoặc coach xác minh). */
    static boolean fastTrackEligible(LevelContext ctx, RuleSetConfig rs, LevelDef uncapped, double overall) {
        if (!(ctx.baseline() || ctx.coachVerified())) return false;
        if (overall < uncapped.promoteMin() + rs.param("fastTrack.margin", 10)) return false;
        double minRel = rs.param("fastTrack.minReliability", 0.85);
        return ctx.tests().stream().filter(testOutcome -> testOutcome.valid()).allMatch(t -> t.reliability() >= minRel);
    }

    private static String failedSummary(GateResult g) {
        return String.join("; ", g.reasons().stream().filter(r -> !r.passed()).map(reason -> reason.message()).toList());
    }

    private static double round(double v) { return Math.round(v * 100.0) / 100.0; }
}
