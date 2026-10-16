package com.calishealth.api.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** DTO của Level Engine: năng lực, level, skill tree, chu kỳ tập, đánh giá định kỳ, cấu hình admin. */
public final class LevelEngineDtos {
    private LevelEngineDtos() {}

    // ============================== Trạng thái thể lực ==============================

    public record LevelDto(String code, String name, String description, String status, String source) {}

    public record CompetencyDto(String code, String name, Double score, Double observation, String band, double confidence,
                                String trend, String source, String dataQuality) {}

    /** Phần kết quả Level Engine gắn vào kết quả bài test đầu vào. */
    public record EngineResultDto(LevelDto level, Double overallScore, String dataQuality, double confidence,
                                  List<CompetencyDto> competencies, List<String> warnings, String explanation,
                                  String cycleId, String cycleName) {}

    public record ReasonDto(String gate, String code, String competency, String exerciseCode, Double required, Double actual,
                            boolean passed, String message) {}

    public record EvaluationDto(String id, String assessmentSessionId, String previousLevel, String candidateLevel, String finalLevel,
                                Double overallScore, Double ewmaOverall, Map<String, String> gates, String decision,
                                List<ReasonDto> reasons, String explanation, String ruleSet, String algorithmVersion,
                                String coachOverrideId, Instant createdAt) {}

    public record ConstraintsDto(int daysPerWeek, int sessionMinutes, List<String> equipment, List<String> limitations,
                                 boolean screeningFlag, String environment) {}

    public record UpdateConstraintsRequest(Integer daysPerWeek, Integer sessionMinutes, List<String> equipment,
                                           List<String> limitations, String environment, Boolean regenerate) {}

    public record FitnessStateDto(LevelDto level, Double overallScore, Double ewmaOverall, List<CompetencyDto> competencies,
                                  String weakestCompetency, LocalDate nextAssessmentDue, boolean assessmentDue,
                                  boolean baselineRecommended, EvaluationDto lastEvaluation, ConstraintsDto constraints,
                                  String primaryGoal, String activeCycleId) {}

    // ============================== Skill tree ==============================

    public record SkillNodeDto(String exerciseId, String code, String name, String competency, String status, Double bestValue,
                               Double bestFormScore, int qualifyingSessions, String criteriaMetric, Double criteriaValue,
                               List<String> prerequisites) {}

    public record GapDto(String exerciseId, String exerciseCode, String competency, double required, double current,
                         double deficit, double priority, String kind, String message) {}

    public record ReadinessDto(String goalCode, String targetExerciseId, String targetCode, String status, double percent,
                               List<GapDto> missing) {}

    public record SkillTreeDto(List<SkillNodeDto> nodes, ReadinessDto goalReadiness, List<GapDto> gaps) {}

    // ============================== Chu kỳ tập ==============================

    public record CycleExerciseDto(String id, String exerciseId, String exerciseCode, String exerciseName, String thumbnailUrl,
                                   String section, Integer sets, Integer repMin, Integer repMax, Integer holdSec, Integer restSec,
                                   Double rpe, String tempo, String notes, String templateExerciseId, String selectionReason) {}

    public record CycleDayDto(String id, int dayNumber, Integer weekNumber, String name, String focus, boolean restDay,
                              boolean deload, Integer estimatedMinutes, List<CycleExerciseDto> exercises) {}

    public record CycleDto(String planId, Integer cycleNumber, String name, String description, String status, String levelCode,
                           LocalDate startDate, LocalDate endDate, Integer durationWeeks, Integer daysPerWeek,
                           String generationReason, String programTemplateId, Integer programTemplateVersion,
                           String assessmentSessionId, String levelEvaluationId, String previousPlanId,
                           Map<String, Object> snapshot, List<CycleDayDto> days) {}

    public record RegenerateRequest(String reason) {}

    // ============================== Đánh giá định kỳ ==============================

    public record TestItemDto(String itemId, String exerciseId, String exerciseCode, String exerciseName, String thumbnailUrl,
                              String videoUrl, String competency, String metric, boolean mandatory, int sortOrder,
                              Map<String, Object> protocol, boolean aiAvailable, TestResultDto result) {}

    public record StartPeriodicResponse(String sessionId, String purpose, LevelDto level, int estimatedMinutes,
                                        List<TestItemDto> items, List<String> instructions) {}

    public record SubmitTestResultRequest(Integer totalReps, Integer validReps, Double holdSec, Double angleDeg, Double formScore,
                                          Double romScore, Integer majorViolations, Double poseConfidenceAvg, Double visibilityAvg,
                                          Double trackedRatio, Long movementSessionId, String source) {}

    public record TestResultDto(String id, String itemId, Integer totalReps, Integer validReps, Double holdSec, Double angleDeg,
                                Double formScore, Double romScore, Integer majorViolations, Double reliability, String source,
                                String status, String statusReason) {}

    public record CompletePeriodicResponse(EvaluationDto evaluation, List<CompetencyDto> competencies, Double overallScore,
                                           List<GapDto> gaps, String cycleId, String cycleName, List<String> retestItems) {}

    // ============================== Admin: rule set ==============================

    public record RuleSetSummaryDto(String id, String code, int version, String status, String parentId, String notes,
                                    String createdBy, Instant createdAt, Instant activatedAt, Long authorId, Instant submittedAt) {}

    public record ParamDto(String key, double value, String sourceType, String sourceReference) {}

    public record LadderNodeDto(String competency, String exerciseId, String exerciseCode, String exerciseName, int order,
                                String metric, double base, double span, double target, double entry, String sourceType,
                                String sourceReference) {}

    public record RequirementDto(String gate, String competency, String exerciseId, String exerciseCode, String metric,
                                 String operator, double value, Boolean mandatory, String sourceType, String sourceReference) {}

    public record LevelConfigDto(String code, int rank, String name, double promoteMin, double regressBelow, double minConfidence,
                                 String description, String colorScheme, List<RequirementDto> requirements) {}

    public record ConsistencyRuleDto(String code, String conditionJson, String severity, List<String> affectedCompetencies,
                                     String message) {}

    public record RuleSetDetailDto(RuleSetSummaryDto ruleSet, List<ParamDto> params, List<LadderNodeDto> ladders,
                                   List<LevelConfigDto> levels, List<ConsistencyRuleDto> consistencyRules) {}

    /** decision: APPROVED | CHANGES_REQUESTED (bắt buộc notes khi yêu cầu chỉnh sửa). */
    public record RuleSetDecisionRequest(String decision, String notes) {}

    public record UpdateRuleSetRequest(String notes, List<ParamDto> params, List<LadderNodeDto> ladders,
                                       List<LevelConfigDto> levels, List<ConsistencyRuleDto> consistencyRules) {}

    public record ValidationDto(boolean valid, List<String> errors) {}

    public record SimulateRequest(String ruleSetId, String currentLevel, String status, Double previousEwma, Integer consecutiveBelow,
                                  Map<String, Double> competencies, Double confidence, List<SimTestDto> tests,
                                  Map<String, String> nodeStatus, Boolean baseline, Boolean coachVerified) {}

    public record SimTestDto(String exerciseCode, Integer totalReps, Integer validReps, Double holdSec, Double formScore,
                             Integer majorViolations, Double poseConfidence, Double visibility, Double trackedRatio) {}

    public record SimulateResponse(Double overallScore, EvaluationDto evaluation, List<CompetencyDto> competencies) {}

    // ============================== Admin: giáo án mẫu ==============================

    public record ProgramTemplateDto(String id, String code, int version, String name, String description, String status,
                                     String levelMin, String levelMax, String primaryLevel, List<String> goalCodes,
                                     int daysPerWeekMin, int daysPerWeekMax, int sessionMinutes, int durationWeeks, Integer deloadWeek,
                                     List<String> requiredEquipment, Map<String, Double> emphasis, boolean requiresCoachReview,
                                     int priority, Object structure, String createdBy, Instant createdAt, Instant updatedAt,
                                     Instant publishedAt, long assignedUsersCount, long activeUsersCount) {}

    public record ProgramTemplateRequest(String name, String description, String status, String levelMin, String levelMax,
                                         String primaryLevel, List<String> goalCodes, Integer daysPerWeekMin, Integer daysPerWeekMax,
                                         Integer sessionMinutes, Integer durationWeeks, Integer deloadWeek,
                                         List<String> requiredEquipment, Map<String, Double> emphasis, Boolean requiresCoachReview,
                                         Integer priority, Object structure) {}

    public record CoverageCellDto(String level, String goal, int daysPerWeek, int templateCount, List<String> templates) {}

    public record CoverageDto(List<String> levels, List<String> goals, List<Integer> days, List<CoverageCellDto> cells) {}

    // ============================== Coach ==============================

    public record OverrideRequest(String targetType, String exerciseId, String newLevel, String nodeStatus, String reason,
                                  Boolean regenerateCycle) {}

    public record OverrideDto(String id, String userId, String coachId, String targetType, String targetId, String originalValue,
                              String newValue, String reason, Instant createdAt) {}
}
