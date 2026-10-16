package com.calishealth.api.engine.v2.progression;

import java.util.List;
import java.util.Map;

/** Kiểu dữ liệu của Progression Ladder (ASSESSMENT_FRAMEWORK_V2 §5). */
public final class ProgressionModels {
    private ProgressionModels() {}

    public record Stage(String code, int rank, String metric, double passValue, double targetValue, double baseScore, double spanScore) {}

    /** Cạnh tiên quyết: stage cần prerequisite. allowBypass = bỏ qua tiên quyết này. */
    public record Prerequisite(String stage, String prerequisite, boolean mandatory, boolean allowBypass) {}

    public record Ladder(String code, String competency, List<Stage> stages, List<Prerequisite> prerequisites) {}

    /** MEASURED = có số liệu tin cậy; NOT_TRIED = chưa thử/không có dụng cụ/không chắc; UNRELIABLE = có dữ liệu nhưng đo không tin cậy. */
    public enum Measurement { MEASURED, NOT_TRIED, UNRELIABLE }

    public record Observation(Measurement kind, Double value) {
        public static Observation measured(double value) { return new Observation(Measurement.MEASURED, value); }
        public static Observation notTried() { return new Observation(Measurement.NOT_TRIED, null); }
        public static Observation unreliable() { return new Observation(Measurement.UNRELIABLE, null); }
    }

    /** explicitNoneAchieved = user khai "đã thử nhưng chưa làm được bài nào" (bằng chứng tiêu cực TƯỜNG MINH). */
    public record LadderInput(Map<String, Observation> byStage, boolean explicitNoneAchieved) {}

    public enum StageStatus { PASS, FAIL, NOT_ASSESSED, UNRELIABLE, INFERRED_PASS, REJECTED_PREREQ }

    public enum EvidenceState { ACHIEVED, NONE_ACHIEVED, NO_EVIDENCE, UNRELIABLE }

    public record StageEvaluation(String stage, int rank, StageStatus status, String origin, Double value, String reasonCode) {}

    public record LadderResult(String ladder, String highestStage, Integer highestRank, Double stagePerformanceRatio, Double score,
                               EvidenceState state, List<StageEvaluation> stages) {}
}
