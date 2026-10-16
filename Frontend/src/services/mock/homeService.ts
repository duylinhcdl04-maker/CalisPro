import type { HomeData } from "../../types";
import { withLatency } from "./latency";

export const homeService = {
  async getHome(userName: string): Promise<HomeData> {
    await withLatency(null, 700);
    return {
      user: { name: userName, avatarUrl: null },
      primaryGoal: { code: "STRENGTH", name: "Xây dựng sức mạnh" },
      today: {
        type: "WORKOUT",
        workoutPlanId: 12,
        dayId: 34,
        name: "Sức mạnh phần thân trên",
        durationMinutes: 35,
        exerciseCount: 5,
        focus: ["Kéo", "Đẩy", "Core"],
        status: "NOT_STARTED",
      },
      fitness: { overallScore: 72, strength: 78, endurance: 64, mobility: 61, core: 75, balance: 58 },
      weeklySummary: { completedWorkouts: 3, plannedWorkouts: 4, totalMinutes: 185, streak: 7 },
      readiness: { score: 78, energy: 8, sleepHours: 7.5, soreness: 3, stress: 4 },
      personalRecords: [
        { exercise: "Push Up", value: "30", unit: "reps", trend: "up", changeLabel: "+4 so với lần trước" },
        { exercise: "Pull Up", value: "8", unit: "reps", trend: "up", changeLabel: "+1 so với lần trước" },
        { exercise: "Plank", value: "2:15", unit: "", trend: "flat", changeLabel: "Không đổi" },
      ],
      coach: {
        headline: "Push-up của bạn đang tiến bộ tốt",
        message:
          "Hiệu suất chống đẩy cải thiện 12% trong 3 tuần qua. Điểm mobility gần như không thay đổi. Đề xuất thêm 2 buổi mobility trong tuần này.",
        ctaLabel: "Xem đề xuất chi tiết",
      },
      recommendedExerciseIds: ["push-up", "pull-up", "plank", "dead-hang"],
    };
  },
};
