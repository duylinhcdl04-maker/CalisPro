package com.calishealth.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/**
 * DTO bài đánh giá do admin cấu hình + bài test đầu vào.
 * Cấu trúc khớp kiểu dữ liệu Frontend Admin (features/assessments/types) để giảm chuyển đổi phía giao diện.
 * Id trả về dạng chuỗi; khi tạo mới câu hỏi trong bài, frontend có thể gửi id tạm (vd. "q-custom-...").
 */
public final class AssessmentTemplateDtos {
    private AssessmentTemplateDtos() {}

    // ============================== ADMIN ==============================

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OptionDto(String id, String label, String value, Double score, Boolean isRecommended) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScoreRuleDto(String id, String questionId, String operator, Double minValue, Double maxValue,
                               Object exactValue, Double score, String label) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuestionDto(
            String id,
            String text,
            String description,
            String instruction,
            String type,          // SINGLE_CHOICE | MULTIPLE_CHOICE | YES_NO | NUMERIC_INPUT | RATING_SCALE | PERFORMANCE_TEST | MEASUREMENT | SELF_ASSESSMENT
            String category,      // nhóm năng lực (FitnessDimension)
            Boolean required,
            Double weight,
            String unit,
            List<OptionDto> options,
            Object performanceConfig,
            Object measurementConfig,
            Object ratingConfig,
            List<ScoreRuleDto> scoringRules,
            Integer usedInAssessmentsCount,
            Boolean isBankItem,
            Integer version,
            String createdAt,
            String updatedAt
    ) {}

    /** Câu hỏi trong bài; `question` = định nghĩa đầy đủ (bắt buộc với câu hỏi mới tạo trong bài) */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuestionRefDto(String questionId, Integer order, Double weight, Boolean required, String section, QuestionDto question) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuestionScoringDto(String questionId, List<ScoreRuleDto> rules) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScoringConfigDto(Double maxTotalScore, List<QuestionScoringDto> questionScoring, Double passScore) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LevelDto(String id, String code, String name, Double minScore, Double maxScore, String description,
                           String recommendation, String colorScheme, String badgeLabel) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AssessmentDto(
            String id,
            String name,
            String displayName,
            String description,
            String type,
            Integer estimatedDuration,
            List<String> tags,
            String status,
            Object targetAudience,
            List<QuestionRefDto> questions,
            ScoringConfigDto scoringConfig,
            List<LevelDto> fitnessLevels,
            Object schedule,
            String createdAt,
            String updatedAt,
            Integer version,
            Integer attemptsCount,
            Double averageScore,
            Double completionRate,
            // ---- chỉ có trong response ----
            Boolean isOnboarding,     // đang là bài test đầu vào
            Boolean locked,           // đang dùng làm bài test đầu vào -> sửa sẽ tạo phiên bản mới
            String rootId,            // bài gốc của chuỗi phiên bản
            String forkedFromId,      // != null: vừa tạo phiên bản mới từ bài này
            Map<String, String> idMap // id tạm (frontend) -> id thật của câu hỏi vừa tạo
    ) {}

    public record ValidationResultDto(boolean valid, List<String> errors) {}

    public record OnboardingSettingsDto(
            String activeTemplateId,
            String activeTemplateName,
            Integer activeTemplateVersion,
            String activeTemplateStatus,
            boolean mandatory,
            boolean blockWhenMissing,
            int round,
            String updatedAt,
            String updatedBy,
            long completedCount,      // số người đã hoàn thành ở vòng hiện tại
            ValidationResultDto validation
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpdateOnboardingSettingsRequest(String activeTemplateId, Boolean mandatory, Boolean blockWhenMissing) {}

    // ============================== HỌC VIÊN ==============================

    /**
     * status: PENDING (cần làm) | COMPLETED | SKIPPED | NOT_REQUIRED (chưa cấu hình bài) | BLOCKED (chưa cấu hình & admin chặn)
     */
    public record OnboardingStatusDto(String status, boolean mustTake, boolean canSkip, String templateId, Integer templateVersion) {}

    public record UserOptionDto(String value, String label, String description) {}

    public record UserQuestionDto(
            String id,
            String type,          // SINGLE_CHOICE | MULTIPLE_CHOICE | NUMBER | BOOLEAN | SCALE (bộ hiển thị phía học viên)
            String prompt,
            String helperText,
            List<UserOptionDto> options,
            Double min,
            Double max,
            String unit,
            boolean required,
            String category,
            String minLabel,
            String maxLabel,
            String videoUrl,
            String imageUrl
    ) {}

    /** title = tên phần do admin đặt; NULL -> giao diện hiển thị theo nhóm năng lực `category` */
    public record StepDto(int step, String title, String category, List<UserQuestionDto> questions) {}

    public record QuestionnaireDto(String templateId, int version, String title, String description,
                                   int estimatedDuration, boolean canSkip, List<StepDto> steps) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SubmitOnboardingRequest(String templateId, Map<String, Object> answers) {}

    public record LevelResultDto(String code, String name, String description, String recommendation,
                                 String colorScheme, String badgeLabel) {}

    public record DimensionScoreDto(String category, double score, int questionCount) {}

    public record OnboardingResultDto(
            String sessionId,
            String templateId,
            int templateVersion,
            double overallScore,
            double maxScore,
            LevelResultDto level,
            List<DimensionScoreDto> dimensions,
            Boolean passed,
            int answeredCount,
            int scoredCount,
            String source,           // SELF_REPORTED: kết quả tạm thời từ dữ liệu tự khai báo
            String completedAt,
            // Kết quả Level Engine (6 năng lực, level PROVISIONAL, chu kỳ tập đầu tiên); null nếu chưa bật Level Engine
            com.calishealth.api.dto.LevelEngineDtos.EngineResultDto engine
    ) {}
}
