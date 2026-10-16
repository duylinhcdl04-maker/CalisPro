package com.calishealth.api.service.assessment;

import com.calishealth.api.entity.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Chấm điểm bài đánh giá theo cấu hình admin (không có ngưỡng viết cứng):
 *  - Câu lựa chọn: điểm của đáp án (MULTIPLE_CHOICE = trung bình các đáp án đã chọn).
 *  - Câu số (NUMERIC_INPUT / PERFORMANCE_TEST / MEASUREMENT): quy tắc khoảng giá trị của bài, nếu không có thì quy tắc
 *    mặc định của câu hỏi trong ngân hàng; quy tắc khớp đầu tiên theo thứ tự quyết định điểm.
 *  - RATING_SCALE: theo quy tắc nếu có, nếu không thì tuyến tính trên thang (mức thấp nhất = 0, cao nhất = 100).
 *  - YES_NO: theo đáp án/quy tắc nếu admin cấu hình, ngược lại không tính điểm.
 * Câu không có cách chấm (hoặc trọng số 0) chỉ để thu thập thông tin, không ảnh hưởng điểm.
 *
 *   Điểm tổng (%) = Σ(điểm câu × trọng số) / Σ(trọng số các câu được chấm)
 *   Điểm nhóm năng lực = công thức trên, chỉ tính các câu cùng category.
 *   Điểm hiển thị = Điểm tổng (%) × maxTotalScore / 100; mức trình độ = khoảng điểm chứa điểm hiển thị.
 */
@Component
public class AssessmentScoringEngine {

    public record QuestionContext(AssessmentTemplateQuestion ref, List<AssessmentQuestionOption> options,
                                  List<AssessmentScoreRule> rules, RatingRange rating) {}

    public record RatingRange(double min, double max) {}

    public record QuestionScore(Long questionId, String category, double weight, Double score) {}

    public record Result(double overallPercent, double overallScore, AssessmentTemplateLevel level,
                         Map<String, double[]> dimensions, List<QuestionScore> questionScores, int scoredCount) {}

    public Double scoreQuestion(QuestionContext ctx, Object answer) {
        if (answer == null) return null;
        String type = AssessmentQuestionTypes.inputType(ctx.ref().getQuestion());

        switch (type) {
            case "SINGLE_CHOICE", "SELF_ASSESSMENT" -> {
                if (!ctx.options().isEmpty()) return optionScore(ctx.options(), String.valueOf(answer));
                return ruleScore(ctx.rules(), answer);
            }
            case "MULTIPLE_CHOICE" -> {
                if (!(answer instanceof Collection<?> values) || values.isEmpty()) return null;
                double sum = 0; int n = 0;
                for (Object v : values) {
                    Double s = optionScore(ctx.options(), String.valueOf(v));
                    if (s != null) { sum += s; n++; }
                }
                return n == 0 ? null : sum / n;
            }
            case "YES_NO" -> {
                // Học viên trả lời true/false; admin có thể đặt giá trị đáp án là true/false, yes/no hoặc 1/0
                boolean yes = Boolean.TRUE.equals(answer) || "true".equalsIgnoreCase(String.valueOf(answer))
                        || "yes".equalsIgnoreCase(String.valueOf(answer)) || "1".equals(String.valueOf(answer));
                List<String> candidates = yes ? List.of("true", "yes", "1", "co") : List.of("false", "no", "0", "khong");
                for (String c : candidates) {
                    Double s = optionScore(ctx.options(), c);
                    if (s != null) return s;
                }
                return ruleScore(ctx.rules(), yes ? "true" : "false");
            }
            case "RATING_SCALE" -> {
                Double fromRules = ruleScore(ctx.rules(), answer);
                if (fromRules != null) return fromRules;
                Double v = toNumber(answer);
                RatingRange r = ctx.rating();
                if (v == null || r == null || r.max() <= r.min()) return null;
                return clamp((v - r.min()) / (r.max() - r.min()) * 100);
            }
            default -> { // NUMERIC_INPUT, PERFORMANCE_TEST, MEASUREMENT
                return ruleScore(ctx.rules(), answer);
            }
        }
    }

    public Result score(List<QuestionContext> questions, Map<String, Object> answers,
                        List<AssessmentTemplateLevel> levels, BigDecimal maxTotalScore) {
        List<QuestionScore> scores = new ArrayList<>();
        double weightedSum = 0, weightTotal = 0;
        Map<String, double[]> dims = new LinkedHashMap<>(); // category -> [weightedSum, weightTotal, count]

        boolean allZeroWeights = questions.stream().allMatch(q -> q.ref().getWeight() == null || q.ref().getWeight().signum() <= 0);

        for (QuestionContext ctx : questions) {
            AssessmentQuestion q = ctx.ref().getQuestion();
            double weight = allZeroWeights ? 1 : (ctx.ref().getWeight() == null ? 0 : ctx.ref().getWeight().doubleValue());
            Double s = weight > 0 ? scoreQuestion(ctx, answers.get(String.valueOf(q.getId()))) : null;
            scores.add(new QuestionScore(q.getId(), q.getCategory(), weight, s));
            if (s == null) continue;
            weightedSum += s * weight;
            weightTotal += weight;
            String cat = q.getCategory() == null ? "GENERAL" : q.getCategory();
            double[] d = dims.computeIfAbsent(cat, k -> new double[3]);
            d[0] += s * weight; d[1] += weight; d[2] += 1;
        }

        double percent = weightTotal > 0 ? weightedSum / weightTotal : 0;
        double max = maxTotalScore == null || maxTotalScore.signum() <= 0 ? 100 : maxTotalScore.doubleValue();
        double overall = round(percent * max / 100);

        Map<String, double[]> dimensionResult = new LinkedHashMap<>();
        dims.forEach((cat, d) -> dimensionResult.put(cat, new double[]{round(d[1] > 0 ? d[0] / d[1] : 0), d[2]}));

        int scored = (int) scores.stream().filter(s -> s.score() != null).count();
        return new Result(round(percent), overall, resolveLevel(levels, overall), dimensionResult, scores, scored);
    }

    /** Mức có khoảng chứa điểm; nếu điểm rơi vào khe giữa 2 mức thì lấy mức có minScore lớn nhất <= điểm. */
    public AssessmentTemplateLevel resolveLevel(List<AssessmentTemplateLevel> levels, double score) {
        List<AssessmentTemplateLevel> sorted = levels.stream()
                .sorted(Comparator.comparing(assessmentTemplateLevel -> assessmentTemplateLevel.getMinScore())).toList();
        AssessmentTemplateLevel best = null;
        for (AssessmentTemplateLevel l : sorted) {
            if (score >= l.getMinScore().doubleValue() && score <= l.getMaxScore().doubleValue()) return l;
            if (score >= l.getMinScore().doubleValue()) best = l;
        }
        return best != null ? best : (sorted.isEmpty() ? null : sorted.get(0));
    }

    // ============================== HELPERS ==============================

    private static Double optionScore(List<AssessmentQuestionOption> options, String value) {
        for (AssessmentQuestionOption o : options) {
            if (o.getOptionCode().equalsIgnoreCase(value) && o.getScore() != null) return o.getScore().doubleValue();
        }
        return null;
    }

    private static Double ruleScore(List<AssessmentScoreRule> rules, Object answer) {
        Double num = toNumber(answer);
        String text = answer == null ? null : String.valueOf(answer);
        for (AssessmentScoreRule r : rules) {
            if (matches(r, num, text)) return r.getScore().doubleValue();
        }
        return null;
    }

    static boolean matches(AssessmentScoreRule r, Double v, String text) {
        Double min = r.getMinValue() == null ? null : r.getMinValue().doubleValue();
        Double max = r.getMaxValue() == null ? null : r.getMaxValue().doubleValue();
        return switch (r.getOperator()) {
            case "EQ" -> r.getExactValue() != null
                    ? (text != null && r.getExactValue().equalsIgnoreCase(text)) || (v != null && toNumber(r.getExactValue()) != null && v.equals(toNumber(r.getExactValue())))
                    : v != null && min != null && v.equals(min);
            case "BETWEEN" -> v != null && (min == null || v >= min) && (max == null || v <= max);
            // Frontend lưu ngưỡng GT/GTE ở minValue và LT/LTE ở maxValue (có thể ngược lại) -> lấy giá trị nào có
            case "GT" -> v != null && firstNonNull(min, max) != null && v > firstNonNull(min, max);
            case "GTE" -> v != null && firstNonNull(min, max) != null && v >= firstNonNull(min, max);
            case "LT" -> v != null && firstNonNull(max, min) != null && v < firstNonNull(max, min);
            case "LTE" -> v != null && firstNonNull(max, min) != null && v <= firstNonNull(max, min);
            default -> false;
        };
    }

    static Double toNumber(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        if (o instanceof Boolean b) return b ? 1.0 : 0.0;
        try {
            return Double.parseDouble(String.valueOf(o).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Double firstNonNull(Double a, Double b) {
        return a != null ? a : b;
    }

    private static double clamp(double v) {
        return Math.max(0, Math.min(100, v));
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
