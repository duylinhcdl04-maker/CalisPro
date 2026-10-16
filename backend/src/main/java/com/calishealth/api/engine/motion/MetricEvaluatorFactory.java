package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.*;

import static com.calishealth.api.engine.motion.MotionTypes.Operator.*;

/** Factory + các Strategy cho 14 loại chỉ số (ruleEniges §8, §26). */
public final class MetricEvaluatorFactory {
    private MetricEvaluatorFactory() {}

    private static final Map<MetricType, MetricEvaluator> EVALUATORS = new EnumMap<>(MetricType.class);

    static {
        register(new AngleEvaluator());
        register(new DistanceEvaluator());
        register(new RomEvaluator());
        register(new AlignmentEvaluator());
        register(new SymmetryEvaluator());
        register(new VelocityEvaluator(MetricType.VELOCITY, "BODY_RATIO_PER_SEC"));
        register(new VelocityEvaluator(MetricType.ACCELERATION, "BODY_RATIO_PER_SEC2"));
        register(new TempoEvaluator());
        register(new DurationEvaluator());
        register(new StabilityEvaluator());
        register(new ConfidenceEvaluator(MetricType.LANDMARK_VISIBILITY));
        register(new ConfidenceEvaluator(MetricType.POSE_CONFIDENCE));
        register(new RepEvaluator(MetricType.REP_SEQUENCE));
        register(new RepEvaluator(MetricType.REP_VALIDATION));
    }

    private static void register(MetricEvaluator e) { EVALUATORS.put(e.type(), e); }

    public static MetricEvaluator get(MetricType type) {
        MetricEvaluator e = EVALUATORS.get(type);
        if (e == null) throw new IllegalArgumentException("Chưa hỗ trợ metric type " + type);
        return e;
    }

    public static Collection<MetricEvaluator> all() { return EVALUATORS.values(); }

    // ============================== Cơ sở ==============================

    abstract static class Base implements MetricEvaluator {
        private final MetricType type;
        private final Set<Operator> operators;
        private final List<String> units;
        private final Timing timing;

        Base(MetricType type, Set<Operator> operators, List<String> units, Timing timing) {
            this.type = type; this.operators = operators; this.units = units; this.timing = timing;
        }

        @Override public MetricType type() { return type; }
        @Override public Set<Operator> operators() { return operators; }
        @Override public List<String> units() { return units; }
        @Override public Timing timing() { return timing; }

        @Override
        public Double value(Measurement m, String unit, MotionFeatures f) {
            Double raw = timing == Timing.REP
                    ? (f.completedRep() == null ? null : f.completedRep().values().get(m.featureKey()))
                    : f.values().get(m.featureKey());
            return raw == null ? null : convert(raw, unit);
        }

        /** Chuyển từ đơn vị gốc của FeatureEngine sang đơn vị của rule. */
        double convert(double raw, String unit) { return raw; }

        static void requirePoints(Measurement m, int n, String label, List<String> e) {
            if (m.points().size() != n) e.add(label + " cần đúng " + n + " landmark (" + m.points().size() + " đã chọn).");
            else if (new HashSet<>(m.points()).size() != n) e.add(label + ": các landmark phải khác nhau.");
        }
    }

    // ============================== Strategy ==============================

    static final class AngleEvaluator extends Base {
        AngleEvaluator() { super(MetricType.ANGLE_3_POINT, EnumSet.of(BETWEEN, OUTSIDE, LESS_THAN, LESS_THAN_OR_EQUAL, GREATER_THAN,
                GREATER_THAN_OR_EQUAL, DEVIATION_FROM_TARGET, MINIMUM_REQUIRED, MAXIMUM_ALLOWED), List.of("DEGREE", "RADIAN"), Timing.FRAME); }
        @Override public List<String> validateMeasurement(Measurement m) { List<String> e = new ArrayList<>(); requirePoints(m, 3, "Góc 3 điểm (A, B đỉnh, C)", e); return e; }
        @Override double convert(double raw, String unit) { return "RADIAN".equals(unit) ? Math.toRadians(raw) : raw; }
    }

    static final class DistanceEvaluator extends Base {
        DistanceEvaluator() { super(MetricType.DISTANCE, EnumSet.of(BETWEEN, LESS_THAN, LESS_THAN_OR_EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL,
                MINIMUM_REQUIRED, MAXIMUM_ALLOWED, DEVIATION_FROM_TARGET), List.of("BODY_RATIO", "PERCENT_BODY"), Timing.FRAME); }
        @Override public List<String> validateMeasurement(Measurement m) { List<String> e = new ArrayList<>(); requirePoints(m, 2, "Khoảng cách (A, B)", e); return e; }
        @Override double convert(double raw, String unit) { return "PERCENT_BODY".equals(unit) ? raw * 100 : raw; }
    }

    static final class RomEvaluator extends Base {
        RomEvaluator() { super(MetricType.ROM, EnumSet.of(MINIMUM_REQUIRED, BETWEEN, GREATER_THAN_OR_EQUAL), List.of("DEGREE"), Timing.REP); }
        @Override public List<String> validateMeasurement(Measurement m) { List<String> e = new ArrayList<>(); requirePoints(m, 3, "Biên độ khớp (A, B khớp, C)", e); return e; }
    }

    static final class AlignmentEvaluator extends Base {
        AlignmentEvaluator() { super(MetricType.ALIGNMENT, EnumSet.of(MAXIMUM_ALLOWED, LESS_THAN, LESS_THAN_OR_EQUAL, BETWEEN, DEVIATION_FROM_TARGET),
                List.of("DEGREE"), Timing.FRAME); }
        @Override public List<String> validateMeasurement(Measurement m) {
            List<String> e = new ArrayList<>();
            String method = m.method() == null ? "COLLINEARITY" : m.method();
            switch (method) {
                case "COLLINEARITY" -> { if (m.points().size() < 3) e.add("Căn thẳng (collinearity) cần ≥ 3 landmark theo thứ tự trên cơ thể."); }
                case "AXIS_DEVIATION" -> {
                    requirePoints(m, 2, "Lệch trục (đoạn A → B)", e);
                    if (!"VERTICAL".equals(m.axis()) && !"HORIZONTAL".equals(m.axis())) e.add("Lệch trục cần trục tham chiếu VERTICAL hoặc HORIZONTAL.");
                }
                default -> e.add("Phương pháp căn thẳng phải là COLLINEARITY hoặc AXIS_DEVIATION.");
            }
            return e;
        }
    }

    static final class SymmetryEvaluator extends Base {
        SymmetryEvaluator() { super(MetricType.SYMMETRY, EnumSet.of(MAXIMUM_ALLOWED, LESS_THAN, LESS_THAN_OR_EQUAL), List.of("DEGREE"), Timing.FRAME); }
        @Override public List<String> validateMeasurement(Measurement m) {
            List<String> e = new ArrayList<>();
            requirePoints(m, 3, "Đối xứng - góc bên trái", e);
            if (m.pointsRight().size() != 3) e.add("Đối xứng - góc bên phải cần đúng 3 landmark.");
            return e;
        }
    }

    static final class VelocityEvaluator extends Base {
        VelocityEvaluator(MetricType t, String unit) { super(t, EnumSet.of(MAXIMUM_ALLOWED, BETWEEN, LESS_THAN, MINIMUM_REQUIRED), List.of(unit), Timing.FRAME); }
        @Override public List<String> validateMeasurement(Measurement m) {
            List<String> e = new ArrayList<>();
            requirePoints(m, 1, "Vận tốc/gia tốc của landmark", e);
            if (m.axis() != null && !List.of("VERTICAL", "HORIZONTAL", "ANY").contains(m.axis())) e.add("Trục phải là VERTICAL, HORIZONTAL hoặc ANY.");
            return e;
        }
    }

    static final class TempoEvaluator extends Base {
        TempoEvaluator() { super(MetricType.TEMPO, EnumSet.of(BETWEEN, MINIMUM_REQUIRED, MAXIMUM_ALLOWED), List.of("SECOND", "MILLISECOND"), Timing.REP); }
        @Override public List<String> validateMeasurement(Measurement m) {
            List<String> e = new ArrayList<>();
            if (m.phase() == null || m.phase().isBlank()) e.add("Nhịp (tempo) cần chọn pha được đo thời lượng (vd. DESCENDING).");
            return e;
        }
        @Override double convert(double raw, String unit) { return "MILLISECOND".equals(unit) ? raw * 1000 : raw; }
    }

    static final class DurationEvaluator extends Base {
        DurationEvaluator() { super(MetricType.DURATION, EnumSet.of(MINIMUM_REQUIRED, MAXIMUM_ALLOWED, BETWEEN), List.of("SECOND", "MILLISECOND"), Timing.FRAME); }
        @Override public List<String> validateMeasurement(Measurement m) {
            List<String> e = new ArrayList<>();
            if (m.phase() == null || m.phase().isBlank()) e.add("Thời gian giữ cần chọn pha (thường là HOLD).");
            return e;
        }
        @Override double convert(double raw, String unit) { return "MILLISECOND".equals(unit) ? raw * 1000 : raw; }
    }

    static final class StabilityEvaluator extends Base {
        StabilityEvaluator() { super(MetricType.STABILITY, EnumSet.of(MAXIMUM_ALLOWED, LESS_THAN, LESS_THAN_OR_EQUAL), List.of("BODY_RATIO"), Timing.FRAME); }
        @Override public List<String> validateMeasurement(Measurement m) {
            List<String> e = new ArrayList<>();
            requirePoints(m, 1, "Độ ổn định của landmark", e);
            if (m.windowFrames() != null && (m.windowFrames() < 3 || m.windowFrames() > 120)) e.add("Cửa sổ ổn định phải từ 3 đến 120 khung.");
            return e;
        }
    }

    static final class ConfidenceEvaluator extends Base {
        ConfidenceEvaluator(MetricType t) { super(t, EnumSet.of(MINIMUM_REQUIRED, GREATER_THAN_OR_EQUAL), List.of("RATIO", "PERCENT"), Timing.FRAME); }
        @Override public List<String> validateMeasurement(Measurement m) {
            List<String> e = new ArrayList<>();
            if (type() == MetricType.LANDMARK_VISIBILITY && m.points().isEmpty()) e.add("Cần chọn ít nhất 1 landmark để kiểm tra độ hiển thị.");
            if (type() == MetricType.POSE_CONFIDENCE && !m.points().isEmpty()) e.add("Độ tin cậy tư thế không dùng landmark riêng.");
            return e;
        }
        @Override double convert(double raw, String unit) { return "PERCENT".equals(unit) ? raw * 100 : raw; }
        @Override public boolean measuresReliability() { return true; }
    }

    static final class RepEvaluator extends Base {
        RepEvaluator(MetricType t) { super(t, EnumSet.of(EQUAL), List.of("BOOLEAN"), Timing.REP); }
        @Override public List<String> validateMeasurement(Measurement m) { return List.of(); }
    }
}
