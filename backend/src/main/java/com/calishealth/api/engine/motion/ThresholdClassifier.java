package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.Locale;

/**
 * Phân loại giá trị đo theo ngưỡng TƯỜNG MINH của rule (không đoán ngưỡng):
 *  1) operator xác định vùng NORMAL (DEVIATION_FROM_TARGET: xét |v − target|);
 *  2) ngoài NORMAL -> dải WARNING/ERROR/CRITICAL chứa giá trị;
 *  3) rule không chia dải -> mức của rule; có dải nhưng giá trị rơi vào khe -> UNCLASSIFIED (không tạo vi phạm).
 */
public final class ThresholdClassifier {
    private ThresholdClassifier() {}

    public static Classification classify(RuleDef r, double observed) {
        double v = r.operator() == Operator.DEVIATION_FROM_TARGET && r.target() != null ? Math.abs(observed - r.target()) : observed;
        if (isNormal(r, v)) return new Classification(Status.NORMAL, observed, v, null);
        for (Band b : r.bands()) {
            if (b.contains(v)) return new Classification(Status.of(b.severity()), observed, v, b);
        }
        if (r.bands().isEmpty()) return new Classification(Status.of(r.severity()), observed, v, null);
        return new Classification(Status.UNCLASSIFIED, observed, v, null);
    }

    static boolean isNormal(RuleDef r, double v) {
        Double lo = r.normalMin(), hi = r.normalMax();
        boolean loIn = r.normalMinInclusive(), hiIn = r.normalMaxInclusive();
        return switch (r.operator()) {
            case BETWEEN -> ge(v, lo, loIn) && le(v, hi, hiIn);
            case OUTSIDE -> (lo != null && (loIn ? v <= lo : v < lo)) || (hi != null && (hiIn ? v >= hi : v > hi));
            case MINIMUM_REQUIRED, GREATER_THAN_OR_EQUAL -> ge(v, lo, true);
            case GREATER_THAN -> ge(v, lo, false);
            case MAXIMUM_ALLOWED, LESS_THAN_OR_EQUAL -> le(v, hi, true);
            case LESS_THAN -> le(v, hi, false);
            case DEVIATION_FROM_TARGET -> le(v, hi, hiIn);
            case EQUAL -> r.target() != null && Math.abs(v - r.target()) < 1e-9;
            case NOT_EQUAL -> r.target() == null || Math.abs(v - r.target()) >= 1e-9;
        };
    }

    private static boolean ge(double v, Double min, boolean inclusive) { return min == null || (inclusive ? v >= min : v > min); }
    private static boolean le(double v, Double max, boolean inclusive) { return max == null || (inclusive ? v <= max : v < max); }

    /** Mô tả vùng chuẩn để hiển thị / lưu vết ("45–70 DEGREE", "≥ 80", "|v−180| ≤ 10"). */
    public static String expected(RuleDef r) {
        String u = r.unit() == null ? "" : " " + r.unit();
        return switch (r.operator()) {
            case BETWEEN -> f(r.normalMin()) + "–" + f(r.normalMax()) + u;
            case OUTSIDE -> "< " + f(r.normalMin()) + " hoặc > " + f(r.normalMax()) + u;
            case MINIMUM_REQUIRED, GREATER_THAN_OR_EQUAL -> "≥ " + f(r.normalMin()) + u;
            case GREATER_THAN -> "> " + f(r.normalMin()) + u;
            case MAXIMUM_ALLOWED, LESS_THAN_OR_EQUAL -> "≤ " + f(r.normalMax()) + u;
            case LESS_THAN -> "< " + f(r.normalMax()) + u;
            case DEVIATION_FROM_TARGET -> "|giá trị − " + f(r.target()) + "| ≤ " + f(r.normalMax()) + u;
            case EQUAL -> "= " + f(r.target());
            case NOT_EQUAL -> "≠ " + f(r.target());
        };
    }

    static String f(Double v) {
        if (v == null) return "∞";
        return v == Math.rint(v) ? String.valueOf(v.longValue()) : String.format(Locale.ROOT, "%.2f", v);
    }
}
