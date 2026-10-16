package com.calishealth.api.service.motion;

import com.calishealth.api.dto.MotionDtos.MeasurementDto;
import com.calishealth.api.dto.MotionDtos.RuleDto;
import com.calishealth.api.dto.MotionDtos.RuleUpsertRequest;

import java.text.Normalizer;
import java.util.*;

/**
 * Phát hiện rule trùng trong MỘT động tác (một profile). Hai rule coi là trùng khi:
 *  1. cùng mã rule; hoặc
 *  2. cùng tên (không phân biệt hoa thường, dấu, khoảng trắng); hoặc
 *  3. đo CÙNG MỘT THỨ (cùng loại chỉ số và cùng các điểm khớp, thứ tự hai đầu của một góc không quan trọng), áp dụng ở pha giao nhau
 *     (ALL giao với mọi pha), và vùng chuẩn chồng lên nhau đáng kể.
 * Đo cùng một thứ nhưng vùng chuẩn không chồng nhau (vd. "đáy ≤ 90°" và "đỉnh ≥ 160°") là hai rule khác nhau, không trùng.
 * Rule đã lưu trữ (ARCHIVED) không tính, để có thể soạn lại.
 */
final class MotionRuleDuplicates {
    private MotionRuleDuplicates() {}

    /** Hình dạng rút gọn của một rule để so sánh. */
    record Shape(String code, String name, String metricType, String phase, String identity, double lo, double hi, boolean intervalKnown, String operator,
                 Double normalMin, Double normalMax, Double target) {}

    static Shape of(RuleUpsertRequest r) {
        return shape(r.code(), r.name(), r.metricType(), r.phase(), r.measurement(), r.operator(), r.normalMin(), r.normalMax(), r.target());
    }

    static Shape of(RuleDto r) {
        return shape(r.code(), r.name(), r.metricType(), r.phase(), r.measurement(), r.operator(), r.normalMin(), r.normalMax(), r.target());
    }

    private static Shape shape(String code, String name, String metric, String phase, MeasurementDto m, String op, Double min, Double max, Double target) {
        double lo = Double.NEGATIVE_INFINITY, hi = Double.POSITIVE_INFINITY;
        boolean known = true;
        String o = op == null ? "" : op;
        switch (o) {
            case "BETWEEN" -> { if (min != null) lo = min; if (max != null) hi = max; }
            case "MINIMUM_REQUIRED", "GREATER_THAN", "GREATER_THAN_OR_EQUAL" -> { if (min != null) lo = min; }
            case "MAXIMUM_ALLOWED", "LESS_THAN", "LESS_THAN_OR_EQUAL" -> { if (max != null) hi = max; }
            case "DEVIATION_FROM_TARGET" -> { if (target != null && max != null) { lo = target - max; hi = target + max; } }
            case "EQUAL" -> { if (target != null) { lo = target; hi = target; } }
            default -> known = false;      // OUTSIDE, NOT_EQUAL: vùng chuẩn là phần bù, so theo toán tử và con số
        }
        return new Shape(code == null ? "" : code.trim().toUpperCase(Locale.ROOT), name == null ? "" : name, metric == null ? "" : metric,
                phase == null || phase.isBlank() ? "ALL" : phase, identity(metric, m), lo, hi, known, o, min, max, target);
    }

    /** Lý do trùng (tiếng Việt) hoặc null nếu không trùng. */
    static String conflict(Shape candidate, Shape existing) {
        if (!candidate.code().isEmpty() && candidate.code().equals(existing.code())) return "Trùng mã rule " + existing.code() + ".";
        if (!slug(candidate.name()).isEmpty() && slug(candidate.name()).equals(slug(existing.name()))) return "Trùng tên với rule " + existing.code() + " (" + existing.name() + ").";
        if (!candidate.metricType().equals(existing.metricType()) || !candidate.identity().equals(existing.identity())) return null;
        if (!phasesIntersect(candidate.phase(), existing.phase())) return null;
        if (!candidate.intervalKnown() || !existing.intervalKnown()) {
            boolean same = candidate.operator().equals(existing.operator()) && Objects.equals(candidate.normalMin(), existing.normalMin())
                    && Objects.equals(candidate.normalMax(), existing.normalMax()) && Objects.equals(candidate.target(), existing.target());
            return same ? "Đo cùng chỉ số, cùng điểm khớp và cùng vùng chuẩn với rule " + existing.code() + "." : null;
        }
        return overlaps(candidate, existing)
                ? "Đo cùng chỉ số và cùng điểm khớp với rule " + existing.code() + " (" + existing.name() + "), vùng chuẩn chồng lên nhau."
                : null;
    }

    /** Rule đầu tiên trong danh sách mà ứng viên trùng, kèm lý do. */
    static Optional<String> firstConflict(Shape candidate, Collection<Shape> existing) {
        for (Shape e : existing) {
            String why = conflict(candidate, e);
            if (why != null) return Optional.of(why);
        }
        return Optional.empty();
    }

    private static boolean phasesIntersect(String a, String b) {
        return "ALL".equals(a) || "ALL".equals(b) || a.equals(b);
    }

    /** Chồng nhau đáng kể: nửa vùng hẹp hơn trở lên. Vùng vô hạn chỉ cần chạm nhau. Vùng một điểm cần nằm trong vùng kia. */
    private static boolean overlaps(Shape a, Shape b) {
        double lo = Math.max(a.lo(), b.lo()), hi = Math.min(a.hi(), b.hi());
        if (lo > hi) return false;
        boolean unbounded = Double.isInfinite(a.lo()) || Double.isInfinite(a.hi()) || Double.isInfinite(b.lo()) || Double.isInfinite(b.hi());
        double lenA = a.hi() - a.lo(), lenB = b.hi() - b.lo();
        if (unbounded) return hi - lo > 0 || lo == hi;
        double minLen = Math.min(lenA, lenB);
        if (minLen <= 0) return true;
        return (hi - lo) / minLen >= 0.5;
    }

    /** "Đo cái gì": các điểm khớp được chuẩn hóa (hai đầu của một góc đổi chỗ vẫn là một). */
    static String identity(String metric, MeasurementDto m) {
        if (m == null) return metric == null ? "" : metric;
        List<Integer> p = m.points() == null ? List.of() : m.points();
        String type = metric == null ? "" : metric;
        return switch (type) {
            case "ANGLE_3_POINT", "ROM" -> angle(p);
            case "DISTANCE" -> "set:" + sorted(p);
            case "ALIGNMENT" -> "AXIS_DEVIATION".equals(m.method()) ? "axis:" + sorted(p) + ":" + m.axis() : "line:" + sorted(p);
            case "SYMMETRY" -> angle(p) + "/" + angle(m.pointsRight() == null ? List.of() : m.pointsRight());
            case "VELOCITY", "ACCELERATION" -> "pt:" + p + ":" + m.axis();
            case "STABILITY" -> "pt:" + p;
            case "LANDMARK_VISIBILITY" -> "set:" + sorted(p);
            case "TEMPO", "DURATION" -> "phase:" + m.phase();
            default -> type;      // POSE_CONFIDENCE, REP_SEQUENCE, REP_VALIDATION: không có điểm khớp
        };
    }

    private static String angle(List<Integer> p) {
        if (p.size() < 3) return "angle:" + p;
        return "angle:" + p.get(1) + "|" + sorted(List.of(p.get(0), p.get(2)));
    }

    private static List<Integer> sorted(List<Integer> p) {
        List<Integer> s = new ArrayList<>(p);
        s.removeIf(Objects::isNull);
        Collections.sort(s);
        return s;
    }

    static String slug(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s.toLowerCase(Locale.ROOT).replace('đ', 'd'), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return n.replaceAll("[^a-z0-9]", "");
    }
}
