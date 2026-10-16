package com.calishealth.api.dto;

import java.util.List;

/** Bước quyết định "giáo án hệ thống hay tự tạo", danh sách bài tập tự tạo của học viên và gợi ý bài tập. */
public final class PlanChoiceDtos {
    private PlanChoiceDtos() {}

    /** needsDecision: đã có level nhưng chưa chọn cách tập. effectiveMode: SYSTEM | SELF | null (chưa chọn). */
    public record PlanChoiceStatus(String levelCode, String planMode, String effectiveMode, boolean needsDecision, String trainingFocus,
                                   Long activePlanId, String activePlanName, String activePlanSource) {}

    public record ChoosePlanRequest(String mode, String trainingFocus) {}

    public record FocusRequest(String trainingFocus) {}

    /** Một bài trong danh sách tự tạo; sets mặc định 3, reps mặc định 8-12 nếu không nhập (bài giữ tĩnh dùng holdSec). */
    public record SelfPlanItemInput(Long exerciseId, Integer sets, Integer repMin, Integer repMax, Integer holdSec, Integer restSec) {}

    public record SaveSelfPlanRequest(List<SelfPlanItemInput> items) {}

    public record SelfPlanItem(long exerciseId, String name, String thumbnailUrl, int sets, Integer repMin, Integer repMax, Integer holdSec, Integer restSec) {}

    /** Danh sách bài tập tự tạo. active = đang là cách tập hiện tại. Danh sách này KHÔNG dùng để nâng/hạ level. */
    public record SelfPlanView(Long planId, boolean active, List<SelfPlanItem> items) {}

    /** source: PLAN (bài trong giáo án hệ thống) | GOAL (theo mục tiêu đã chọn) | FOUNDATION (bài nền tảng cho người mới). */
    public record RecommendedExercise(long exerciseId, String code, String name, String thumbnailUrl, String competency, String reason) {}

    public record Recommendations(String source, String title, List<RecommendedExercise> items) {}

    /** Mã các bài được đánh dấu "Đề xuất cho bạn" trong MỌI danh sách bài tập. source: PLAN (bài trong giáo án hệ thống) | FOCUS (theo hướng/mục tiêu đã chọn) | NONE. */
    public record RecommendedIds(String source, List<Long> ids) {}
}
