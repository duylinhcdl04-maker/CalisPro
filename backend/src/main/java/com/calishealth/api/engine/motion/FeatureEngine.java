package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.*;

/**
 * Feature Engine (có trạng thái, 1 instance / phiên): landmark MediaPipe -> giá trị đo + pha + rep.
 * Mọi phép tính hình học nằm ở đây; Rule Engine chỉ đọc giá trị đã tính (ruleEniges §27).
 *
 * Toạ độ MediaPipe chuẩn hoá theo chiều rộng/cao ảnh nên x được nhân aspectRatio để góc không bị méo.
 * Khoảng cách được chuẩn hoá theo chiều dài thân (vai–hông) để không phụ thuộc khoảng cách tới camera.
 */
public final class FeatureEngine {
    public static final List<String> REP_PHASES = List.of("TOP", "DESCENDING", "BOTTOM", "ASCENDING");

    private final ProfileDef profile;
    private final List<Measurement> frameMeasurements = new ArrayList<>();
    private final List<Measurement> repMeasurements = new ArrayList<>();

    // ---- trạng thái pha / rep ----
    private String phase = "SETUP";
    private long phaseEnteredMs = -1;
    private int completedReps = 0;
    private boolean inRep = false;
    private long repStartMs = -1;
    private long lastRepEndMs = Long.MIN_VALUE / 2;
    private boolean passedMid = false;
    private final List<String> repPhaseSeq = new ArrayList<>();
    private final Map<String, Double> repPhaseSec = new HashMap<>();
    private final Map<String, double[]> repMinMax = new HashMap<>();
    private Map<String, Double> lastRomAngles = Map.of();     // góc ROM của khung trước (khung TOP ngay trước khi rep bắt đầu)

    // ---- lịch sử chuyển động ----
    private final Map<Integer, double[]> lastPos = new HashMap<>();    // landmark -> {x, y, t}
    private final Map<String, double[]> accelPrev = new HashMap<>();   // khoá gia tốc -> {vận tốc trước, t}
    private final Map<String, Deque<double[]>> windows = new HashMap<>();

    public FeatureEngine(ProfileDef profile, Collection<Measurement> measurements) {
        this.profile = profile;
        Set<String> seen = new HashSet<>();
        for (Measurement m : measurements) {
            if (m == null || !seen.add(m.featureKey())) continue;
            if (MetricEvaluatorFactory.get(m.type()).timing() == Timing.REP) repMeasurements.add(m);
            else frameMeasurements.add(m);
        }
    }

    public String phase() { return phase; }
    public int completedReps() { return completedReps; }

    public MotionFeatures process(PoseFrame frame) {
        long t = frame.timestampMs();
        if (!frame.detected()) {
            return new MotionFeatures(t, phase, currentRepNumber(), false, 0, Map.of(), Map.of(), null);
        }
        List<Landmark> lm = frame.landmarks();
        double ar = frame.aspectRatio() > 0 ? frame.aspectRatio() : 1;
        Map<Integer, Double> visibility = new HashMap<>();
        for (int i = 0; i < 33; i++) visibility.put(i, lm.get(i).visibility());
        double poseConfidence = poseConfidence(visibility);
        double torso = torsoLength(lm, ar);

        // ---- ROM: góc của khung này được tính vào rep đang diễn ra (kể cả khung kết thúc rep) ----
        Map<String, Double> romAngles = new HashMap<>();
        for (Measurement m : repMeasurements) {
            if (m.type() == MetricType.ROM && visible(m.points(), visibility)) {
                romAngles.put(m.featureKey(), angle(lm, ar, m.points().get(0), m.points().get(1), m.points().get(2)));
            }
        }
        if (inRep) romAngles.forEach((key, value) -> trackRom(key, value));

        // ---- pha & rep ----
        boolean wasInRep = inRep;
        RepSummary completed = updatePhase(lm, ar, visibility, t);
        if (!wasInRep && inRep) {             // rep vừa bắt đầu: tính cả khung TOP trước đó và khung hiện tại
            lastRomAngles.forEach((key, value) -> trackRom(key, value));
            romAngles.forEach((key, value) -> trackRom(key, value));
        }
        lastRomAngles = romAngles;

        // ---- giá trị theo khung ----
        Map<String, Double> values = new HashMap<>();
        for (Measurement m : frameMeasurements) {
            Double v = compute(m, lm, ar, torso, visibility, poseConfidence, t);
            if (v != null && !v.isNaN() && !v.isInfinite()) values.put(m.featureKey(), v);
        }
        rememberPositions(lm, ar, t);
        return new MotionFeatures(t, phase, currentRepNumber(), true, poseConfidence, values, visibility, completed);
    }

    private void trackRom(String key, Double a) {
        if (a == null || a.isNaN()) return;
        repMinMax.merge(key, new double[]{a, a}, (o, n) -> new double[]{Math.min(o[0], n[0]), Math.max(o[1], n[1])});
    }

    private int currentRepNumber() { return inRep ? completedReps + 1 : completedReps; }

    // ============================== Pha / rep ==============================

    private RepSummary updatePhase(List<Landmark> lm, double ar, Map<Integer, Double> visibility, long t) {
        Measurement rm = profile.repMetric();
        Double v = null;
        if (rm != null && rm.points().size() == 3 && visible(rm.points(), visibility)) {
            v = angle(lm, ar, rm.points().get(0), rm.points().get(1), rm.points().get(2));
        }
        if ("HOLD".equals(profile.movementType())) {
            boolean inHold = v == null ? rm == null : within(v, profile.repBottom(), profile.repTop());
            setPhase(inHold ? "HOLD" : "SETUP", t);
            return null;
        }
        if (v == null || profile.repTop() == null || profile.repBottom() == null) return null;   // không đo được -> giữ pha

        boolean ascendingFirst = "ASCENDING_FIRST".equals(profile.repDirection());
        double x = ascendingFirst ? -v : v;
        double top = ascendingFirst ? -profile.repBottom() : profile.repTop();
        double bottom = ascendingFirst ? -profile.repTop() : profile.repBottom();
        double mid = (top + bottom) / 2;

        switch (phase) {
            case "SETUP" -> { if (x >= top) setPhase("TOP", t); }
            case "TOP" -> { if (x < top) { startRep(t); setPhase("DESCENDING", t); } }
            case "DESCENDING" -> {
                if (x < mid) passedMid = true;
                if (x <= bottom) setPhase("BOTTOM", t);
                else if (x >= top) {
                    setPhase("TOP", t);
                    if (passedMid) return finishRep(t, false);     // xuống quá nửa nhưng không tới đáy: lần thử không trọn
                    inRep = false;                                 // dao động nhỏ ở đỉnh: không tính
                }
            }
            case "BOTTOM" -> { if (x > bottom) setPhase("ASCENDING", t); }
            case "ASCENDING" -> {
                if (x <= bottom) setPhase("BOTTOM", t);
                else if (x >= top && t - lastRepEndMs >= profile.debounceMs()) {
                    setPhase("TOP", t);
                    return finishRep(t, true);
                }
            }
            default -> setPhase(x >= top ? "TOP" : "SETUP", t);
        }
        return null;
    }

    private void startRep(long t) {
        inRep = true;
        repStartMs = t;
        passedMid = false;
        repPhaseSeq.clear();
        repPhaseSec.clear();
        repMinMax.clear();
    }

    private RepSummary finishRep(long t, boolean complete) {
        inRep = false;
        completedReps++;
        lastRepEndMs = t;
        Map<String, Double> values = new HashMap<>();
        for (Measurement m : repMeasurements) {
            switch (m.type()) {
                case ROM -> { double[] mm = repMinMax.get(m.featureKey()); if (mm != null) values.put(m.featureKey(), mm[1] - mm[0]); }
                case TEMPO -> values.put(m.featureKey(), repPhaseSec.getOrDefault(m.phase(), 0.0));
                case REP_SEQUENCE -> values.put(m.featureKey(), inOrder(repPhaseSeq, List.of("DESCENDING", "BOTTOM", "ASCENDING")) ? 1.0 : 0.0);
                case REP_VALIDATION -> {
                    long d = t - repStartMs;
                    values.put(m.featureKey(), complete && d >= profile.minRepMs() && d <= profile.maxRepMs() ? 1.0 : 0.0);
                }
                default -> { }
            }
        }
        return new RepSummary(completedReps, repStartMs, t, complete, values, List.copyOf(repPhaseSeq));
    }

    private void setPhase(String p, long t) {
        if (p.equals(phase)) { if (phaseEnteredMs < 0) phaseEnteredMs = t; return; }
        if (inRep && phaseEnteredMs >= 0) repPhaseSec.merge(phase, (t - phaseEnteredMs) / 1000.0, (left, right) -> left + right);
        phase = p;
        phaseEnteredMs = t;
        if (inRep && REP_PHASES.contains(p)) repPhaseSeq.add(p);
    }

    private static boolean inOrder(List<String> seq, List<String> expected) {
        int i = 0;
        for (String s : seq) if (i < expected.size() && s.equals(expected.get(i))) i++;
        return i == expected.size();
    }

    // ============================== Giá trị theo khung ==============================

    private Double compute(Measurement m, List<Landmark> lm, double ar, double torso, Map<Integer, Double> visibility,
                           double poseConfidence, long t) {
        List<Integer> p = m.points();
        return switch (m.type()) {
            case ANGLE_3_POINT -> angle(lm, ar, p.get(0), p.get(1), p.get(2));
            case DISTANCE -> dist(lm, ar, p.get(0), p.get(1)) / torso;
            case ALIGNMENT -> alignment(m, lm, ar);
            case SYMMETRY -> Math.abs(angle(lm, ar, p.get(0), p.get(1), p.get(2))
                    - angle(lm, ar, m.pointsRight().get(0), m.pointsRight().get(1), m.pointsRight().get(2)));
            case VELOCITY -> velocity(m, lm, ar, torso, t);
            case ACCELERATION -> acceleration(m, lm, ar, torso, t);
            case STABILITY -> stability(m, lm, ar, torso);
            case DURATION -> m.phase() != null && m.phase().equals(phase) && phaseEnteredMs >= 0 ? (t - phaseEnteredMs) / 1000.0 : 0.0;
            case LANDMARK_VISIBILITY -> p.stream().mapToDouble(i -> visibility.getOrDefault(i, 0.0)).min().orElse(0);
            case POSE_CONFIDENCE -> poseConfidence;
            default -> null;
        };
    }

    private Double alignment(Measurement m, List<Landmark> lm, double ar) {
        List<Integer> p = m.points();
        if ("AXIS_DEVIATION".equals(m.method())) {
            double dx = Math.abs((lm.get(p.get(1)).x() - lm.get(p.get(0)).x()) * ar);
            double dy = Math.abs(lm.get(p.get(1)).y() - lm.get(p.get(0)).y());
            if (dx == 0 && dy == 0) return null;
            return "VERTICAL".equals(m.axis()) ? Math.toDegrees(Math.atan2(dx, dy)) : Math.toDegrees(Math.atan2(dy, dx));
        }
        // COLLINEARITY: độ lệch lớn nhất (độ) của các điểm giữa khỏi đường nối điểm đầu – điểm cuối
        double worst = 0;
        for (int i = 1; i < p.size() - 1; i++) worst = Math.max(worst, 180 - angle(lm, ar, p.get(0), p.get(i), p.get(p.size() - 1)));
        return worst;
    }

    /** Vận tốc landmark (chiều dài thân / giây) so với khung trước; không ghi trạng thái. */
    private Double velocity(Measurement m, List<Landmark> lm, double ar, double torso, long t) {
        int i = m.points().get(0);
        double[] prev = lastPos.get(i);
        if (prev == null || t <= prev[2]) return null;
        double dt = (t - prev[2]) / 1000.0;
        double dx = (lm.get(i).x() * ar - prev[0]) / torso, dy = (lm.get(i).y() - prev[1]) / torso;
        return switch (m.axis() == null ? "ANY" : m.axis()) {
            case "VERTICAL" -> Math.abs(dy) / dt;
            case "HORIZONTAL" -> Math.abs(dx) / dt;
            default -> Math.hypot(dx, dy) / dt;
        };
    }

    private Double acceleration(Measurement m, List<Landmark> lm, double ar, double torso, long t) {
        Double v = velocity(m, lm, ar, torso, t);
        if (v == null) return null;
        double[] prev = accelPrev.put(m.featureKey(), new double[]{v, t});
        if (prev == null || t <= prev[1]) return null;
        return Math.abs(v - prev[0]) / ((t - prev[1]) / 1000.0);
    }

    private Double stability(Measurement m, List<Landmark> lm, double ar, double torso) {
        int i = m.points().get(0);
        int size = m.windowFrames() == null ? 15 : m.windowFrames();
        Deque<double[]> w = windows.computeIfAbsent(m.featureKey(), k -> new ArrayDeque<>());
        w.addLast(new double[]{lm.get(i).x() * ar, lm.get(i).y()});
        while (w.size() > size) w.removeFirst();
        if (w.size() < Math.max(3, size / 2)) return null;
        double mx = w.stream().mapToDouble(a -> a[0]).average().orElse(0), my = w.stream().mapToDouble(a -> a[1]).average().orElse(0);
        double var = w.stream().mapToDouble(a -> (a[0] - mx) * (a[0] - mx) + (a[1] - my) * (a[1] - my)).average().orElse(0);
        return Math.sqrt(var) / torso;
    }

    private void rememberPositions(List<Landmark> lm, double ar, long t) {
        for (Measurement m : frameMeasurements) {
            if (m.type() != MetricType.VELOCITY && m.type() != MetricType.ACCELERATION) continue;
            int i = m.points().get(0);
            lastPos.put(i, new double[]{lm.get(i).x() * ar, lm.get(i).y(), t});
        }
    }

    // ============================== Hình học ==============================

    public static double angle(List<Landmark> lm, double ar, int a, int b, int c) {
        double v1x = (lm.get(a).x() - lm.get(b).x()) * ar, v1y = lm.get(a).y() - lm.get(b).y();
        double v2x = (lm.get(c).x() - lm.get(b).x()) * ar, v2y = lm.get(c).y() - lm.get(b).y();
        double m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
        if (m1 == 0 || m2 == 0) return Double.NaN;
        double cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (m1 * m2)));
        return Math.toDegrees(Math.acos(cos));
    }

    static double dist(List<Landmark> lm, double ar, int a, int b) {
        return Math.hypot((lm.get(a).x() - lm.get(b).x()) * ar, lm.get(a).y() - lm.get(b).y());
    }

    static double torsoLength(List<Landmark> lm, double ar) {
        double t = (dist(lm, ar, 11, 23) + dist(lm, ar, 12, 24)) / 2;
        return t > 1e-6 ? t : 1;
    }

    private double poseConfidence(Map<Integer, Double> visibility) {
        Collection<Integer> keys = profile.landmarkMinVisibility().isEmpty() ? visibility.keySet() : profile.landmarkMinVisibility().keySet();
        return keys.stream().mapToDouble(k -> visibility.getOrDefault(k, 0.0)).average().orElse(0);
    }

    private boolean visible(List<Integer> points, Map<Integer, Double> visibility) {
        for (int i : points) if (visibility.getOrDefault(i, 0.0) < profile.minVisibility(i)) return false;
        return true;
    }

    private static boolean within(double v, Double lo, Double hi) {
        return (lo == null || v >= lo) && (hi == null || v <= hi);
    }
}
