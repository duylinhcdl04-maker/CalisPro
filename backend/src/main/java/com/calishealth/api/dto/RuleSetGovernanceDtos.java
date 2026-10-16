package com.calishealth.api.dto;

import java.time.Instant;
import java.util.List;

/** Coach soạn rule set V2, Admin duyệt và kích hoạt (ASSESSMENT_FRAMEWORK_V2 §33). */
public final class RuleSetGovernanceDtos {
    private RuleSetGovernanceDtos() {}

    /** status: DRAFT | PENDING_REVIEW | ACTIVE | ARCHIVED. authorId null = do hệ thống/migration tạo. */
    public record RuleSetSummary(long id, String code, int version, String status, Long authorId, String createdBy, Long parentId,
                                 Instant createdAt, Instant submittedAt, Instant activatedAt, String notes, String displayName) {}

    /** value null khi là tham số dạng chữ (text). */
    public record ParamView(String key, Double value, String text, String sourceType, String sourceReference) {}

    public record RequirementView(long id, String gate, String competency, String exerciseCode, String metric, String operator, double value,
                                  boolean mandatory, String sourceType) {}

    public record LevelView(long id, String code, int rank, String name, double promoteMin, double regressBelow, double minCompetencyConfidence,
                            List<RequirementView> requirements) {}

    public record ReviewView(long id, long reviewerId, String scope, String decision, String notes, Instant reviewedAt) {}

    public record ChangeView(long id, long actorId, String targetType, String targetKey, String oldValue, String newValue, Instant at) {}

    /** requiredReviewScopes: phạm vi Admin phê duyệt - lần kích hoạt ĐẦU của dòng rule set là tất cả; các lần sau suy ra từ nhật ký thay đổi. */
    public record RuleSetDetail(RuleSetSummary summary, List<ParamView> params, List<LevelView> levels, List<ReviewView> reviews, List<ChangeView> changes,
                                List<String> validationErrors, List<String> requiredReviewScopes) {}

    /** Đặt value (số) HOẶC text (cho tham số dạng chữ). Chỉ sửa tham số đã tồn tại: Coach không thêm khoá mà engine không đọc. */
    public record ParamUpdate(String key, Double value, String text, String sourceType, String sourceReference) {}

    public record LevelUpdate(String code, Double promoteMin, Double regressBelow, Double minCompetencyConfidence) {}

    public record RequirementUpdate(long id, Double value) {}

    public record UpdateRuleSetRequest(String notes, List<ParamUpdate> params, List<LevelUpdate> levels, List<RequirementUpdate> requirements, String displayName) {
        public UpdateRuleSetRequest(String notes, List<ParamUpdate> params, List<LevelUpdate> levels, List<RequirementUpdate> requirements) {
            this(notes, params, levels, requirements, null);
        }
    }

    /** decision: APPROVED (duyệt và kích hoạt) | CHANGES_REQUESTED (trả về DRAFT, bắt buộc có notes). */
    public record DecisionRequest(String decision, String notes) {}
}
