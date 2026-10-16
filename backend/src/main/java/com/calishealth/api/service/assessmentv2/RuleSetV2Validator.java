package com.calishealth.api.service.assessmentv2;

import java.util.*;

/**
 * Kiểm tra hợp lệ của một rule set V2 trước khi gửi duyệt / kích hoạt (hàm thuần, không đọc DB).
 * Chỉ chứa BẤT BIẾN và ràng buộc cấu trúc; không chứa giá trị "đúng" của chuyên môn (do Coach quyết định).
 * Validator của ladder/safety (các kiểm tra V01-V13 trong migration_assessment_v2_03_verify.sql) chưa được port sang Java.
 */
public final class RuleSetV2Validator {
    private RuleSetV2Validator() {}

    public record ReqSnap(String gate, String competency, String metric, double value) {}
    public record LevelSnap(String code, int rank, double promoteMin, double regressBelow, List<ReqSnap> requirements) {}
    public record Snapshot(Map<String, Double> params, Map<String, String> text, List<LevelSnap> levels, Set<String> requiredKeys) {}

    /** Bất biến I18: level Initial (tự khai báo) không bao giờ vượt L2, dù Coach cấu hình thế nào. */
    public static final int INITIAL_MAX_LEVEL_RANK = 2;

    /** Điểm cộng chuyên cần (EXP) tối đa vào điểm tổng khi xét lên level; Coach không đặt cao hơn được để EXP không thay bài test và form. */
    public static final int ATTENDANCE_BONUS_CAP = 5;

    public static List<String> validate(Snapshot s) {
        List<String> errors = new ArrayList<>();
        for (String k : s.requiredKeys()) if (!s.params().containsKey(k) && !s.text().containsKey(k)) errors.add("Thiếu tham số bắt buộc: " + k);

        s.params().forEach((k, v) -> {
            if (v == null || v.isNaN() || v.isInfinite()) errors.add("Tham số không phải số hợp lệ: " + k);
            else if (v < 0) errors.add("Tham số không được âm: " + k);
        });

        range(s, errors, "initial.max_level_rank", 0, INITIAL_MAX_LEVEL_RANK, "Initial là tự khai báo nên tối đa L" + INITIAL_MAX_LEVEL_RANK + " (bất biến I18)");
        for (String k : List.of("fast_track.enabled", "level.L4.requiresCoachVerified", "exp.enabled")) bool(s, errors, k);
        range(s, errors, "attendance.minScore", 0, 100, "điểm chuyên cần thuộc thang 0-100");
        range(s, errors, "attendance.bonusMax", 0, ATTENDANCE_BONUS_CAP, "chuyên cần chỉ là điểm cộng nhỏ, không được thay bài test hay form");
        range(s, errors, "exp.goodForm.minAiShare", 0, 1, "tỷ lệ hiệp do AI đo thuộc [0, 1]");
        for (String k : List.of("attendance.windowDays", "attendance.targetExp"))
            if (s.params().containsKey(k) && (s.params().get(k) < 1 || s.params().get(k) != Math.rint(s.params().get(k)))) errors.add(k + " phải là số nguyên ≥ 1");
        for (String k : List.of("exp.checkin", "exp.session", "exp.goodForm", "exp.streak7", "exp.assessment"))
            if (s.params().containsKey(k) && s.params().get(k) != Math.rint(s.params().get(k))) errors.add(k + " phải là số nguyên");
        if (s.params().containsKey("ewma.alpha")) {
            double a = s.params().get("ewma.alpha");
            if (a <= 0 || a > 1) errors.add("ewma.alpha phải thuộc (0, 1]");
        }
        for (String k : List.of("regression.confirmations", "max_promotion_step", "l4.review.expiry_days", "l4.video.retention_days"))
            if (s.params().containsKey(k) && (s.params().get(k) < 1 || s.params().get(k) != Math.rint(s.params().get(k)))) errors.add(k + " phải là số nguyên ≥ 1");
        s.params().forEach((k, v) -> {
            if (k.startsWith("baseline.attempts.") && (v < 1 || v != Math.rint(v))) errors.add(k + " phải là số nguyên ≥ 1");
            if ((k.startsWith("gate.reliability.min") || k.startsWith("baseline.reliability.min")) && v > 1) errors.add(k + " phải thuộc [0, 1]");
            if (k.startsWith("mobility.target.") && v <= 0) errors.add(k + " phải > 0");
        });
        if (s.params().containsKey("mobility.capRatio") && s.params().get("mobility.capRatio") < 1) errors.add("mobility.capRatio phải ≥ 1");
        if (s.text().containsKey("baseline.attempt_aggregation") && !Set.of("MIN", "MEAN").contains(s.text().get("baseline.attempt_aggregation")))
            errors.add("baseline.attempt_aggregation phải là MIN hoặc MEAN");
        double weights = s.params().entrySet().stream().filter(e -> e.getKey().startsWith("overall.weight.")).mapToDouble(Map.Entry::getValue).sum();
        if (s.params().keySet().stream().anyMatch(k -> k.startsWith("overall.weight.")) && weights <= 0) errors.add("Tổng overall.weight.* phải > 0");

        levels(s, errors);
        return errors;
    }

    private static void levels(Snapshot s, List<String> errors) {
        List<LevelSnap> levels = s.levels().stream().sorted(Comparator.comparingInt(LevelSnap::rank)).toList();
        for (int i = 0; i < levels.size(); i++) {
            LevelSnap l = levels.get(i);
            if (l.promoteMin() < 0 || l.promoteMin() > 100) errors.add(l.code() + ": overall_promote_min phải thuộc [0, 100]");
            if (l.regressBelow() < 0) errors.add(l.code() + ": overall_regress_below không được âm");
            if (l.rank() > 0 && l.regressBelow() >= l.promoteMin()) errors.add(l.code() + ": overall_regress_below phải nhỏ hơn overall_promote_min (hysteresis)");
            if (i > 0 && l.promoteMin() <= levels.get(i - 1).promoteMin()) errors.add(l.code() + ": overall_promote_min phải tăng nghiêm ngặt theo level");
        }
        // Yêu cầu phải TÍCH LUỸ (R8): ngưỡng năng lực của level cao không thấp hơn level thấp, để "level cao nhất mà mọi cổng PASS" nhất quán
        Map<String, Double> previous = new HashMap<>();
        for (LevelSnap l : levels) {
            Map<String, Double> current = new HashMap<>();
            for (ReqSnap r : l.requirements()) {
                if (!"COMPETENCY".equals(r.gate())) continue;
                if (r.value() < 0 || r.value() > 100) errors.add(l.code() + ": ngưỡng năng lực " + r.competency() + " phải thuộc [0, 100]");
                Double before = previous.get(r.competency());
                if (before != null && r.value() < before) errors.add(l.code() + ": ngưỡng " + r.competency() + " (" + r.value() + ") thấp hơn level trước (" + before + ")");
                current.put(r.competency(), r.value());
            }
            previous.putAll(current);
        }
    }

    private static void range(Snapshot s, List<String> errors, String key, double min, double max, String why) {
        Double v = s.params().get(key);
        if (v != null && (v < min || v > max)) errors.add(key + " phải thuộc [" + (int) min + ", " + (int) max + "]: " + why);
    }

    private static void bool(Snapshot s, List<String> errors, String key) {
        Double v = s.params().get(key);
        if (v != null && v != 0 && v != 1) errors.add(key + " phải là 0 hoặc 1");
    }

    /** Phạm vi review ([rule_set_reviews.scope_type]) của một thay đổi tham số. */
    public static String scopeOfParam(String key) {
        for (String p : List.of("group_weight.", "overall.weight.", "blend.", "reliability.", "reliability_class.", "quality.", "form_factor.", "recency."))
            if (key.startsWith(p)) return "WEIGHTS";
        return "OTHER";
    }
}
