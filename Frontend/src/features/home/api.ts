import { apiClient } from "../../lib/api/client";

/** Trang Tổng quan của học viên (backend /me/home): mọi số liệu tính từ dữ liệu thật; thiếu dữ liệu thì trường vắng mặt, không có số mẫu. */

export interface HomeLevel { code: string; status: string; source: string }
export interface HomeCompetency { code: string; name: string; score?: number }
export interface HomeToday {
  state: "NO_PLAN" | "READY" | "CYCLE_DONE";
  message?: string;
  planName?: string;
  planSource?: "SYSTEM" | "SELF";
  dayName?: string;
  focus?: string;
  estimatedMinutes?: number;
  exerciseCount: number;
  sessionsDone: number;
  sessionsPlanned: number;
  activeSessionId?: number;
}
export interface HomeCycle { planName?: string; cycleNumber?: number; weekIndex: number; weeksTotal: number; sessionsDone: number; sessionsPlanned: number }
export interface HomeWeek { completedWorkouts: number; plannedWorkouts: number; totalMinutes: number }
export interface HomeReadiness {
  checkinDate: string;
  today: boolean;
  energy?: number;
  sleepHours?: number;
  soreness?: number;
  stress?: number;
  motivation?: number;
  score: number;
  level: "GOOD" | "MEDIUM" | "LOW";
}
export interface HomeRecord { exercise: string; value: string; unit: string; trend: "up" | "flat"; changeLabel: string }
export interface HomeInsight { headline: string; message: string; ctaLabel: string }

export interface HomeData {
  level?: HomeLevel;
  overallScore?: number;
  competencies: HomeCompetency[];
  weakestCompetency?: string;
  primaryGoal?: string;
  today: HomeToday;
  cycle?: HomeCycle;
  week?: HomeWeek;
  streakDays: number;
  checkedInToday: boolean;
  readiness?: HomeReadiness;
  records: HomeRecord[];
  insight?: HomeInsight;
}

export const homeApi = {
  get: async () => (await apiClient.get<HomeData>("/me/home")).data,
};
