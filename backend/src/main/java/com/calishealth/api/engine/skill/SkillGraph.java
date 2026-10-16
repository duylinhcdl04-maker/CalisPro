package com.calishealth.api.engine.skill;

import java.util.*;

/**
 * Đồ thị tiến trình kỹ năng dựng từ exercise_progressions.
 *  NEXT        : prerequisite -> exercise (phải làm chủ prerequisite mới mở exercise)
 *  ALTERNATIVE : exercise có thể thay bằng prerequisite (vd. khi thiếu dụng cụ)
 * REGRESSION được suy ra ngược từ NEXT nên không cần cạnh riêng.
 */
public final class SkillGraph {

    /** Tiêu chí làm chủ nấc tiên quyết để mở nấc tiếp theo. */
    public record Edge(Long prerequisiteId, Long exerciseId, Integer minReps, Integer minHoldSec, Double minFormScore,
                       int minQualifyingSessions, boolean mandatory, double weight) {}

    public record Node(Long id, String code, String name, String competency, boolean equipmentRequired) {}

    private final Map<Long, Node> nodes = new LinkedHashMap<>();
    private final Map<Long, List<Edge>> incoming = new HashMap<>();   // exercise -> các cạnh tiên quyết
    private final Map<Long, List<Edge>> outgoing = new HashMap<>();   // prerequisite -> các cạnh mở bài kế
    private final Map<Long, Set<Long>> alternatives = new HashMap<>();
    private final Map<Long, Integer> depth = new HashMap<>();

    public SkillGraph(Collection<Node> nodes, Collection<Edge> nextEdges, Map<Long, Set<Long>> alternatives) {
        nodes.forEach(n -> this.nodes.put(n.id(), n));
        for (Edge e : nextEdges) {
            incoming.computeIfAbsent(e.exerciseId(), k -> new ArrayList<>()).add(e);
            outgoing.computeIfAbsent(e.prerequisiteId(), k -> new ArrayList<>()).add(e);
        }
        alternatives.forEach((k, v) -> {
            this.alternatives.computeIfAbsent(k, x -> new LinkedHashSet<>()).addAll(v);
            v.forEach(a -> this.alternatives.computeIfAbsent(a, x -> new LinkedHashSet<>()).add(k));
        });
        for (Long id : this.nodes.keySet()) depthOf(id, new HashSet<>());
    }

    public Optional<Node> node(Long id) { return Optional.ofNullable(nodes.get(id)); }
    public Collection<Node> nodes() { return nodes.values(); }
    public List<Edge> prerequisites(Long exerciseId) { return incoming.getOrDefault(exerciseId, List.of()); }
    public List<Edge> unlocks(Long exerciseId) { return outgoing.getOrDefault(exerciseId, List.of()); }
    public Set<Long> alternatives(Long exerciseId) { return alternatives.getOrDefault(exerciseId, Set.of()); }
    public int depth(Long exerciseId) { return depth.getOrDefault(exerciseId, 0); }

    /** Mọi bài khó hơn (đi theo cạnh NEXT, bắc cầu). */
    public Set<Long> harder(Long exerciseId) {
        Set<Long> out = new LinkedHashSet<>();
        Deque<Long> q = new ArrayDeque<>(List.of(exerciseId));
        while (!q.isEmpty()) {
            for (Edge e : unlocks(q.poll())) if (out.add(e.exerciseId())) q.add(e.exerciseId());
        }
        out.remove(exerciseId);
        return out;
    }

    public Map<Long, Set<Long>> harderEquivalents() {
        Map<Long, Set<Long>> m = new HashMap<>();
        for (Long id : nodes.keySet()) m.put(id, harder(id));
        return m;
    }

    /** Các bài dễ hơn theo khoảng cách (1 = tiên quyết trực tiếp). */
    public LinkedHashMap<Long, Integer> easier(Long exerciseId, int maxSteps) {
        LinkedHashMap<Long, Integer> out = new LinkedHashMap<>();
        Deque<long[]> q = new ArrayDeque<>();
        q.add(new long[]{exerciseId, 0});
        while (!q.isEmpty()) {
            long[] cur = q.poll();
            if (cur[1] >= maxSteps) continue;
            for (Edge e : prerequisites(cur[0])) {
                if (!out.containsKey(e.prerequisiteId()) && !e.prerequisiteId().equals(exerciseId)) {
                    out.put(e.prerequisiteId(), (int) cur[1] + 1);
                    q.add(new long[]{e.prerequisiteId(), cur[1] + 1});
                }
            }
        }
        return out;
    }

    /**
     * Tiêu chí làm chủ một nấc = tiêu chí thấp nhất trong các cạnh BẮT BUỘC nó mở ra
     * ("đủ để mở ít nhất một nấc tiếp theo"); nấc lá -> empty (dùng ngưỡng vào của thang).
     */
    public Optional<Edge> masteryCriteria(Long exerciseId) {
        List<Edge> out = unlocks(exerciseId).stream().filter(edge -> edge.mandatory()).toList();
        if (out.isEmpty()) out = unlocks(exerciseId);
        if (out.isEmpty()) return Optional.empty();
        Integer reps = out.stream().map(edge -> edge.minReps()).filter(Objects::nonNull).min((left, right) -> Integer.compare(left, right)).orElse(null);
        Integer hold = out.stream().map(edge -> edge.minHoldSec()).filter(Objects::nonNull).min((left, right) -> Integer.compare(left, right)).orElse(null);
        Double form = out.stream().map(edge -> edge.minFormScore()).filter(Objects::nonNull).max((left, right) -> Double.compare(left, right)).orElse(null);
        int sessions = out.stream().mapToInt(edge -> edge.minQualifyingSessions()).max().orElse(2);
        return Optional.of(new Edge(exerciseId, null, reps, hold, form, sessions, true, 1));
    }

    private int depthOf(Long id, Set<Long> visiting) {
        if (depth.containsKey(id)) return depth.get(id);
        if (!visiting.add(id)) return 0;  // phòng chu trình do cấu hình sai
        int d = 0;
        for (Edge e : prerequisites(id)) d = Math.max(d, depthOf(e.prerequisiteId(), visiting) + 1);
        visiting.remove(id);
        depth.put(id, d);
        return d;
    }
}
