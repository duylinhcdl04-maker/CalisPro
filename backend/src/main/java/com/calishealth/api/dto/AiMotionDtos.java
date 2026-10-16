package com.calishealth.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class AiMotionDtos {
    private AiMotionDtos() {}

    public record AiProfileDto(
            Long id,
            Long exerciseId,
            String exerciseName,
            String profileName,
            String poseModel,
            String trackingMode,
            boolean analysisEnabled,
            boolean repCountingEnabled,
            boolean formAnalysisEnabled,
            boolean voiceWarningEnabled,
            boolean textWarningEnabled,
            String version,
            String status,
            String repStartCondition,
            String repDownCondition,
            String repUpCondition,
            Integer minRepDurationMs,
            Integer maxRepDurationMs,
            Integer debounceTimeMs,
            Double minRomPercentage,
            List<LandmarkRequirementDto> landmarks,
            List<MotionRuleDto> rules,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record SaveAiProfileRequest(
            String profileName,
            String poseModel,
            String trackingMode,
            Boolean analysisEnabled,
            Boolean repCountingEnabled,
            Boolean formAnalysisEnabled,
            Boolean voiceWarningEnabled,
            Boolean textWarningEnabled,
            String version,
            String status,
            String repStartCondition,
            String repDownCondition,
            String repUpCondition,
            Integer minRepDurationMs,
            Integer maxRepDurationMs,
            Integer debounceTimeMs,
            Double minRomPercentage,
            List<LandmarkRequirementDto> landmarks,
            List<MotionRuleDto> rules
    ) {}

    public record LandmarkRequirementDto(
            Long id,
            String landmarkName,
            Integer landmarkIndex,
            boolean required,
            Double minVisibility,
            String side
    ) {}

    public record MotionRuleDto(
            Long id,
            String ruleCode,
            String ruleName,
            String ruleType,
            String metricType,
            String operator,
            Double thresholdMin,
            Double thresholdMax,
            Double warningThreshold,
            Double criticalThreshold,
            String severity,
            boolean invalidRep,
            boolean enabled,
            int priority,
            String feedbackMessage,
            String voicePrompt
    ) {}

    public record VoiceConfigDto(
            Long id,
            String name,
            String provider,
            String model,
            String apiKey,
            boolean hasApiKey,
            String geminiApiKey,
            String geminiApiKeyMasked,
            String viettelToken,
            String viettelTokenMasked,
            String language,
            String voiceName,
            Double speed,
            Double pitch,
            boolean enabled
    ) {}

    public record SaveVoiceConfigRequest(
            String provider,
            String model,
            String apiKey,
            String geminiApiKey,
            String viettelToken,
            String language,
            String voiceName,
            Double speed,
            Double pitch,
            Boolean enabled
    ) {}

    public record TestVoiceRequest(
            String text,
            String promptText,
            String provider,
            String apiKey,
            String voiceName,
            Double speed
    ) {
        public String effectiveText() {
            if (text != null && !text.isBlank()) return text;
            if (promptText != null && !promptText.isBlank()) return promptText;
            return "Khép bớt khuỷu tay lại, giữ thẳng lưng!";
        }
    }

    public record TestVoiceResponse(
            boolean success,
            String audioUrl,
            String audioBase64,
            String message,
            long latencyMs,
            boolean cacheHit
    ) {
        public TestVoiceResponse(boolean success, String audioUrl, String message, long latencyMs, boolean cacheHit) {
            this(success, audioUrl, null, message, latencyMs, cacheHit);
        }
    }

    public record EvaluateMotionRequest(
            Long profileId,
            Map<String, Double> metrics,
            Map<String, Object> rawLandmarks
    ) {}

    public record RuleEvaluationResult(
            String ruleCode,
            String ruleName,
            String metricType,
            Double actualValue,
            String expectedRange,
            boolean passed,
            String severity,
            boolean invalidRep,
            String feedbackMessage,
            String voicePrompt
    ) {}

    public record EvaluateMotionResponse(
            boolean passed,
            String overallStatus, // PASS, WARNING, ERROR, CRITICAL
            int score,
            List<RuleEvaluationResult> ruleResults,
            List<String> textWarnings,
            String prioritizedVoiceWarning,
            String audioUrl,
            long processingTimeMs
    ) {}

    public record AiSystemStatsResponse(
            double modelAccuracy,
            int avgLatencyMs,
            long formErrorsDetected,
            double recommendationAcceptanceRate,
            int activeProfilesCount,
            int totalRulesCount,
            long audioCacheCount
    ) {}

    public record VersionSnapshotDto(
            Long id,
            String versionNumber,
            String status,
            String createdBy,
            String approvedBy,
            String changeSummary,
            Instant createdAt,
            Instant publishedAt
    ) {}
}
