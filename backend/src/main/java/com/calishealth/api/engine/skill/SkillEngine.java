package com.calishealth.api.engine.skill;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.LadderNode;
import com.calishealth.api.engine.skill.SkillGraph.Edge;

import java.util.*;

/**
 * Skill Readiness + Skill Gap (thuần).
 *  LOCKED -> READY (mọi tiên quyết bắt buộc đã đạt) -> IN_PROGRESS (đang có trong chu kỳ) -> ACHIEVED.
 *  ACHIEVED_SELF_REPORTED đủ để MỞ bài luyện tập, KHÔNG đủ cho Skill Gate khi xét lên level.
 */
public final class SkillEngine {
    private SkillEngine() {}

    public static final String LOCKED = "LOCKED", READY = "READY", IN_PROGRESS = "IN_PROGRESS",
            ACHIEVED_SELF_REPORTED = "ACHIEVED_SELF_REPORTED", ACHIEVED = "ACHIEVED";

    public record NodeProgress(Long exerciseId, String status, Double bestValue, Double bestFormScore, int qualifyingSessions) {
        public boolean achievedAny() { return ACHIEVED.equals(status) || ACHIEVED_SELF_REPORTED.equals(status); }
    }

    public record Criteria(String metric, double value, double minForm, int minSessions) {}

    public record PerformanceUpdate(String status, Double bestValue, Double bestFormScore, int qualifyingSessions, boolean qualified) {}

    public record Gap(Long exerciseId, String exerciseCode, String competency, double required, double current,
                      double deficit, double priority, String kind, String message) {}

    public record Readiness(Long targetExerciseId, String status, double percent, List<Gap> missing) {}

    // ============================== Tiêu chí làm chủ ==============================

    public static Criteria criteria(RuleSetConfig rs, SkillGraph graph, Long exerciseId) {
        double defForm = rs.param("progression.minForm", 75);
        int defSessions = (int) rs.param("progression.qualifyingSessions", 2);
        Optional<LadderNode> ladder = rs.ladderNode(exerciseId);
        String metric = ladder.map(ladderNode -> ladderNode.metric()).orElse("VALID_REPS");
        Optional<Edge> m = graph.masteryCriteria(exerciseId);
        if (m.isPresent()) {
            Edge e = m.get();
            if (e.minHoldSec() != null) metric = "HOLD_SEC";
            double v = e.minHoldSec() != null ? e.minHoldSec() : e.minReps() != null ? e.minReps() : ladder.map(ladderNode -> ladderNode.entry()).orElse(1.0);
            return new Criteria(metric, v, e.minFormScore() != null ? e.minFormScore() : defForm, Math.max(1, e.minQualifyingSessions()));
        }
        return new Criteria(metric, ladder.map(ladderNode -> ladderNode.entry()).orElse(1.0), defForm, defSessions);
    }

    /**
     * Ghi nhận một lần thực hiện bài (bài test định kỳ, buổi tập có AI, tự khai, coach xác minh).
     * Chỉ lần đo có form ≥ ngưỡng mới được tính là "buổi đạt"; đủ số buổi đạt -> ACHIEVED.
     */
    public static PerformanceUpdate recordPerformance(NodeProgress current, Criteria c, double value, Double formScore, String source) {
        String status = current == null ? LOCKED : current.status();
        Double best = current == null ? null : current.bestValue();
        Double bestForm = current == null ? null : current.bestFormScore();
        int qualifying = current == null ? 0 : current.qualifyingSessions();
        best = best == null ? value : Math.max(best, value);
        if (formScore != null) bestForm = bestForm == null ? formScore : Math.max(bestForm, formScore);

        boolean meets = value >= c.value();
        boolean qualified = false;
        if (ACHIEVED.equals(status)) return new PerformanceUpdate(status, best, bestForm, qualifying, false);
        switch (source) {
            case "COACH_VERIFIED" -> { if (meets) { status = ACHIEVED; qualified = true; } }
            case "SELF_REPORTED" -> { if (meets) status = ACHIEVED_SELF_REPORTED; }
            default -> {
                if (meets && formScore != null && formScore >= c.minForm()) {
                    qualifying++;
                    qualified = true;
                    if (qualifying >= c.minSessions()) status = ACHIEVED;
                }
            }
        }
        return new PerformanceUpdate(status, best, bestForm, qualifying, qualified);
    }

    // ============================== Trạng thái node ==============================

    /** Tính lại LOCKED/READY/IN_PROGRESS cho mọi node chưa đạt. */
    public static Map<Long, String> statuses(SkillGraph graph, Map<Long, NodeProgress> progress, Set<Long> inCurrentCycle) {
        Map<Long, String> out = new LinkedHashMap<>();
        for (SkillGraph.Node n : graph.nodes()) {
            NodeProgress p = progress.get(n.id());
            if (p != null && p.achievedAny()) { out.put(n.id(), p.status()); continue; }
            boolean unlocked = graph.prerequisites(n.id()).stream().filter(edge -> edge.mandatory()).allMatch(e -> {
                NodeProgress pre = progress.get(e.prerequisiteId());
                if (pre == null || !pre.achievedAny()) return false;
                // Cạnh có ngưỡng riêng cao hơn mức "làm chủ" (vd. push-up 25 rep mới mở pseudo-planche) -> phải đạt ngưỡng đó.
                // Nấc dễ hơn được suy ra từ tự khai (không có giá trị đo) coi như đã vượt qua.
                Integer threshold = e.minHoldSec() != null ? e.minHoldSec() : e.minReps();
                return threshold == null || pre.bestValue() == null || pre.bestValue() >= threshold;
            });
            if (!unlocked) out.put(n.id(), LOCKED);
            else out.put(n.id(), inCurrentCycle.contains(n.id()) ? IN_PROGRESS : READY);
        }
        return out;
    }

    // ============================== Readiness & Gap ==============================

    /** Readiness = Σ weight × min(1, hiện tại / yêu cầu) / Σ weight trên các tiên quyết trực tiếp của kỹ năng đích. */
    public static Readiness readiness(RuleSetConfig rs, SkillGraph graph, Long target, Map<Long, NodeProgress> progress) {
        List<Edge> pre = graph.prerequisites(target);
        NodeProgress tp = progress.get(target);
        if (tp != null && ACHIEVED.equals(tp.status())) return new Readiness(target, ACHIEVED, 100, List.of());
        if (pre.isEmpty()) return new Readiness(target, READY, 100, List.of());
        double num = 0, den = 0;
        boolean allMandatory = true;
        List<Gap> missing = new ArrayList<>();
        for (Edge e : pre) {
            NodeProgress p = progress.get(e.prerequisiteId());
            Criteria c = criteria(rs, graph, e.prerequisiteId());
            double required = e.minHoldSec() != null ? e.minHoldSec() : e.minReps() != null ? e.minReps() : c.value();
            double current = p == null || p.bestValue() == null ? 0 : p.bestValue();
            boolean achieved = p != null && p.achievedAny();
            double ratio = achieved ? 1 : Math.min(1, required <= 0 ? 0 : current / required);
            num += e.weight() * ratio;
            den += e.weight();
            if (!achieved) {
                if (e.mandatory()) allMandatory = false;
                missing.add(gap(rs, graph, e.prerequisiteId(), required, current, 1, "PREREQUISITE"));
            }
        }
        return new Readiness(target, allMandatory ? READY : "NOT_READY", Math.round(num / den * 1000) / 10.0, missing);
    }

    /**
     * Khoảng trống kỹ năng xếp theo ưu tiên:
     *  deficit = 1 − min(1, hiện tại / yêu cầu);  priority = deficit × importance × goalRelevance × (1.5 nếu thuộc năng lực yếu nhất)
     * Không có kỹ năng đích -> khoảng trống theo năng lực (100 − điểm).
     */
    public static List<Gap> gaps(RuleSetConfig rs, SkillGraph graph, Long target, Map<Long, NodeProgress> progress,
                                 Map<String, Double> competencyScores, String weakestCompetency, int limit) {
        List<Gap> out = new ArrayList<>();
        if (target != null && graph.node(target).isPresent()) {
            Deque<long[]> q = new ArrayDeque<>();
            q.add(new long[]{target, 0});
            Set<Long> seen = new HashSet<>();
            while (!q.isEmpty()) {
                long[] cur = q.poll();
                for (Edge e : graph.prerequisites(cur[0])) {
                    NodeProgress p = progress.get(e.prerequisiteId());
                    if (p != null && p.achievedAny()) continue;
                    if (!seen.add(e.prerequisiteId())) continue;
                    Criteria c = criteria(rs, graph, e.prerequisiteId());
                    double required = e.minHoldSec() != null ? e.minHoldSec() : e.minReps() != null ? e.minReps() : c.value();
                    double current = p == null || p.bestValue() == null ? 0 : p.bestValue();
                    double relevance = Math.max(0.4, 1 - 0.2 * cur[1]);
                    Gap g = gap(rs, graph, e.prerequisiteId(), required, current, relevance * e.weight(), "PREREQUISITE");
                    if (weakestCompetency != null && weakestCompetency.equals(g.competency())) {
                        g = new Gap(g.exerciseId(), g.exerciseCode(), g.competency(), g.required(), g.current(), g.deficit(),
                                round(g.priority() * 1.5), g.kind(), g.message());
                    }
                    out.add(g);
                    q.add(new long[]{e.prerequisiteId(), cur[1] + 1});
                }
            }
        }
        for (Map.Entry<String, Double> e : competencyScores.entrySet()) {
            if (e.getValue() == null) continue;
            double deficit = (100 - e.getValue()) / 100.0;
            double priority = deficit * 0.5 * (e.getKey().equals(weakestCompetency) ? 1.5 : 1);
            out.add(new Gap(null, null, e.getKey(), 100, e.getValue(), round(deficit), round(priority), "COMPETENCY",
                    "Năng lực " + e.getKey() + " = " + Math.round(e.getValue()) + "/100"));
        }
        out.sort(Comparator.comparingDouble((Gap gap) -> gap.priority()).reversed());
        return out.size() > limit ? new ArrayList<>(out.subList(0, limit)) : out;
    }

    private static Gap gap(RuleSetConfig rs, SkillGraph graph, Long exerciseId, double required, double current,
                           double importance, String kind) {
        SkillGraph.Node n = graph.node(exerciseId).orElse(null);
        String comp = rs.ladderNode(exerciseId).map(ladderNode -> ladderNode.competency()).orElse(n == null ? null : n.competency());
        double deficit = 1 - Math.min(1, required <= 0 ? 0 : current / required);
        String code = n == null ? String.valueOf(exerciseId) : n.code();
        return new Gap(exerciseId, code, comp, required, current, round(deficit), round(deficit * importance), kind,
                (n == null ? code : n.name()) + ": hiện tại " + Math.round(current) + " / cần " + Math.round(required));
    }

    private static double round(double v) { return Math.round(v * 1000.0) / 1000.0; }
}
