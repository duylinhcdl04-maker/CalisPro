package com.calishealth.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** DTO của Assessment Framework V2 (Initial + Safety Screening). */
public final class AssessmentV2Dtos {
    private AssessmentV2Dtos() {}

    public record StartResponse(long sessionId, String templateCode, int templateVersion, boolean resumed) {}

    public record OptionDto(String code, String label) {}

    public record QuestionDto(String code, String text, String instruction, String questionType, String inputType, String section,
                              boolean required, Double minValue, Double maxValue, List<OptionDto> options) {}

    public record QuestionsResponse(long sessionId, List<QuestionDto> questions, Map<String, Object> answers) {}

    public record AnswerDto(String questionCode, Object value) {}

    public record SaveAnswersRequest(List<AnswerDto> answers) {}

    public record SaveAnswersResponse(List<String> visibleQuestions, List<String> removedQuestions, int answered, List<String> requiredRemaining) {}

    // ---- Safety ----
    public record ActiveFlagDto(String code, boolean sticky, String severity) {}

    public record SafetyStatusDto(String status, Instant validUntil, boolean expired, List<ActiveFlagDto> activeFlags, Set<String> constraints,
                                String clearanceMethod, boolean acknowledged) {}

    /** Ngữ cảnh để Coach quyết định: tình trạng an toàn HIỆN TẠI của học viên và các kết quả mà clearance rule cho phép. stale = trạng thái đã đổi kể từ khi gửi yêu cầu. */
    public record ResultingOptionDto(String resultingStatus, boolean allowRetainedConstraints) {}

    public record ClearanceDetailDto(ClearanceDto clearance, String userName, String currentStatus, boolean stale, Instant validUntil, List<ActiveFlagDto> activeFlags,
                                     Set<String> constraints, Set<String> retainableConstraints, boolean acknowledged, boolean canDecide, List<ResultingOptionDto> options) {}

    // ---- Initial result ----
    public record LevelDto(String candidateLevel, String gatedLevel, String adjustedLevel, String finalLevel, String levelCap, boolean capApplied,
                           String levelStatus, String verificationStatus, String source, Map<String, String> gates) {}

    public record ReasonDto(String code, String gate, String subject, Double required, Double actual, String message) {}

    public record CompetencyDto(String code, Double score, double coverage, double answerConfidence, String dataQuality, boolean needsVerification) {}

    public record StageDto(String stage, int rank, String status, String origin, Double value, String reasonCode) {}

    public record LadderDto(String ladder, String competency, String highestAchievedStage, Double stagePerformanceRatio, Double score, String evidenceState,
                            List<StageDto> stages) {}

    public record FlagDto(String code, String severity, Set<String> affected, String message) {}

    /** usedFor: nguồn của câu trả lời (SCORE | RELIABILITY | CONSISTENCY | PROGRESSION_SPEED | GOAL | CONSTRAINT | PROFILE). */
    public record AnswerEchoDto(String questionCode, String evidenceRole, Object value, List<String> usedFor) {}

    public record InitialResultDto(long sessionId, long ruleSetId, String ruleSetCode, int ruleSetVersion, String algorithmVersion,
                                   LevelDto level, Double overallScore, double answerConfidence, String dataQuality,
                                   List<CompetencyDto> competencies, List<LadderDto> progression, List<FlagDto> consistencyFlags,
                                   List<ReasonDto> reasons, List<AnswerEchoDto> contributingAnswers, List<AnswerEchoDto> contextualAnswers,
                                   Map<String, Double> effectiveGroupWeights, SafetyStatusDto safety) {}

    // ---- Acknowledgement & Clearance (acknowledgement KHÔNG phải clearance) ----
    public record AcknowledgeRequest(String advisoryVersion) {}

    public record AcknowledgementDto(String advisoryVersion, Instant acknowledgedAt, String status) {}

    public record ClearanceRequestDto(String method, String attestationTextVersion, String evidenceRef) {}

    public record ClearanceDecisionRequest(String decision, String resultingStatus, Set<String> retainedConstraints, String note) {}

    public record ClearanceDto(long id, long userId, String method, String status, String decidedByType, String resultingStatus, Instant requestedAt,
                               Instant reviewedAt, String note, String evidenceRef, Set<String> removedFlags) {}

    // ---- Baseline (thực hành đầu tiên) ----
    /** metric (VALID_REPS | HOLD_SEC | ANGLE_DEG) và competency cho phép giao diện chọn cách đo/hướng dẫn mà không cần tải lại bộ test. */
    public record NextStepDto(int level, String exerciseCode, int attemptNo, String reason, long restRemainingSec, String metric, String competency) {}

    public record StartBaselineResponse(long sessionId, boolean resumed, long restSec, Instant expiresAt, NextStepDto next) {}

    public record SubmitAttemptRequest(String exerciseCode, Long movementSessionId, Instant startedAt, Instant endedAt, Integer totalReps, Integer validReps,
                                       Double holdSec, Double angleDeg, Double formScore, Double romScore, Integer majorViolations, Double poseConfidenceAvg,
                                       Double visibilityAvg, Double trackedRatio, Boolean userAborted, String abortReason) {}

    public record AttemptResultDto(long attemptId, String exerciseCode, int attemptNo, String measurementStatus, String invalidReason, double reliability) {}

    /** outcome: IN_PROGRESS | VERIFIED | RETEST_REQUIRED. finalLevel chỉ có khi VERIFIED (RETEST/INCOMPLETE không đổi level). */
    public record BaselineProgressDto(String outcome, String decision, String finalLevel, boolean fastTrackConsumed, String reasonCode, NextStepDto next,
                                      AttemptResultDto lastAttempt, Map<Integer, String> stabilityByLevel, Instant retestAfter, boolean rescreenRecommended,
                                      Double overallScore, List<CompetencyDto> competencies, List<LadderDto> progression,
                                      String l4Review) {}

    // ---- L4: Coach xác nhận + video bằng chứng (§32) ----

    public record RecordingConsentRequest(boolean granted) {}
    public record RecordingConsentDto(long sessionId, boolean granted, int retentionDays) {}
    public record AttachVideoRequest(String videoUrl) {}
    public record DecideL4Request(String decision, String reason) {}

    /** status: PENDING | CONFIRMED | REJECTED | RETEST_REQUESTED | SUPERSEDED | EXPIRED. */
    public record L4ReviewSummaryDto(long id, long userId, String status, String verifiedLevel, String pendingLevel, Instant createdAt, Instant expiresAt,
                                     Instant decidedAt, String decisionReason, String confirmedLevel) {}

    public record RepEvidenceDto(int repNumber, boolean valid, Integer qualityScore, String violationCodes) {}

    /** videoUrl = null khi chưa có hoặc đã hết hạn lưu. */
    public record AttemptEvidenceDto(long attemptId, String exerciseCode, int attemptNo, String measurementStatus, double reliability, Long movementSessionId,
                                     Map<String, Double> metrics, String videoUrl, Instant videoExpiresAt, List<RepEvidenceDto> reps) {}

    public record L4ReviewDetailDto(L4ReviewSummaryDto summary, Double overallScore, List<AttemptEvidenceDto> attempts) {}

    // ---- Periodic thường kỳ + trạng thái level V2 (§34) ----

    /** status: PENDING | VALID | INVALID_MEASUREMENT | USER_ABORTED. */
    public record PeriodicItemDto(String exerciseCode, String competency, String metric, String status) {}

    public record StartPeriodicResponse(long sessionId, boolean resumed, long restSec, Instant expiresAt, String currentLevel, String targetLevel, String levelStatus,
                                        List<PeriodicItemDto> tests, NextStepDto next) {}

    /**
     * outcome: IN_PROGRESS | DECIDED | RETEST_REQUIRED | INSUFFICIENT_EVIDENCE. decision (PROMOTED | MAINTAINED | REGRESSED) và levelAfter chỉ có khi DECIDED;
     * RETEST_REQUIRED / INSUFFICIENT_EVIDENCE giữ nguyên level, EWMA và chuỗi suy giảm. blockedGates: cổng chặn việc lên level (nếu có).
     * l4Review: null | PENDING_COACH | RECORDING_CONSENT_REQUIRED.
     */
    public record PeriodicProgressDto(String outcome, String decision, String levelBefore, String levelAfter, boolean levelChanged, String reasonCode,
                                      Map<String, String> blockedGates, String l4Review, Double overallScore, Double ewma, Integer consecutiveBelow,
                                      List<PeriodicItemDto> tests, NextStepDto next, AttemptResultDto lastAttempt, Instant retestAfter, boolean rescreenRecommended,
                                      List<CompetencyDto> competencies) {}

    public record LevelHistoryDto(Instant at, String kind, String outcome, String decision, String levelBefore, String levelAfter, String reasonCode) {}

    /** nextAssessmentEarliest: sớm nhất được đo lại (assessment.minIntervalDays), null khi RETURNING. */
    public record LevelStateDto(String levelCode, int levelRank, String status, String source, Double ewma, Instant lastAssessedAt, Instant nextAssessmentEarliest,
                                String l4Review, List<LevelHistoryDto> history, String periodicGate, java.time.LocalDate cycleEnd, int cycleSessionsDone, int cycleSessionsPlanned) {}

    // ---- Hành trình đánh giá của học viên (§42) ----

    /** key: SAFETY | INITIAL | BASELINE | PERIODIC; status: DONE | TODO | LOCKED | WAIT (đo định kỳ chưa tới hạn) | DEFERRED (đã chọn bỏ qua, đo sau); detail: mã gợi ý cho giao diện (vd ACKNOWLEDGE, RESCREEN, UNTIL:ngày). */
    public record JourneyStepDto(String key, String status, String path, String detail) {}

    /** nextKey/nextPath = bước TODO đầu tiên (null khi đã xong ba bước nền và đo định kỳ chưa tới hạn); complete = đã xong sàng lọc, khảo sát, Baseline. */
    public record JourneyDto(List<JourneyStepDto> steps, String nextKey, String nextPath, boolean complete) {}

    // ---- Level tạm thời, bỏ qua/đo sau, đo lại (§46) ----

    /** eligible = hiện được phép bắt đầu một lần đo lại; used = đã đo lại; availableUntil = hạn đo lại (chỉ khi kết quả đầu thấp hơn level tạm). */
    public record RetakeDto(boolean eligible, boolean used, Instant availableUntil, String firstLevel, String retakeLevel, int maxRetakes) {}

    /** displayLabel: VERIFIED | PROVISIONAL | NONE. provisionalCap = level tối đa của khảo sát (vd L2). verifiedPartial = đã kết thúc sớm, level là cận dưới. */
    public record LevelStatusDto(String provisionalLevel, String provisionalCap, String verifiedLevel, boolean verifiedPartial, String displayLevel, String displayLabel,
                                 RetakeDto retake, Instant deferredUntil) {}

    public record DeferDto(Instant remindAfter, int deferCount) {}
}
