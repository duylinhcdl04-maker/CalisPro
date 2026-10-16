package com.calishealth.api.engine.level;

import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Kiểu dữ liệu vào/ra của Level Evaluation Engine. */
public final class LevelModels {
    private LevelModels() {}

    public static final String PASS = "PASS", FAIL = "FAIL", NA = "N/A";

    public static final String PROVISIONAL_ASSIGNED = "PROVISIONAL_ASSIGNED", PROMOTED = "PROMOTED",
            MAINTAINED = "MAINTAINED", REGRESSED = "REGRESSED", RETEST_REQUIRED = "RETEST_REQUIRED";

    public static final String G_RELIABILITY = "RELIABILITY", G_PERFORMANCE = "PERFORMANCE", G_QUALITY = "QUALITY",
            G_COMPETENCY = "COMPETENCY", G_SKILL = "SKILL", G_STABILITY = "STABILITY", G_DECISION = "DECISION";

    /** Kết quả đo của một bài test (đã qua Rule Engine). value() theo metric của bài. */
    public record TestOutcome(Long exerciseId, String exerciseCode, String competency, String metric,
                              Integer totalReps, Integer validReps, Double holdSec, Double angleDeg,
                              Double formScore, Double romScore, Integer majorViolations,
                              Double poseConfidence, Double visibility, Double visibilityRequired, Double trackedRatio,
                              double reliability, String source, String status, boolean mandatory) {
        public Double value() {
            return switch (metric) {
                case "HOLD_SEC" -> holdSec;
                case "ANGLE_DEG" -> angleDeg;
                default -> validReps == null ? null : validReps.doubleValue();
            };
        }

        public Double validRatio() {
            if (validReps == null || totalReps == null || totalReps <= 0) return null;
            return validReps / (double) totalReps;
        }

        public boolean valid() { return "VALID".equals(status); }
    }

    public record PreviousEvaluation(String candidateLevel, String competencyGate, String decision, Instant at) {}

    /** Thành tích tốt nhất của một bài trong một buổi tập (form từ MediaPipe nếu có). */
    public record TrainingObservation(Long exerciseId, Instant at, double bestValue, Double formScore) {}

    public record Reason(String gate, String code, String competency, String exerciseCode,
                         Double required, Double actual, boolean passed, String message) {}

    public record GateResult(String gate, String status, List<Reason> reasons) {
        public boolean pass() { return PASS.equals(status); }
    }

    public record LevelContext(
            String currentLevel,
            String status,                       // PROVISIONAL | VERIFIED | RETURNING
            Double previousEwma,
            int consecutiveBelow,
            Map<String, CompetencyResult> competencies,
            Double overall,
            List<TestOutcome> tests,
            Map<Long, String> nodeStatus,        // exerciseId -> trạng thái node của user
            Map<Long, Set<Long>> harderEquivalents, // exerciseId -> các bài khó hơn trong cùng chuỗi tiến trình
            PreviousEvaluation previous,
            List<TrainingObservation> training,
            boolean baseline,
            boolean coachVerified,
            boolean recentIllness,
            Instant now
    ) {}

    public record Outcome(
            String previousLevel,
            String candidateLevel,
            String finalLevel,
            Double overall,
            Double ewma,
            Map<String, GateResult> gates,
            String decision,
            List<Reason> reasons,
            int consecutiveBelow,
            String newStatus,
            boolean calibration,
            boolean fastTrack
    ) {
        public String gate(String name) {
            GateResult g = gates.get(name);
            return g == null ? null : g.status();
        }
    }
}
