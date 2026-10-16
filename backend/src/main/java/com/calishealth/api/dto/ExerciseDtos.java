package com.calishealth.api.dto;

import java.util.List;

public final class ExerciseDtos {
    private ExerciseDtos(){}

    // ===== Dữ liệu chi tiết của Exercise Builder (lưu ở các bảng con) =====

    public record PhaseDto(
            Integer order,
            String name,
            String vietnameseName,
            String description,
            String coachingCue,
            String breathing,
            String muscleFocus,
            String mediaUrl
    ){}

    public record MuscleTargetDto(
            String muscleCode,      // mã cơ, vd. PECTORALIS_MAJOR
            String muscleName,      // tên khoa học (tiếng Anh)
            String muscleNameVi,
            String bodyRegion,      // CHEST / BACK / ...
            String side,            // FRONT / BACK / BOTH
            String role,            // PRIMARY / SECONDARY / STABILIZER
            String activationLevel, // LOW / MODERATE / HIGH / VERY_HIGH
            String laterality,      // BILATERAL / LEFT / RIGHT / CENTRAL
            List<String> expectedSensations,
            List<String> unexpectedSensations,
            String userGuidance
    ){}

    public record CoachingCueDto(String text, String priority, String category){}

    public record CommonMistakeDto(
            String name,
            String problem,
            String whyItHappens,
            String correction,
            String severity,
            String mediaUrl
    ){}

    public record AnatomyImageDto(String url, String caption, Boolean primary){}

    public record SafetyDto(
            String contraindications,
            String generalConsiderations,
            List<String> safetyCues,
            List<String> stopConditions
    ){}

    /**
     * Gửi kèm khi tạo/cập nhật để ghi đè toàn bộ dữ liệu chi tiết; null = giữ nguyên.
     * aiAnalysisData: JSON cấu hình AI Motion soạn trong Builder (bước 5).
     */
    public record ExerciseDetailsDto(
            String version,
            String displayName,
            String trainingCategory,
            String animationUrl,
            List<String> tags,
            List<String> equipment,
            String setup,
            String execution,
            String inhaleTiming,
            String exhaleTiming,
            String tempo,
            SafetyDto safety,
            List<PhaseDto> phases,
            List<MuscleTargetDto> muscleTargets,
            List<CoachingCueDto> coachingCues,
            List<CommonMistakeDto> commonMistakes,
            List<AnatomyImageDto> anatomyImages,
            String aiAnalysisData,
            List<String> sessionRoles,      // WARMUP | MAIN | ACCESSORY | COOLDOWN; null = giữ nguyên ở lần cập nhật
            Boolean aiEnabled               // bật "tích hợp AI" cho bài này; null = giữ nguyên ở lần cập nhật
    ){}

    public record CategoryRequest(
            String code,
            String name,
            String description
    ){}

    public record CategoryResponse(
            Long id,
            String code,
            String name,
            String description
    ){}

    public record ExerciseRequest(
            String code,
            String name,
            String description,
            Long categoryId,
            String difficultyLevel,
            String movementPattern,
            Boolean equipmentRequired,
            String instructions,
            String safetyNotes,
            String videoUrl,
            String thumbnailUrl,
            Boolean active,
            ExerciseDetailsDto details
    ){}

    public record ExerciseResponse(
            Long id,
            String code,
            String name,
            String description,
            Long categoryId,
            String categoryName,
            String difficultyLevel,
            String movementPattern,
            boolean equipmentRequired,
            String instructions,
            String safetyNotes,
            String videoUrl,
            String thumbnailUrl,
            boolean active,
            ExerciseDetailsDto details,
            AiSyncDto aiSync          // chỉ có khi vừa tạo/cập nhật: kết quả đồng bộ AI runtime
    ){}

    public record AiSyncDto(Long profileId, String profileVersion, boolean changed, int rulesSynced, int rulesSkipped, int landmarksSynced){}
}
