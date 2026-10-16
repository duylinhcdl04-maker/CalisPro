package com.calishealth.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** DTO của Motion Rule Engine (MOTION_RULE_ENGINE_DESIGN.md §10). */
public final class MotionDtos {
    private MotionDtos() {}

    // ============================== Catalog ==============================

    public record MetricTypeDto(String type, String timing, List<String> operators, List<String> units, String measurementHint,
                                boolean reliabilityMetric) {}

    public record LandmarkDto(int index, String code, String name) {}

    public record CatalogDto(List<MetricTypeDto> metricTypes, List<LandmarkDto> landmarks, List<String> severities,
                             List<String> sourceTypes, List<String> cameraViews, List<String> statuses,
                             Map<String, Integer> qualityPenalties) {}

    // ============================== Profile ==============================

    public record MeasurementDto(List<Integer> points, List<Integer> pointsRight, String method, String axis, String phase,
                                 Integer windowFrames) {}

    public record PhaseDto(Long id, String code, String name, String description, int sortOrder) {}

    public record ProfileSummaryDto(Long id, Long exerciseId, String exerciseName, String profileName, String version,
                                    String status, String cameraView, String movementType, int publishedRules, int draftRules) {}

    public record ProfileDto(Long id, Long exerciseId, String exerciseName, String profileName, String version, String status,
                             String cameraView, String movementType, MeasurementDto repMetric,
                             Double repTopThreshold, Double repBottomThreshold, String repDirection,
                             Integer debounceTimeMs, Integer minRepDurationMs, Integer maxRepDurationMs,
                             Double minPoseConfidence, Double minLandmarkVisibility,
                             boolean voiceWarningEnabled, boolean textWarningEnabled, List<PhaseDto> phases,
                             List<String> issues) {}

    public record ProfileUpsertRequest(String profileName, String cameraView, String movementType, MeasurementDto repMetric,
                                       Double repTopThreshold, Double repBottomThreshold,
                                       String repDirection, Integer debounceTimeMs, Integer minRepDurationMs,
                                       Integer maxRepDurationMs, Double minPoseConfidence, Double minLandmarkVisibility,
                                       Boolean voiceWarningEnabled, Boolean textWarningEnabled, String version) {}

    public record PhaseUpdateRequest(String code, String name, String description) {}

    // ============================== Rule ==============================

    public record BandDto(String severity, Double min, Double max, Boolean minInclusive, Boolean maxInclusive) {}

    public record LegacyDto(String metricType, String operator, Double thresholdMin, Double thresholdMax, String feedbackMessage,
                            String voicePrompt) {}

    public record RuleDto(Long id, Long profileId, String code, int version, String name, String description, String status,
                          String phase, String metricType, MeasurementDto measurement, String unit, String operator,
                          Double target, Double normalMin, Double normalMax, boolean normalMinInclusive, boolean normalMaxInclusive,
                          List<BandDto> bands, String severity, int priority, boolean invalidRep, String invalidRepMinSeverity,
                          boolean stopExercise, String persistenceType, int persistenceValue, long cooldownMs,
                          long evaluationIntervalMs, String feedbackCode, String cameraView, String sourceType,
                          String sourceReference, String changeNote, Long previousVersionId, String expected,
                          String createdBy, String updatedBy, String submittedBy, Instant submittedAt, String approvedBy,
                          Instant approvedAt, Instant lastTestedAt, Instant updatedAt, boolean testedSinceLastChange,
                          List<String> errors, List<String> warnings, LegacyDto legacy) {}

    public record RuleUpsertRequest(String code, String name, String description, String phase, String metricType,
                                    MeasurementDto measurement, String unit, String operator, Double target,
                                    Double normalMin, Double normalMax, Boolean normalMinInclusive, Boolean normalMaxInclusive,
                                    List<BandDto> bands, String severity, Integer priority, Boolean invalidRep,
                                    String invalidRepMinSeverity, Boolean stopExercise, String persistenceType,
                                    Integer persistenceValue, Long cooldownMs, Long evaluationIntervalMs, String feedbackCode,
                                    String cameraView, String sourceType, String sourceReference, String changeNote) {}

    public record WorkflowRequest(String note) {}

    public record RuleVersionDto(Long id, int version, String status, String changeNote, String updatedBy, Instant updatedAt,
                                 String approvedBy, Instant approvedAt) {}

    public record AuditDto(Long id, String action, String userEmail, String reason, String oldValue, String newValue,
                           Instant createdAt) {}

    // ============================== Rule Tester ==============================

    /** value: thử một giá trị; samples: phát lại chuỗi (t ms, giá trị) để kiểm tra persistence/cooldown. */
    public record RuleTestRequest(Double value, List<TestSample> samples) {}

    public record TestSample(long t, Double value) {}

    public record TestStepDto(long t, Double observed, Double evaluated, String status, String confirmedSeverity,
                              boolean violationFired, boolean feedbackSpoken, String note) {}

    public record RuleTestResponse(String status, Double observed, Double evaluated, String expected, String band,
                                   String feedbackCode, String uiText, String voiceText, boolean invalidRep,
                                   boolean stopExercise, List<TestStepDto> steps, List<String> errors, List<String> warnings) {}

    // ============================== Feedback template ==============================

    public record FeedbackTemplateDto(Long id, Long profileId, String feedbackCode, String language, String uiText,
                                      String voiceText, boolean active, String audioStatus, String audioUrl,
                                      List<String> usedByRules, Instant updatedAt) {}

    public record FeedbackTemplateRequest(String feedbackCode, String language, String uiText, String voiceText, Boolean active) {}

    // ============================== AI tự soạn rule ==============================

    /** count: số rule tối đa muốn AI đề xuất (1-8, mặc định 5). focus: trọng tâm tùy chọn (vd. "an toàn khớp vai", "biên độ"). */
    public record GenerateRulesRequest(Integer count, String focus) {}

    /** status: CREATED (đã lưu bản nháp) | DUPLICATE (trùng rule đã có) | INVALID (không hợp lệ theo bộ kiểm tra của engine). */
    public record GeneratedRuleOutcome(String status, String code, String name, String reason, List<String> errors, Long ruleId, String rationale) {}

    public record GenerateRulesResponse(boolean aiAvailable, String message, int created, int duplicates, int invalid, List<GeneratedRuleOutcome> outcomes) {}

    public record PromptPreviewDto(String version, String prompt) {}

    // ============================== Runtime ==============================

    public record StartMotionSessionRequest(Long exerciseId, Long profileId, String context, String cameraView,
                                            Long assessmentSessionId, Long testItemId, Long workoutSessionId) {}

    public record StartMotionSessionResponse(String sessionId, Long profileId, String profileVersion, String cameraView,
                                             String movementType, int activeRules, List<String> requiredLandmarkHint,
                                             long recommendedBatchMs, List<String> warnings) {}

    /** l: 33 landmark [x, y, z, visibility] (đã chuẩn hoá 0..1); không gửi video. */
    public record FrameDto(long t, List<double[]> l) {}

    public record FrameBatchRequest(List<FrameDto> frames, Double aspectRatio) {}

    public record FeedbackOutDto(String mode, String feedbackCode, String severity, String uiText, String voiceText,
                                 String audioUrl, boolean needsTts, List<String> relatedCodes, String ruleCode,
                                 int ruleVersion, Double observed, String expected) {}

    public record RepOutDto(int repNumber, boolean complete, boolean valid, int qualityScore, List<String> violationCodes) {}

    public record FrameBatchResponse(String phase, int repCount, int validReps, String measurementStatus,
                                     List<FeedbackOutDto> feedback, List<RepOutDto> completedReps, boolean stopRequested,
                                     String stopReason) {}

    public record FinishMotionSessionResponse(String sessionId, int totalReps, int validReps, int invalidReps, int qualityScore,
                                              double holdSec, double romAvg, int criticalCount, double poseConfidenceAvg,
                                              double visibilityAvg, double trackedRatio, Map<String, Integer> violationCounts,
                                              List<RepOutDto> reps, String reliability, Object assessmentResult) {}
}
