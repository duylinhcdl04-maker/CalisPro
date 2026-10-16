package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.*;

/**
 * Chọn phản hồi để phát NGAY (ruleEniges §30): gom & bỏ trùng theo feedbackCode -> lọc cooldown -> xếp hạng
 * (priority ↓, severity ↓, mã rule) -> 1 phản hồi chính. ≥ 2 vi phạm khác nhau (≥ WARNING) cùng pha -> COMBINED
 * (gợi ý gộp bằng Gemini); ngược lại SIMPLE (phát audio dựng sẵn). Vi phạm vẫn được ghi nhận dù đang cooldown.
 */
public final class ViolationAggregator {
    private final Map<String, Long> lastDelivered = new HashMap<>();

    public static final Comparator<Violation> RANK = Comparator
            .comparingInt((Violation v) -> v.priority()).reversed()
            .thenComparing((Violation v) -> v.severity().ordinal(), Comparator.reverseOrder())
            .thenComparing((Violation v) -> v.ruleCode());

    public FeedbackDecision decide(List<Violation> active, Map<String, Long> cooldownByCode, long now) {
        Map<String, Violation> byCode = new LinkedHashMap<>();
        for (Violation v : active) {
            String key = v.feedbackCode() != null ? v.feedbackCode() : v.ruleCode();
            Violation cur = byCode.get(key);
            if (cur == null || RANK.compare(v, cur) < 0) byCode.put(key, v);
        }
        List<Violation> candidates = new ArrayList<>();
        List<String> suppressed = new ArrayList<>();
        for (Map.Entry<String, Violation> e : byCode.entrySet()) {
            Long last = lastDelivered.get(e.getKey());
            long cooldown = cooldownByCode.getOrDefault(e.getKey(), 0L);
            if (last != null && now - last < cooldown) suppressed.add(e.getKey());
            else candidates.add(e.getValue());
        }
        if (candidates.isEmpty()) return FeedbackDecision.none(suppressed);
        candidates.sort(RANK);
        Violation primary = candidates.get(0);
        List<Violation> related = candidates.stream().skip(1)
                .filter(v -> v.severity().ordinal() >= Severity.WARNING.ordinal() && Objects.equals(v.phase(), primary.phase()))
                .toList();
        lastDelivered.put(key(primary), now);
        related.forEach(v -> lastDelivered.put(key(v), now));
        return new FeedbackDecision(related.isEmpty() ? FeedbackMode.SIMPLE : FeedbackMode.COMBINED, primary, related, suppressed);
    }

    private static String key(Violation v) { return v.feedbackCode() != null ? v.feedbackCode() : v.ruleCode(); }
}
