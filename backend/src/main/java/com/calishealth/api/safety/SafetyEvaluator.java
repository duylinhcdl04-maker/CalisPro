package com.calishealth.api.safety;

import com.calishealth.api.safety.SafetyModels.*;

import java.util.*;

/**
 * Tính Safety Status + ràng buộc từ đáp án sàng lọc (hàm thuần). Safety KHÔNG tạo điểm và KHÔNG đổi level (I3):
 * kết quả chỉ gồm status, cờ đang hoạt động và ràng buộc.
 *
 *   status = RESTRICTED nếu có cờ RESTRICT; REVIEW_REQUIRED nếu có cờ khác; CLEARED nếu không có cờ.
 * Cờ sticky không biến mất khi sàng lọc lại không tái hiện; chỉ clearance mới gỡ (xem ClearanceEvaluator).
 * Status không thể hạ nếu policy của status hiện tại yêu cầu clearance để rời đi.
 */
public final class SafetyEvaluator {

    public Evaluation evaluate(List<SafetyRule> rules, List<FlagDef> flagDefs, Map<String, Set<String>> flagConstraints,
                               Map<String, Set<String>> answers, PreviousSafety previous, Map<Status, Policy> policies) {
        Map<String, FlagDef> defs = SafetyModels.byCode(flagDefs);

        // 1. cờ được kích hoạt bởi đáp án mới (mức = cao nhất trong các luật kích hoạt)
        Map<String, Severity> triggered = new LinkedHashMap<>();
        for (SafetyRule r : rules) {
            Set<String> given = answers.get(r.questionCode());
            if (given == null || given.isEmpty() || !matches(r, given)) continue;
            triggered.merge(r.flag(), r.severity(), (a, b) -> a == Severity.RESTRICT || b == Severity.RESTRICT ? Severity.RESTRICT : Severity.REVIEW);
        }

        Map<String, ActiveFlag> active = new LinkedHashMap<>();
        List<FlagEvent> events = new ArrayList<>();
        Map<String, ActiveFlag> before = new LinkedHashMap<>();
        if (previous != null) previous.activeFlags().forEach(f -> before.put(f.code(), f));

        for (Map.Entry<String, Severity> t : triggered.entrySet()) {
            FlagDef def = defs.get(t.getKey());
            if (def == null) throw new IllegalStateException("Cờ chưa được định nghĩa trong rule set: " + t.getKey());
            active.put(t.getKey(), new ActiveFlag(t.getKey(), def.sticky(), t.getValue()));
            events.add(new FlagEvent(t.getKey(), before.containsKey(t.getKey()) ? "REAFFIRMED" : "ACTIVATED", def.sticky()));
        }
        // 2. cờ cũ không tái hiện: non-sticky => gỡ do sàng lọc lại; sticky => GIỮ NGUYÊN (chỉ clearance mới gỡ)
        for (ActiveFlag old : before.values()) {
            if (active.containsKey(old.code())) continue;
            if (old.sticky()) active.put(old.code(), old);
            else events.add(new FlagEvent(old.code(), "DEACTIVATED_BY_RESCREEN", false));
        }

        Status status = statusOf(active.values());
        // 3. không hạ status nếu policy status hiện tại yêu cầu clearance để rời đi
        if (previous != null) {
            Policy pol = policies.get(previous.status());
            if (pol != null && pol.requiresClearanceToLeave() && !status.atLeast(previous.status())) {
                // Giữ nguyên các cờ cũ (và ràng buộc của chúng): không thể rời status này nếu không qua clearance
                for (ActiveFlag old : before.values()) {
                    if (active.putIfAbsent(old.code(), old) == null) events.removeIf(e -> e.flag().equals(old.code()) && e.event().equals("DEACTIVATED_BY_RESCREEN"));
                }
                status = previous.status();
            }
        }

        Set<String> constraints = new TreeSet<>();
        for (ActiveFlag f : active.values()) constraints.addAll(flagConstraints.getOrDefault(f.code(), Set.of()));
        if (previous != null) constraints.addAll(previous.retainedConstraints());
        // status bị giữ do policy: ràng buộc của status cũ vẫn thuộc về các cờ cũ (đã giữ ở trên nếu cờ sticky/active); không tự bỏ
        return new Evaluation(status, List.copyOf(active.values()), constraints, events);
    }

    public static Status statusOf(Collection<ActiveFlag> flags) {
        if (flags.stream().anyMatch(f -> f.severity() == Severity.RESTRICT)) return Status.RESTRICTED;
        return flags.isEmpty() ? Status.CLEARED : Status.REVIEW_REQUIRED;
    }

    private boolean matches(SafetyRule r, Set<String> given) {
        return switch (r.op()) {
            case "EQ", "CONTAINS" -> given.contains(r.value());
            default -> throw new IllegalArgumentException("Toán tử safety không hỗ trợ: " + r.op());
        };
    }
}
