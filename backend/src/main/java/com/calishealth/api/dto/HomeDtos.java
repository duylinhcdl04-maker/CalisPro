package com.calishealth.api.dto;

import java.util.List;

/** Dữ liệu trang Tổng quan của học viên: mọi con số lấy từ dữ liệu thật của chính người dùng, thiếu thì để null (không điền số mẫu). */
public final class HomeDtos {
    private HomeDtos() {}

    /** Level hiện tại (null khi chưa có): code L0..L4, status PROVISIONAL | VERIFIED | RETURNING, source nguồn xác nhận. */
    public record LevelInfo(String code, String status, String source) {}

    /** score = null: năng lực chưa được đo (không phải điểm 0). */
    public record CompetencyScore(String code, String name, Double score) {}

    /** state: NO_PLAN | READY | CYCLE_DONE như trang Luyện tập. */
    public record TodayInfo(String state, String message, String planName, String planSource, String dayName, String focus, Integer estimatedMinutes,
                            int exerciseCount, int sessionsDone, int sessionsPlanned, Long activeSessionId) {}

    /** Tuần hiện tại của chu kỳ đang tập. weeksTotal/weekIndex tính theo ngày bắt đầu và kết thúc của chu kỳ. */
    public record CycleInfo(String planName, Integer cycleNumber, int weekIndex, int weeksTotal, int sessionsDone, int sessionsPlanned) {}

    public record WeekSummary(int completedWorkouts, int plannedWorkouts, int totalMinutes) {}

    /** Thang 1-5 như form check-in. score 0-100 chỉ để gợi ý cường độ buổi tập, KHÔNG ảnh hưởng level. level: GOOD | MEDIUM | LOW. */
    public record Readiness(String checkinDate, boolean today, Integer energy, Double sleepHours, Integer soreness, Integer stress, Integer motivation,
                            int score, String level) {}

    /** trend: up (vừa cải thiện) | flat. value đã định dạng sẵn ("30", "2:15"), unit: "reps" hoặc "" (bài giữ tính bằng thời gian). */
    public record PersonalRecord(String exercise, String value, String unit, String trend, String changeLabel) {}

    /** Nhận xét tạo từ chính dữ liệu của người dùng theo quy tắc cố định (không phải văn bản do AI sinh). */
    public record Insight(String headline, String message, String ctaLabel) {}

    public record HomeResponse(LevelInfo level, Double overallScore, List<CompetencyScore> competencies, String weakestCompetency,
                               String primaryGoal, TodayInfo today, CycleInfo cycle, WeekSummary week, int streakDays, boolean checkedInToday,
                               Readiness readiness, List<PersonalRecord> records, Insight insight) {}
}
