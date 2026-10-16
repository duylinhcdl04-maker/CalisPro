package com.calishealth.api.dto;

import java.util.List;

/** Buổi tập hôm nay của học viên (lấy từ giáo án đang tập) và việc ghi lại kết quả tập, có thể do AI đo bằng camera. */
public final class TrainingSessionDtos {
    private TrainingSessionDtos() {}

    /**
     * ready: bài có profile chuyển động đủ để đếm rep/giây giữ bằng camera. formScoring: bài có rule đã xuất bản để chấm form.
     * enabled: Coach đã bật tích hợp AI cho bài; configured: bài có đủ cấu hình đo (ready = enabled và configured).
     * metricPoints: 3 chỉ số landmark (MediaPipe) tạo góc đo chính của bài; repTop/repBottom: ngưỡng góc ở đỉnh và đáy.
     */
    public record AiInfo(boolean ready, boolean formScoring, String movementType, String cameraView, Double repTop, Double repBottom,
                         List<Integer> metricPoints, String note, boolean enabled, boolean configured) {}

    /** Thông tin cho nút "Tập với AI Coach" ở trang chi tiết bài tập: bài và trạng thái tích hợp AI của nó. */
    public record AiCoachInfo(long exerciseId, String code, String name, AiInfo ai) {}

    public record TodayExercise(long exerciseId, String code, String name, String thumbnailUrl, String videoUrl, String section, int sequenceNo,
                                int sets, Integer repMin, Integer repMax, Integer holdSec, Integer restSec, Double rpe, String tempo, String notes,
                                String instructions, boolean recommended, AiInfo ai) {}

    /** state: NO_PLAN (chưa có giáo án đang tập) | READY (có buổi để tập) | CYCLE_DONE (đã tập hết các buổi của chu kỳ). */
    public record TodayWorkout(String state, String message, Long planId, String planName, String planSource, String levelCode, Integer cycleNumber,
                               Long dayId, Integer dayNumber, Integer weekNumber, String dayName, String focus, Integer estimatedMinutes,
                               int sessionsDone, int sessionsPlanned, Long activeSessionId, List<TodayExercise> exercises) {}

    public record StartSessionRequest(Long planId, Long dayId) {}

    public record StartSessionResponse(long sessionId, boolean resumed) {}

    /** source: AI (camera đo) | MANUAL (học viên tự nhập). movementSessionId: phiên đo của Motion Rule Engine (nếu có). */
    public record SetInput(Integer setNumber, Integer reps, Integer durationSeconds, Integer restSeconds, String source, Long movementSessionId) {}

    public record ExerciseInput(Long exerciseId, Integer plannedSets, List<SetInput> sets) {}

    /** status: COMPLETED | ABANDONED. Chỉ tính COMPLETED khi đã làm từ 60% số hiệp theo kế hoạch. */
    public record FinishSessionRequest(String status, Integer durationSeconds, Integer difficultyRating, Integer energyLevel, String notes,
                                       List<ExerciseInput> exercises) {}

    public record FinishSessionResponse(long sessionId, String status, double completionRatio, int completedSets, int plannedSets, int aiMeasuredSets) {}
}
