package com.calishealth.api.engine.motion;

import java.util.*;

/**
 * Kiểu dữ liệu của Motion Rule Engine (thuần, không phụ thuộc DB/Spring).
 * Ranh giới trách nhiệm (MOTION_RULE_ENGINE_DESIGN.md):
 *   MediaPipe -> landmark; FeatureEngine -> giá trị đo; Rule Engine -> đạt/không theo cấu hình; Aggregator -> phản hồi nào.
 */
public final class MotionTypes {
    private MotionTypes() {}

    // ============================== Enum ==============================

    public enum MetricType {
        ANGLE_3_POINT, DISTANCE, ROM, ALIGNMENT, SYMMETRY, VELOCITY, ACCELERATION, TEMPO, DURATION, STABILITY,
        LANDMARK_VISIBILITY, POSE_CONFIDENCE, REP_SEQUENCE, REP_VALIDATION
    }

    public enum Operator {
        EQUAL, NOT_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL, BETWEEN, OUTSIDE,
        DEVIATION_FROM_TARGET, MINIMUM_REQUIRED, MAXIMUM_ALLOWED
    }

    /** Mức độ cấu hình được (theo thứ tự tăng dần). */
    public enum Severity { INFO, WARNING, ERROR, CRITICAL }

    /** Kết quả phân loại một giá trị đo. */
    public enum Status { NORMAL, INFO, WARNING, ERROR, CRITICAL, UNCLASSIFIED, UNRELIABLE, SKIPPED;
        public static Status of(Severity s) { return Status.valueOf(s.name()); }
        public Severity severity() {
            return switch (this) { case INFO -> Severity.INFO; case WARNING -> Severity.WARNING; case ERROR -> Severity.ERROR;
                case CRITICAL -> Severity.CRITICAL; default -> null; };
        }
    }

    public enum PersistenceType { FRAME, TIME }

    /** Thời điểm xét rule: mỗi khung hình, hoặc một lần khi kết thúc rep. */
    public enum Timing { FRAME, REP }

    // ============================== Đầu vào ==============================

    public record Landmark(double x, double y, double z, double visibility) {}

    /** Một khung từ MediaPipe Pose (33 landmark chuẩn hoá 0..1). aspectRatio = width/height để góc không bị méo. */
    public record PoseFrame(long timestampMs, List<Landmark> landmarks, double aspectRatio) {
        public boolean detected() { return landmarks != null && landmarks.size() >= 33; }
    }

    /**
     * Định nghĩa phép đo (phụ thuộc metric type):
     *  points      : ANGLE_3_POINT/ROM/SYMMETRY-trái (A,B,C), DISTANCE (A,B), ALIGNMENT (≥3 hoặc A,B + axis),
     *                VELOCITY/ACCELERATION/STABILITY (1 landmark), LANDMARK_VISIBILITY (tập landmark)
     *  pointsRight : SYMMETRY - góc phía phải (A',B',C')
     *  method      : ALIGNMENT - COLLINEARITY | AXIS_DEVIATION
     *  axis        : VERTICAL | HORIZONTAL | ANY
     *  phase       : TEMPO/DURATION - pha được đo thời lượng
     *  windowFrames: STABILITY - số khung của cửa sổ
     */
    public record Measurement(MetricType type, List<Integer> points, List<Integer> pointsRight, String method, String axis,
                              String phase, Integer windowFrames) {
        public Measurement {
            points = points == null ? List.of() : List.copyOf(points);
            pointsRight = pointsRight == null ? List.of() : List.copyOf(pointsRight);
        }

        public static Measurement angle(int a, int b, int c) {
            return new Measurement(MetricType.ANGLE_3_POINT, List.of(a, b, c), null, null, null, null, null);
        }

        /** Khoá ổn định của giá trị trong MotionFeatures (cùng phép đo -> cùng khoá, chỉ tính một lần). */
        public String featureKey() {
            StringBuilder sb = new StringBuilder(type.name());
            if (!points.isEmpty()) sb.append(':').append(join(points));
            if (!pointsRight.isEmpty()) sb.append('|').append(join(pointsRight));
            if (method != null) sb.append('#').append(method);
            if (axis != null) sb.append('@').append(axis);
            if (phase != null) sb.append('~').append(phase);
            if (windowFrames != null) sb.append('w').append(windowFrames);
            return sb.toString();
        }

        /** Landmark cần nhìn thấy để phép đo đáng tin cậy. */
        public Set<Integer> requiredLandmarks() {
            Set<Integer> s = new LinkedHashSet<>(points);
            s.addAll(pointsRight);
            return s;
        }

        private static String join(List<Integer> l) {
            StringJoiner j = new StringJoiner("-");
            l.forEach(i -> j.add(String.valueOf(i)));
            return j.toString();
        }
    }

    /** Một dải mức độ tường minh; null = mở. */
    public record Band(Severity severity, Double min, Double max, boolean minInclusive, boolean maxInclusive) {
        public boolean contains(double v) {
            boolean lo = min == null || (minInclusive ? v >= min : v > min);
            boolean hi = max == null || (maxInclusive ? v <= max : v < max);
            return lo && hi;
        }
    }

    public record RuleDef(
            long id, String code, int version, String name, String status,
            String phase,                    // ALL hoặc mã pha
            Measurement measurement, String unit, Operator operator,
            Double target, Double normalMin, Double normalMax, boolean normalMinInclusive, boolean normalMaxInclusive,
            List<Band> bands,
            Severity severity,               // mức khi không có dải (rule rời rạc / một phía không chia dải)
            int priority, boolean invalidRep, Severity invalidRepMinSeverity, boolean stopExercise,
            PersistenceType persistenceType, int persistenceValue, long cooldownMs, long evaluationIntervalMs,
            String feedbackCode, String cameraView
    ) {
        public RuleDef {
            bands = bands == null ? List.of() : List.copyOf(bands);
        }

        /** Rep bị đánh không hợp lệ khi vi phạm đạt mức này trở lên (null = mọi mức, đúng ngữ nghĩa invalidRep gốc). */
        public boolean invalidatesRep(Severity s) {
            return invalidRep && (invalidRepMinSeverity == null || s.ordinal() >= invalidRepMinSeverity.ordinal());
        }

        public boolean appliesToPhase(String p) { return phase == null || "ALL".equals(phase) || phase.equals(p); }
    }

    public record ProfileDef(
            long id, String version, String cameraView,
            String movementType,             // REPS | HOLD
            Measurement repMetric, Double repTop, Double repBottom, String repDirection,
            long debounceMs, long minRepMs, long maxRepMs,
            double minPoseConfidence, double minLandmarkVisibility, Map<Integer, Double> landmarkMinVisibility
    ) {
        public ProfileDef {
            landmarkMinVisibility = landmarkMinVisibility == null ? Map.of() : Map.copyOf(landmarkMinVisibility);
        }

        public double minVisibility(int landmark) { return landmarkMinVisibility.getOrDefault(landmark, minLandmarkVisibility); }
    }

    // ============================== Feature Engine output ==============================

    public record RepSummary(int repNumber, long startMs, long endMs, boolean complete, Map<String, Double> values,
                             List<String> phaseSequence) {
        public long durationMs() { return endMs - startMs; }
    }

    public record MotionFeatures(long timestampMs, String phase, int repNumber, boolean poseDetected, double poseConfidence,
                                 Map<String, Double> values, Map<Integer, Double> visibility, RepSummary completedRep) {}

    // ============================== Kết quả đánh giá ==============================

    public record Classification(Status status, double observedValue, double evaluatedValue, Band band) {}

    public record RuleResult(RuleDef rule, Status status, Double observedValue, Double evaluatedValue, String reason) {}

    /** Vi phạm đã vượt persistence - đối tượng duy nhất được phép đi tiếp tới phản hồi / Gemini. */
    public record Violation(
            long ruleId, String ruleCode, int ruleVersion, String ruleName, Severity severity, int priority,
            MetricType metricType, double observedValue, double evaluatedValue, String unit,
            Double targetValue, Double normalMin, Double normalMax, String expected,
            String feedbackCode, boolean invalidRep, boolean stopExercise, String phase, long timestampMs, int repNumber
    ) {}

    public enum FeedbackMode { NONE, SIMPLE, COMBINED }

    public record FeedbackDecision(FeedbackMode mode, Violation primary, List<Violation> related, List<String> suppressedByCooldown) {
        public static FeedbackDecision none(List<String> suppressed) { return new FeedbackDecision(FeedbackMode.NONE, null, List.of(), suppressed); }
    }

    public record RepResult(int repNumber, long startMs, long endMs, boolean complete, boolean valid, int qualityScore,
                            List<String> violationCodes, Map<String, Double> metrics) {}

    public record FrameEvaluation(long timestampMs, String phase, int repNumber, String measurementStatus,
                                  List<RuleResult> results, List<Violation> violations, List<Violation> newViolations,
                                  FeedbackDecision feedback, RepResult completedRep, boolean stopRequested) {}

    public record SessionSummary(int totalReps, int validReps, int invalidReps, int qualityScore, double poseConfidenceAvg,
                                 double visibilityAvg, double trackedRatio, double holdSec, double romAvg, int criticalCount,
                                 Map<String, Integer> violationCounts, List<RepResult> reps, int frames) {}
}
