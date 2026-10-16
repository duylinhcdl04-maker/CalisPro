package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.*;

/**
 * Kiểm tra cấu hình rule (backend luôn kiểm tra lại, không tin frontend - ruleEniges §42, §59).
 * Trả về danh sách lỗi (rỗng = hợp lệ) và cảnh báo.
 */
public final class MotionRuleValidator {
    private MotionRuleValidator() {}

    public record Result(List<String> errors, List<String> warnings) {
        public boolean valid() { return errors.isEmpty(); }
    }

    public static Result validate(RuleDef r, Set<String> profilePhases, boolean feedbackCodeExists) {
        List<String> e = new ArrayList<>(), w = new ArrayList<>();
        if (r.code() == null || !r.code().matches("[A-Z0-9_]{3,80}")) e.add("Mã rule chỉ gồm A–Z, 0–9, _ (3–80 ký tự).");
        if (r.name() == null || r.name().isBlank()) e.add("Tên rule không được để trống.");
        if (r.measurement() == null || r.measurement().type() == null) { e.add("Thiếu loại chỉ số (metric type)."); return new Result(e, w); }

        MetricEvaluator ev = MetricEvaluatorFactory.get(r.measurement().type());
        e.addAll(ev.validateMeasurement(r.measurement()));
        for (int p : r.measurement().requiredLandmarks()) if (p < 0 || p > 32) e.add("Landmark #" + p + " không thuộc MediaPipe Pose (0–32).");
        if (r.unit() == null || !ev.units().contains(r.unit())) e.add("Đơn vị '" + r.unit() + "' không hợp lệ cho " + r.measurement().type() + " (hợp lệ: " + ev.units() + ").");
        if (r.operator() == null || !ev.operators().contains(r.operator())) e.add("Toán tử '" + r.operator() + "' không dùng được cho " + r.measurement().type() + " (hợp lệ: " + ev.operators() + ").");

        if (r.phase() == null || (!"ALL".equals(r.phase()) && !profilePhases.contains(r.phase()))) e.add("Pha '" + r.phase() + "' không thuộc motion profile.");
        if (ev.timing() == Timing.REP && !"ALL".equals(r.phase())) e.add(r.measurement().type() + " được xét khi kết thúc rep nên pha phải là ALL.");

        if (r.operator() != null) checkNormal(r, e);
        checkBands(r, e, w);

        if (r.priority() < 1 || r.priority() > 10) e.add("Điểm ưu tiên phải từ 1 đến 10.");
        if (r.persistenceValue() <= 0) e.add("Thời gian duy trì lỗi (persistence) phải > 0.");
        if (r.cooldownMs() < 0) e.add("Cooldown phải ≥ 0.");
        if (r.evaluationIntervalMs() < 0) e.add("Tần suất đánh giá phải ≥ 0.");
        if (r.stopExercise() && !hasSeverity(r, Severity.CRITICAL)) e.add("Chỉ rule có mức CRITICAL mới được dừng bài tập.");
        if (r.feedbackCode() == null || r.feedbackCode().isBlank()) e.add("Thiếu Feedback Code.");
        else if (!feedbackCodeExists) e.add("Feedback Code '" + r.feedbackCode() + "' chưa có template phản hồi.");
        return new Result(e, w);
    }

    private static void checkNormal(RuleDef r, List<String> e) {
        Double lo = r.normalMin(), hi = r.normalMax();
        switch (r.operator()) {
            case BETWEEN, OUTSIDE -> {
                if (lo == null || hi == null) e.add("Biên độ chuẩn cần cả Normal Min và Normal Max.");
                else if (lo > hi) e.add("Normal Min phải ≤ Normal Max.");
                if (r.operator() == Operator.BETWEEN && r.target() != null && lo != null && hi != null && (r.target() < lo || r.target() > hi)) {
                    e.add("Giá trị mục tiêu phải nằm trong biên độ chuẩn.");
                }
            }
            case MINIMUM_REQUIRED, GREATER_THAN, GREATER_THAN_OR_EQUAL -> { if (lo == null) e.add("Cần Normal Min (ngưỡng tối thiểu)."); }
            case MAXIMUM_ALLOWED, LESS_THAN, LESS_THAN_OR_EQUAL -> { if (hi == null) e.add("Cần Normal Max (ngưỡng tối đa)."); }
            case DEVIATION_FROM_TARGET -> {
                if (r.target() == null) e.add("Độ lệch so với mục tiêu cần Target Value.");
                if (hi == null || hi < 0) e.add("Cần độ lệch tối đa cho phép (Normal Max ≥ 0).");
            }
            case EQUAL, NOT_EQUAL -> { if (r.target() == null) e.add("Cần Target Value để so sánh bằng."); }
        }
    }

    private static void checkBands(RuleDef r, List<String> e, List<String> w) {
        List<Band> bands = r.bands();
        for (Band b : bands) {
            if (b.severity() == null) { e.add("Dải ngưỡng thiếu mức độ."); continue; }
            if (b.min() == null && b.max() == null) e.add("Dải " + b.severity() + " phải có ít nhất một cận.");
            if (b.min() != null && b.max() != null && b.min() > b.max()) e.add("Dải " + b.severity() + ": cận dưới > cận trên.");
            if (r.operator() != null && overlapsNormal(r, b)) e.add("Dải " + b.severity() + " chồng lên biên độ chuẩn.");
        }
        for (int i = 0; i < bands.size(); i++) for (int j = i + 1; j < bands.size(); j++) {
            if (overlap(bands.get(i), bands.get(j))) e.add("Dải " + bands.get(i).severity() + " và " + bands.get(j).severity() + " bị chồng lấn.");
        }
        // Mức độ phải tăng dần khi đi xa biên độ chuẩn (vd. phía cao: WARNING < ERROR < CRITICAL)
        if (r.operator() == Operator.BETWEEN && r.normalMin() != null && r.normalMax() != null) {
            checkMonotonic(bands.stream().filter(b -> b.max() != null && b.max() <= r.normalMin()).toList(), true, e);
            checkMonotonic(bands.stream().filter(b -> b.min() != null && b.min() >= r.normalMax()).toList(), false, e);
        }
        if (!bands.isEmpty() && hasGap(r)) w.add("Có khoảng giá trị không thuộc chuẩn và không thuộc dải nào - sẽ được coi là UNCLASSIFIED (không cảnh báo).");
    }

    private static void checkMonotonic(List<Band> side, boolean lowSide, List<String> e) {
        List<Band> sorted = new ArrayList<>(side);
        // đi ra xa biên độ chuẩn
        sorted.sort(Comparator.comparingDouble((Band b) -> lowSide ? -(b.max() == null ? Double.MAX_VALUE : b.max())
                : (b.min() == null ? -Double.MAX_VALUE : b.min())));
        for (int i = 1; i < sorted.size(); i++) {
            if (sorted.get(i).severity().ordinal() < sorted.get(i - 1).severity().ordinal()) {
                e.add("Mức độ phải tăng dần khi đi xa biên độ chuẩn (" + sorted.get(i - 1).severity() + " → " + sorted.get(i).severity() + ").");
                return;
            }
        }
    }

    static boolean overlap(Band a, Band b) {
        double aLo = a.min() == null ? Double.NEGATIVE_INFINITY : a.min(), aHi = a.max() == null ? Double.POSITIVE_INFINITY : a.max();
        double bLo = b.min() == null ? Double.NEGATIVE_INFINITY : b.min(), bHi = b.max() == null ? Double.POSITIVE_INFINITY : b.max();
        if (aHi < bLo || bHi < aLo) return false;
        if (aHi == bLo) return a.maxInclusive() && b.minInclusive();
        if (bHi == aLo) return b.maxInclusive() && a.minInclusive();
        return true;
    }

    /** Dải có điểm nằm trong vùng chuẩn (kiểm tra tại hai cận và điểm giữa của dải). */
    static boolean overlapsNormal(RuleDef r, Band b) {
        List<Double> probes = new ArrayList<>();
        if (b.min() != null) probes.add(b.minInclusive() ? b.min() : Math.nextUp(b.min()));
        if (b.max() != null) probes.add(b.maxInclusive() ? b.max() : Math.nextDown(b.max()));
        if (b.min() != null && b.max() != null) probes.add((b.min() + b.max()) / 2);
        for (double p : probes) if (ThresholdClassifier.isNormal(r, p)) return true;
        return false;
    }

    /** Lấy mẫu dày quanh các cận để phát hiện khe hở giữa chuẩn và các dải. */
    static boolean hasGap(RuleDef r) {
        TreeSet<Double> pts = new TreeSet<>();
        for (Band b : r.bands()) { if (b.min() != null) pts.add(b.min()); if (b.max() != null) pts.add(b.max()); }
        if (r.normalMin() != null) pts.add(r.normalMin());
        if (r.normalMax() != null) pts.add(r.normalMax());
        if (r.target() != null) pts.add(r.target());
        List<Double> list = new ArrayList<>(pts);
        for (int i = 0; i + 1 < list.size(); i++) {
            double mid = (list.get(i) + list.get(i + 1)) / 2;
            for (double p : new double[]{mid, list.get(i), list.get(i + 1)}) {
                Status s = ThresholdClassifier.classify(r, p).status();
                if (s == Status.UNCLASSIFIED) return true;
            }
        }
        return false;
    }

    private static boolean hasSeverity(RuleDef r, Severity s) {
        return r.severity() == s || r.bands().stream().anyMatch(b -> b.severity() == s);
    }
}
