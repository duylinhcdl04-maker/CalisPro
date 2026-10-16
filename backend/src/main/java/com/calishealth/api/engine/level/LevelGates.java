package com.calishealth.api.engine.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.LevelDef;
import com.calishealth.api.engine.config.RuleSetConfig.RequirementDef;
import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;
import com.calishealth.api.engine.level.LevelModels.*;

import java.time.Duration;
import java.util.*;

import static com.calishealth.api.engine.level.LevelModels.*;

/**
 * Các cổng xét level. Mỗi cổng độc lập, trả về PASS/FAIL kèm toàn bộ lý do (cả điều kiện đạt lẫn không đạt)
 * để trả lời được "năng lực / bài nào đã chặn việc lên level".
 */
public final class LevelGates {
    private LevelGates() {}

    // ============================== RELIABILITY ==============================

    /** Dữ liệu đo không đủ tin cậy thì không được dùng để lên hoặc tụt level (RETEST_REQUIRED). */
    public static GateResult reliability(LevelContext ctx, RuleSetConfig rs) {
        List<Reason> reasons = new ArrayList<>();
        if (ctx.tests() == null || ctx.tests().isEmpty()) {
            reasons.add(new Reason(G_RELIABILITY, "NO_TEST_DATA", null, null, null, null, false, "Chưa có kết quả bài test nào."));
            return new GateResult(G_RELIABILITY, FAIL, reasons);
        }
        double minPose = rs.param("gate.reliability.minPose", 0.6);
        double minVisibility = rs.param("gate.reliability.minVisibility", 0.5);
        double minTracked = rs.param("gate.reliability.minTracked", 0.8);
        boolean ok = true;
        for (TestOutcome t : ctx.tests()) {
            if (!t.mandatory()) continue;
            if (!t.valid()) {
                ok = false;
                reasons.add(new Reason(G_RELIABILITY, "TEST_NOT_VALID", t.competency(), t.exerciseCode(), null, null, false,
                        "Bài " + t.exerciseCode() + " cần làm lại (kết quả không hợp lệ)."));
                continue;
            }
            if (!"AI_MEASURED".equals(t.source())) continue; // tự khai / coach xác minh không có chỉ số camera
            ok &= check(reasons, t, "POSE_CONFIDENCE", t.poseConfidence(), minPose, "độ tin cậy tư thế (pose confidence)");
            double visReq = t.visibilityRequired() != null ? t.visibilityRequired() : minVisibility;
            ok &= check(reasons, t, "LANDMARK_VISIBILITY", t.visibility(), visReq, "độ hiển thị điểm mốc cơ thể");
            ok &= check(reasons, t, "TRACKED_RATIO", t.trackedRatio(), minTracked, "tỉ lệ khung hình theo dõi được");
        }
        return new GateResult(G_RELIABILITY, ok ? PASS : FAIL, reasons);
    }

    private static boolean check(List<Reason> reasons, TestOutcome t, String code, Double actual, double min, String label) {
        boolean pass = actual != null && actual >= min;
        reasons.add(new Reason(G_RELIABILITY, code, t.competency(), t.exerciseCode(), min, actual, pass,
                (pass ? "Đạt " : "Không đạt ") + label + " ở bài " + t.exerciseCode() + " (" + fmt(actual) + " / tối thiểu " + fmt(min) + ")."));
        return pass;
    }

    // ============================== PERFORMANCE ==============================

    /** Thành tích khách quan (chỉ rep HỢP LỆ / giây giữ) phải đạt mọi yêu cầu bắt buộc của level đích. */
    public static GateResult performance(LevelContext ctx, LevelDef target) {
        List<RequirementDef> reqs = target.requirements(G_PERFORMANCE);
        if (reqs.isEmpty()) return new GateResult(G_PERFORMANCE, PASS, List.of());
        List<Reason> reasons = new ArrayList<>();
        boolean ok = true;
        for (RequirementDef r : reqs) {
            Double actual = bestValue(ctx, r.exerciseId());
            boolean pass;
            String msg;
            if (actual != null) {
                pass = r.satisfied(actual);
                msg = r.exerciseCode() + ": " + fmt(actual) + " " + unit(r.metric()) + " hợp lệ (yêu cầu ≥ " + fmt(r.value()) + ").";
            } else {
                Optional<TestOutcome> harder = harderPerformed(ctx, r.exerciseId());
                pass = harder.isPresent();
                msg = harder.map(h -> r.exerciseCode() + ": đạt nhờ làm được bài khó hơn " + h.exerciseCode() + ".")
                        .orElse(r.exerciseCode() + ": chưa có kết quả test hợp lệ.");
            }
            if (r.mandatory()) ok &= pass;
            reasons.add(new Reason(G_PERFORMANCE, "BENCHMARK", r.competency(), r.exerciseCode(), r.value(), actual, pass, msg));
        }
        return new GateResult(G_PERFORMANCE, ok ? PASS : FAIL, reasons);
    }

    // ============================== QUALITY ==============================

    /** Chất lượng chuyển động trên các bài phục vụ yêu cầu performance: form, ROM, tỉ lệ rep hợp lệ, lỗi nghiêm trọng. */
    public static GateResult quality(LevelContext ctx, LevelDef target) {
        List<RequirementDef> reqs = target.requirements(G_QUALITY);
        if (reqs.isEmpty()) return new GateResult(G_QUALITY, PASS, List.of());
        Set<Long> relevantIds = new HashSet<>();
        for (RequirementDef p : target.requirements(G_PERFORMANCE)) {
            if (p.exerciseId() == null) continue;
            relevantIds.add(p.exerciseId());
            relevantIds.addAll(ctx.harderEquivalents().getOrDefault(p.exerciseId(), Set.of()));
        }
        List<TestOutcome> relevant = ctx.tests().stream().filter(testOutcome -> testOutcome.valid())
                .filter(t -> relevantIds.isEmpty() || relevantIds.contains(t.exerciseId())).toList();
        if (relevant.isEmpty()) relevant = ctx.tests().stream().filter(testOutcome -> testOutcome.valid()).toList();

        List<Reason> reasons = new ArrayList<>();
        boolean ok = true;
        int checks = 0;
        for (RequirementDef r : reqs) {
            for (TestOutcome t : relevant) {
                Double actual = switch (r.metric()) {
                    case "FORM_SCORE" -> t.formScore();
                    case "VALID_RATIO" -> t.validRatio();
                    case "ROM" -> t.romScore();
                    case "MAJOR_VIOLATIONS" -> t.majorViolations() == null ? null : t.majorViolations().doubleValue();
                    default -> null;
                };
                if (actual == null) continue;  // bài giữ tĩnh không có tỉ lệ rep, v.v.
                checks++;
                boolean pass = r.satisfied(actual);
                if (r.mandatory()) ok &= pass;
                reasons.add(new Reason(G_QUALITY, r.metric(), t.competency(), t.exerciseCode(), r.value(), actual, pass,
                        t.exerciseCode() + " – " + qualityLabel(r.metric()) + ": " + fmt(actual) + " (yêu cầu "
                                + ("LTE".equals(r.operator()) ? "≤ " : "≥ ") + fmt(r.value()) + ")."));
            }
        }
        if (checks == 0) {
            reasons.add(new Reason(G_QUALITY, "NO_QUALITY_DATA", null, null, null, null, false, "Chưa có dữ liệu chất lượng chuyển động."));
            return new GateResult(G_QUALITY, FAIL, reasons);
        }
        return new GateResult(G_QUALITY, ok ? PASS : FAIL, reasons);
    }

    // ============================== COMPETENCY ==============================

    public static GateResult competency(LevelContext ctx, LevelDef target, boolean ignoreConfidence) {
        return competency(ctx.competencies(), target, ignoreConfidence);
    }

    /** Mọi năng lực bắt buộc phải đạt ngưỡng (null = chưa có bằng chứng = FAIL) và đủ độ tự tin. */
    public static GateResult competency(Map<String, CompetencyResult> competencies, LevelDef target, boolean ignoreConfidence) {
        List<Reason> reasons = new ArrayList<>();
        boolean ok = true;
        for (RequirementDef r : target.requirements(G_COMPETENCY)) {
            CompetencyResult c = competencies.get(r.competency());
            Double score = c == null ? null : c.score();
            boolean pass = score != null && r.satisfied(score);
            String msg = r.competency() + " = " + fmt(score) + " (yêu cầu ≥ " + fmt(r.value()) + ")";
            if (pass && c != null && !ignoreConfidence && c.confidence() < target.minConfidence()) {
                pass = false;
                msg += " nhưng độ tự tin " + fmt(c.confidence()) + " < " + fmt(target.minConfidence());
            }
            if (r.mandatory()) ok &= pass;
            reasons.add(new Reason(G_COMPETENCY, "COMPETENCY_MIN", r.competency(), null, r.value(), score, pass, msg + "."));
        }
        return new GateResult(G_COMPETENCY, ok ? PASS : FAIL, reasons);
    }

    // ============================== SKILL ==============================

    /** Kỹ năng tiên quyết phải ACHIEVED (đo/coach xác minh) - tự khai báo không đủ để lên level. */
    public static GateResult skill(LevelContext ctx, LevelDef target, RuleSetConfig rs) {
        List<RequirementDef> reqs = target.requirements(G_SKILL);
        List<Reason> reasons = new ArrayList<>();
        boolean ok = true;
        if (rs.param("level." + target.code() + ".requiresCoachVerified", 0) >= 1) {
            ok = ctx.coachVerified();
            reasons.add(new Reason(G_SKILL, "COACH_VERIFICATION", null, null, null, null, ok,
                    target.name() + (ok ? ": đã có coach xác minh." : " yêu cầu coach xác minh kết quả trước khi lên level.")));
        }
        if (reqs.isEmpty()) return new GateResult(G_SKILL, ok ? PASS : FAIL, reasons);
        for (RequirementDef r : reqs) {
            boolean pass = "ACHIEVED".equals(ctx.nodeStatus().get(r.exerciseId()))
                    || ctx.harderEquivalents().getOrDefault(r.exerciseId(), Set.of()).stream()
                    .anyMatch(id -> "ACHIEVED".equals(ctx.nodeStatus().get(id)));
            if (r.mandatory()) ok &= pass;
            reasons.add(new Reason(G_SKILL, "NODE_ACHIEVED", r.competency(), r.exerciseCode(), null, null, pass,
                    r.exerciseCode() + (pass ? " đã đạt." : " chưa đạt (cần đo hoặc coach xác minh).")));
        }
        return new GateResult(G_SKILL, ok ? PASS : FAIL, reasons);
    }

    // ============================== STABILITY ==============================

    /**
     * Chiến lược kết hợp (Hybrid): PASS nếu
     *  (1) lần đánh giá trước (trong N tuần) cũng có candidate ≥ level đích và đạt Competency Gate; hoặc
     *  (2) bài "nút cổ chai" (tỉ lệ thành tích/yêu cầu thấp nhất) đạt chỉ tiêu ở ≥ M/K buổi tập gần nhất với form đủ.
     */
    public static GateResult stability(LevelContext ctx, LevelDef target, RuleSetConfig rs, boolean fastTrack) {
        List<Reason> reasons = new ArrayList<>();
        if (fastTrack) {
            reasons.add(new Reason(G_STABILITY, "FAST_TRACK", null, null, null, null, true,
                    "Bỏ qua cổng ổn định: điểm vượt xa ngưỡng và kết quả đo có độ tin cậy cao (fast-track)."));
            return new GateResult(G_STABILITY, PASS, reasons);
        }
        PreviousEvaluation prev = ctx.previous();
        double windowWeeks = rs.param("stability.prevWindowWeeks", 10);
        if (prev != null && prev.candidateLevel() != null
                && rs.level(prev.candidateLevel()).rank() >= target.rank()
                && PASS.equals(prev.competencyGate())
                && Duration.between(prev.at(), ctx.now()).toDays() <= windowWeeks * 7) {
            reasons.add(new Reason(G_STABILITY, "CONSECUTIVE_ASSESSMENT", null, null, null, null, true,
                    "Lần đánh giá trước cũng đạt mức " + target.name() + " về điểm và năng lực."));
            return new GateResult(G_STABILITY, PASS, reasons);
        }
        reasons.add(new Reason(G_STABILITY, "CONSECUTIVE_ASSESSMENT", null, null, null, null, false,
                "Lần đánh giá trước chưa đạt mức " + target.name() + "."));

        List<RequirementDef> perf = target.requirements(G_PERFORMANCE).stream().filter(requirementDef -> requirementDef.mandatory()).toList();
        if (perf.isEmpty()) {
            reasons.add(new Reason(G_STABILITY, "NO_BENCHMARK", null, null, null, null, true, "Level không có bài chuẩn cần xác nhận."));
            return new GateResult(G_STABILITY, PASS, reasons);
        }
        // Bài nút cổ chai: tỉ lệ thành tích / yêu cầu nhỏ nhất (hoà thì xét tất cả)
        double minRatio = Double.MAX_VALUE;
        Map<RequirementDef, Double> ratios = new LinkedHashMap<>();
        for (RequirementDef r : perf) {
            Double v = bestValue(ctx, r.exerciseId());
            double ratio = v == null || r.value() <= 0 ? 0 : v / r.value();
            ratios.put(r, ratio);
            minRatio = Math.min(minRatio, ratio);
        }
        double minForm = target.requirements(G_QUALITY).stream().filter(q -> "FORM_SCORE".equals(q.metric()))
                .mapToDouble(requirementDef -> requirementDef.value()).max().orElse(rs.param("progression.minForm", 75));
        int window = (int) rs.param("stability.logWindowDays", 21);
        int lastN = (int) rs.param("stability.logLastN", 4);
        int minPass = (int) rs.param("stability.logMinPass", 3);

        boolean ok = true;
        for (Map.Entry<RequirementDef, Double> e : ratios.entrySet()) {
            if (Math.abs(e.getValue() - minRatio) > 1e-9) continue;
            RequirementDef r = e.getKey();
            Set<Long> ids = new HashSet<>(ctx.harderEquivalents().getOrDefault(r.exerciseId(), Set.of()));
            ids.add(r.exerciseId());
            List<TrainingObservation> recent = ctx.training().stream()
                    .filter(o -> ids.contains(o.exerciseId()))
                    .filter(o -> Duration.between(o.at(), ctx.now()).toDays() <= window)
                    .sorted(Comparator.comparing((TrainingObservation trainingObservation) -> trainingObservation.at()).reversed())
                    .limit(lastN).toList();
            long qualifying = recent.stream().filter(o -> (o.exerciseId().equals(r.exerciseId()) ? o.bestValue() >= r.value() : o.bestValue() >= 1)
                    && o.formScore() != null && o.formScore() >= minForm).count();
            boolean pass = qualifying >= minPass;
            ok &= pass;
            reasons.add(new Reason(G_STABILITY, "TRAINING_LOG_WINDOW", r.competency(), r.exerciseCode(), (double) minPass, (double) qualifying, pass,
                    qualifying + "/" + recent.size() + " buổi tập gần nhất (" + window + " ngày) " + r.exerciseCode() + " ≥ "
                            + fmt(r.value()) + " " + unit(r.metric()) + " với form ≥ " + fmt(minForm) + " (cần ≥ " + minPass + "/" + lastN + ")."));
        }
        return new GateResult(G_STABILITY, ok ? PASS : FAIL, reasons);
    }

    // ============================== HELPERS ==============================

    static Double bestValue(LevelContext ctx, Long exerciseId) {
        if (exerciseId == null) return null;
        return ctx.tests().stream().filter(testOutcome -> testOutcome.valid()).filter(t -> exerciseId.equals(t.exerciseId()))
                .map(testOutcome -> testOutcome.value()).filter(Objects::nonNull).max((left, right) -> Double.compare(left, right)).orElse(null);
    }

    private static Optional<TestOutcome> harderPerformed(LevelContext ctx, Long exerciseId) {
        Set<Long> harder = ctx.harderEquivalents().getOrDefault(exerciseId, Set.of());
        return ctx.tests().stream().filter(testOutcome -> testOutcome.valid())
                .filter(t -> harder.contains(t.exerciseId()) && t.value() != null && t.value() >= 1).findFirst();
    }

    static String unit(String metric) {
        return switch (metric == null ? "" : metric) {
            case "HOLD_SEC" -> "giây";
            case "ANGLE_DEG" -> "độ";
            default -> "rep";
        };
    }

    private static String qualityLabel(String metric) {
        return switch (metric) {
            case "FORM_SCORE" -> "điểm form";
            case "VALID_RATIO" -> "tỉ lệ rep hợp lệ";
            case "ROM" -> "biên độ (ROM)";
            case "MAJOR_VIOLATIONS" -> "lỗi nghiêm trọng";
            default -> metric;
        };
    }

    static String fmt(Double v) {
        if (v == null) return "–";
        return v == Math.rint(v) ? String.valueOf(v.longValue()) : String.format(Locale.ROOT, "%.2f", v);
    }

    static String fmt(double v) { return fmt(Double.valueOf(v)); }
}
