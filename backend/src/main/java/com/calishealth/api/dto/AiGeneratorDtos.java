package com.calishealth.api.dto;

import java.util.List;
import java.util.Map;

public class AiGeneratorDtos {

    // -------------------------------------------------------------
    // 1. EXERCISE GENERATOR DTOS
    // -------------------------------------------------------------
    public record GenerateExerciseRequest(
            String exerciseName,
            String category, // Strength, Skill, Mobility, etc.
            String difficulty, // Beginner, Intermediate, Advanced, Expert
            String targetMuscles,
            String specificGoal, // e.g., Hypertrophy, Joint Prehab, Strength
            List<String> existingExercises // For deduplication
    ) {}

    public record ExercisePhaseDto(
            int order,
            String name,
            String vietnameseName,
            String description,
            String coachingCue,
            String breathing,
            String muscleFocus
    ) {}

    public record MuscleTargetDto(
            String muscleCode,
            String muscleNameVi,
            String role, // PRIMARY, SECONDARY, STABILIZER
            String activationLevel, // LOW, MODERATE, HIGH, VERY_HIGH
            String userGuidance
    ) {}

    public record GenerateExerciseResponse(
            boolean success,
            String name,
            String displayName,
            String category,
            String difficulty,
            String movementPattern,
            List<String> equipment,
            String description,
            List<String> tags,
            List<ExercisePhaseDto> phases,
            List<MuscleTargetDto> muscleTargets,
            String setupInstructions,
            String executionInstructions,
            String tempo,
            List<String> coachingCues,
            List<Map<String, String>> commonMistakes, // name, problem, whyItHappens, correction
            List<String> safetyCues,
            String deduplicationNote,
            // ---- Bổ sung: AI sinh riêng cho từng động tác (trước đây frontend gán cứng) ----
            String inhaleTiming,
            String exhaleTiming,
            List<String> stopConditions,
            String contraindications,
            String generalConsiderations,
            TempoRuleDto tempoRule,
            String source,          // GEMINI | FALLBACK (dữ liệu mẫu khi Gemini lỗi)
            List<String> warnings   // các giá trị AI trả về bị loại/sửa khi kiểm tra
    ) {}

    public record TempoRuleDto(double eccentricSec, double pauseBottomSec, double concentricSec, double pauseTopSec, double toleranceSec) {}

    public record GeneratedRomRuleDto(
            String movementName,
            String metricType, // angle_degrees | depth_cm | height_percent
            double minROM,
            double maxROM,
            double tolerance,
            String unit,
            String description
    ) {}

    // -------------------------------------------------------------
    // 2. WORKOUT PLAN / ROADMAP GENERATOR DTOS
    // -------------------------------------------------------------
    public record GenerateWorkoutPlanRequest(
            String planGoal, // HYPERTROPHY, CALISTHENICS_SKILLS, PURE_STRENGTH, FAT_LOSS, ENDURANCE
            String targetLevel, // BEGINNER, INTERMEDIATE, ADVANCED
            int daysPerWeek, // 3, 4, 5, 6
            int totalWeeks, // 4, 8, 12
            String focusSkill, // e.g. "Muscle-up", "Front Lever", "Handstand"
            List<String> availableEquipment,
            List<String> existingPlanNames // For deduplication
    ) {}

    public record WorkoutExerciseItemDto(
            String exerciseName,
            int sets,
            String repsOrDuration,
            int restSeconds,
            String intensityNotes
    ) {}

    public record WorkoutDayPlanDto(
            int dayNumber,
            String dayTitle,
            String focusCategory,
            List<WorkoutExerciseItemDto> exercises
    ) {}

    public record GenerateWorkoutPlanResponse(
            boolean success,
            String planTitle,
            String targetGoal,
            String difficulty,
            int totalWeeks,
            int daysPerWeek,
            String description,
            List<String> weeklyScheduleOverview,
            List<WorkoutDayPlanDto> sampleWeekDays,
            List<String> progressionStrategy,
            String deduplicationNote,
            boolean isDuplicate,
            double similarityScore,
            String conflictingPlanName,
            String suggestedUniqueTitle
    ) {}

    public record ValidateWorkoutPlanRequest(
            String planName,
            String planGoal,
            String targetLevel,
            List<String> existingPlanNames
    ) {}

    public record ValidateWorkoutPlanResponse(
            boolean isDuplicate,
            double similarityScore,
            String conflictingPlanName,
            String message,
            String suggestedUniqueTitle
    ) {}

    // -------------------------------------------------------------
    // 3. PHYSICAL ASSESSMENT / EVALUATION SYSTEM DTOS
    // -------------------------------------------------------------
    public record GenerateAssessmentRequest(
            String assessmentName,
            String targetAudience, // GENERAL, REHAB, COMPETITION, SKILL_MASTERY
            String primaryMetric, // MAX_REPS, HOLD_TIME, FORM_SCORE, ROM_FLEXIBILITY
            List<String> existingAssessmentProtocols
    ) {}

    public record BenchmarkTierDto(
            String tierName, // ELITE, ADVANCED, INTERMEDIATE, BEGINNER
            String criteriaDescription,
            int minScore,
            int maxScore,
            String recommendedPlanAction
    ) {}

    public record AssessmentTestItemDto(
            String testExerciseName,
            String testProtocol,
            String timeLimitSec,
            String keyFormRequirements,
            String failureStopConditions
    ) {}

    public record GenerateAssessmentResponse(
            boolean success,
            String assessmentTitle,
            String description,
            String targetCategory,
            List<AssessmentTestItemDto> tests,
            List<BenchmarkTierDto> benchmarkTiers,
            List<String> penaltyDeductions, // No-rep penalty guidelines
            String deduplicationNote
    ) {}

    // -------------------------------------------------------------
    // 4. AI MOTION ANALYSIS & BIOMECHANICAL RULES GENERATOR DTOS
    // -------------------------------------------------------------
    public record GenerateMotionRulesRequest(
            String exerciseName,
            String movementPattern,
            String difficulty,
            List<String> existingJointRules, // Signatures already in form
            List<String> existingErrorRules // Error names already in form
    ) {}

    public record GeneratedJointRuleDto(
            String ruleRoleName,
            String measurement,
            String condition, // LESS_THAN, GREATER_THAN, BETWEEN
            double targetValue,
            Double secondaryValue,
            double tolerance,
            String action, // REP_COUNT_TRIGGER, FORM_CUE, WARNING, CRITICAL_STOP
            String voicePromptVi,
            String movementPhase
    ) {}

    public record GeneratedErrorRuleDto(
            String ruleName,
            String category, // Alignment, Joint Position, Range of Motion, Stability, Tempo
            String conditionDescription,
            String severity, // INFO, WARNING, CRITICAL
            String aiFeedbackVi,
            String correctionCueVi,
            boolean isInvalidRepPenalty
    ) {}

    public record GenerateMotionRulesResponse(
            boolean success,
            String exerciseName,
            List<Integer> recommendedLandmarkIds,
            String cameraAngleRequirement, // SIDE_45_DEGREE, SIDE_90_DEGREE, FRONT_VIEW
            int minBodyVisibilityPercent,
            List<GeneratedJointRuleDto> jointRules,
            List<GeneratedErrorRuleDto> errorRules,
            String deduplicationReport,
            List<GeneratedRomRuleDto> romRules,
            TempoRuleDto tempoRule,
            String source,          // GEMINI | FALLBACK
            List<String> warnings
    ) {}

    // -------------------------------------------------------------
    // 5. CLOUDINARY UPLOAD DTO
    // -------------------------------------------------------------
    public record MediaUploadResponse(
            boolean success,
            String secureUrl,
            String publicId,
            String resourceType, // image, video
            String format,
            long bytes,
            int width,
            int height,
            Double duration, // For videos
            String message
    ) {}
}
