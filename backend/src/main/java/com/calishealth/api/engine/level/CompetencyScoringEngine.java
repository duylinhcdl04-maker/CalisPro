package com.calishealth.api.engine.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.CompetencyDef;
import com.calishealth.api.engine.config.RuleSetConfig.LadderNode;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Tính năng lực (thuần, không truy cập DB).
 *
 * 1) Observation của một lần đánh giá (Ladder Scoring):
 *      nodeScore_k = base_k + span_k × g(perf_k / target_k)
 *      ladder_c    = max_k nodeScore_k trên các nấc user "vào được" (MEAN cho năng lực aggregation = MEAN)
 *      obs_c       = (W_ladder × ladder_c + Σ w_i × score_i) / (W_ladder + Σ w_i)   (score_i: câu hỏi ánh xạ SCORE)
 *
 * 2) Hợp nhất nhiều lần đánh giá (reliability-weighted, time-decayed):
 *      w_j = r_j × q_j × d_j × λ_j,  d_j = 0.5^(tuổi_ngày / H),  λ_j = damp nếu là tự khai và đã có dữ liệu đo mới hơn
 *      S_c = Σ w_j S_j / Σ w_j ;  C_c = 1 − Π (1 − r_j q_j d_j)
 */
public final class CompetencyScoringEngine {

    public record NodeObservation(Long exerciseId, double value) {}

    /** Điểm 0-100 của một câu hỏi được ánh xạ SCORE vào năng lực. */
    public record ScoreObservation(String competency, double score, double weight) {}

    /** Một observation năng lực của một lần đánh giá (đã hoặc sắp lưu vào user_competency_scores). */
    public record Observation(String competency, Double score, String source, double reliability, double quality, Instant at) {}

    public record CompetencyResult(String code, Double score, Double observation, double confidence, String band,
                                   String trend, String source, String dataQuality) {}

    public record PreviousState(Double blendedScore, String band) {}

    private CompetencyScoringEngine() {}

    // ============================== Observation ==============================

    /** Điểm thang của từng năng lực từ các quan sát theo bài tập. Năng lực không có quan sát -> không có trong map. */
    public static Map<String, Double> ladderScores(RuleSetConfig rs, Collection<NodeObservation> observations) {
        Map<String, List<Double>> perCompetency = new LinkedHashMap<>();
        Set<String> observed = new HashSet<>();
        for (NodeObservation o : observations) {
            Optional<LadderNode> node = rs.ladderNode(o.exerciseId());
            if (node.isEmpty()) continue;
            LadderNode n = node.get();
            observed.add(n.competency());
            if (!n.entered(o.value())) continue;
            perCompetency.computeIfAbsent(n.competency(), k -> new ArrayList<>()).add(n.score(o.value()));
        }
        Map<String, Double> result = new LinkedHashMap<>();
        for (String c : observed) {
            List<Double> scores = perCompetency.getOrDefault(c, List.of());
            if (scores.isEmpty()) { result.put(c, 0.0); continue; }  // có quan sát nhưng chưa vào được nấc nào
            boolean mean = rs.competency(c).map(d -> "MEAN".equals(d.aggregation())).orElse(false);
            result.put(c, mean ? scores.stream().mapToDouble(value -> value.doubleValue()).average().orElse(0)
                    : scores.stream().mapToDouble(value -> value.doubleValue()).max().orElse(0));
        }
        return result;
    }

    /** Kết hợp điểm thang (trọng số W_ladder) với điểm các câu hỏi ánh xạ SCORE. */
    public static Map<String, Double> combine(RuleSetConfig rs, Map<String, Double> ladder, Collection<ScoreObservation> scores) {
        double ladderWeight = rs.param("observation.ladderWeight", 3);
        Map<String, double[]> acc = new LinkedHashMap<>();
        ladder.forEach((c, v) -> acc.computeIfAbsent(c, k -> new double[2])[0] += ladderWeight * v);
        ladder.forEach((c, v) -> acc.get(c)[1] += ladderWeight);
        for (ScoreObservation s : scores) {
            if (s.weight() <= 0) continue;
            double[] a = acc.computeIfAbsent(s.competency(), k -> new double[2]);
            a[0] += s.weight() * s.score();
            a[1] += s.weight();
        }
        Map<String, Double> result = new LinkedHashMap<>();
        acc.forEach((c, a) -> { if (a[1] > 0) result.put(c, round(clamp(a[0] / a[1]))); });
        return result;
    }

    // ============================== Hợp nhất ==============================

    public static Map<String, CompetencyResult> blend(RuleSetConfig rs, List<Observation> history,
                                                      Map<String, Observation> current,
                                                      Map<String, PreviousState> previous, Instant now) {
        double halfLife = rs.param("blend.halfLifeDays", 42);
        double damp = rs.param("blend.selfReportDamp", 0.1);
        double measuredMin = rs.param("blend.measuredMinReliability", 0.7);
        double delta = rs.param("trend.delta", 3);

        Map<String, CompetencyResult> out = new LinkedHashMap<>();
        for (CompetencyDef def : rs.competencies()) {
            String c = def.code();
            List<Observation> all = new ArrayList<>();
            for (Observation h : history) if (c.equals(h.competency()) && h.score() != null) all.add(h);
            Observation cur = current.get(c);
            if (cur != null && cur.score() != null) all.add(cur);

            Instant newestMeasured = all.stream()
                    .filter(o -> !"SELF_REPORTED".equals(o.source()) && o.reliability() >= measuredMin)
                    .map(observation -> observation.at()).max(Comparator.naturalOrder()).orElse(null);

            double num = 0, den = 0, miss = 1;
            for (Observation o : all) {
                double ageDays = Math.max(0, Duration.between(o.at(), now).toSeconds() / 86400.0);
                double d = Math.pow(0.5, ageDays / halfLife);
                double lambda = "SELF_REPORTED".equals(o.source()) && newestMeasured != null && o.at().isBefore(newestMeasured) ? damp : 1;
                double w = o.reliability() * o.quality() * d * lambda;
                num += w * o.score();
                den += w;
                miss *= (1 - Math.min(1, o.reliability() * o.quality() * d));
            }
            Double score = den > 0 ? round(clamp(num / den)) : null;
            PreviousState prev = previous.get(c);
            String trend = null;
            if (score != null && prev != null && prev.blendedScore() != null) {
                double diff = score - prev.blendedScore();
                trend = diff >= delta ? "IMPROVING" : diff <= -delta ? "DECLINING" : "STABLE";
            }
            String band = rs.band(score, prev == null ? null : prev.band());
            out.put(c, new CompetencyResult(c, score, cur == null ? null : cur.score(), round3(1 - miss), band, trend,
                    cur == null ? null : cur.source(), null));
        }
        return out;
    }

    /** Overall = Σ W_c × S_c trên các năng lực chính có dữ liệu (chuẩn hoá lại trọng số). */
    public static Double overall(RuleSetConfig rs, Map<String, CompetencyResult> competencies) {
        double num = 0, den = 0;
        for (CompetencyDef def : rs.primaryCompetencies()) {
            CompetencyResult r = competencies.get(def.code());
            double w = rs.overallWeight(def.code());
            if (r == null || r.score() == null || w <= 0) continue;
            num += w * r.score();
            den += w;
        }
        return den > 0 ? round(num / den) : null;
    }

    /** Năng lực chính yếu nhất (điểm thấp nhất) - được ưu tiên khối lượng và khi chọn giáo án. */
    public static Optional<String> weakest(RuleSetConfig rs, Map<String, CompetencyResult> competencies) {
        return rs.primaryCompetencies().stream()
                .map(d -> competencies.get(d.code()))
                .filter(r -> r != null && r.score() != null)
                .min(Comparator.comparingDouble(competencyResult -> competencyResult.score()))
                .map(competencyResult -> competencyResult.code());
    }

    static double clamp(double v) { return Math.max(0, Math.min(100, v)); }
    static double round(double v) { return Math.round(v * 100.0) / 100.0; }
    static double round3(double v) { return Math.round(v * 1000.0) / 1000.0; }
}
