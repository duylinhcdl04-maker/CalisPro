import { apiClient } from "../../lib/api/client";
import { workoutService } from "../../services/mock/workoutService";
import type { WorkoutPlanDetail } from "../../types";

export interface WorkoutPlanDto {
  id: number;
  userId: number;
  name: string;
  description: string;
  goalId?: number;
  goalName?: string;
  difficultyLevel: string;
  durationWeeks?: number;
  daysPerWeek?: number;
  status: string;
  startDate?: string;
  endDate?: string;
}

export interface WorkoutSessionDto {
  id: number;
  userId: number;
  workoutPlanId?: number;
  workoutPlanName?: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  status: string;
  energyLevel?: number;
  difficultyRating?: number;
  notes?: string;
}

export const workoutApi = {
  async getPlanDetail(id: number): Promise<WorkoutPlanDetail> {
    try {
      const res = await apiClient.get<WorkoutPlanDto>(`/workout-plans/${id}`);
      if (res.data) {
        return {
          id: res.data.id,
          name: res.data.name,
          durationMinutes: 45,
          difficulty: (res.data.difficultyLevel as WorkoutPlanDetail["difficulty"]) || "Intermediate",
          muscleGroups: ["Toàn thân"],
          exercises: [
            {
              id: "push-up",
              name: "Push Up",
              imageUrl: "https://picsum.photos/seed/calis-push-up/320/240",
              sets: 4,
              reps: "10-12",
              restSeconds: 60,
              rpe: 7,
              muscleGroup: "Ngực",
            },
            {
              id: "pull-up",
              name: "Pull Up",
              imageUrl: "https://picsum.photos/seed/calis-pull-up/320/240",
              sets: 4,
              reps: "6-8",
              restSeconds: 90,
              rpe: 8,
              muscleGroup: "Lưng",
            },
            {
              id: "dips",
              name: "Dips",
              imageUrl: "https://picsum.photos/seed/calis-dips/320/240",
              sets: 3,
              reps: "8-10",
              restSeconds: 60,
              rpe: 7,
              muscleGroup: "Tay sau",
            },
            {
              id: "plank",
              name: "Plank",
              imageUrl: "https://picsum.photos/seed/calis-plank/320/240",
              sets: 3,
              reps: "45 giây",
              restSeconds: 45,
              rpe: 6,
              muscleGroup: "Core",
            },
          ],
        };
      }
    } catch (err) {
      console.warn("Backend workout plan API unavailable, using mock fallback", err);
    }
    return workoutService.getPlanDetail(id);
  },

  async listPlans(): Promise<WorkoutPlanDto[]> {
    try {
      const res = await apiClient.get<WorkoutPlanDto[]>("/workout-plans");
      return res.data || [];
    } catch (err) {
      console.warn("Backend listPlans error", err);
      return [];
    }
  },

  async generatePlan(payload?: {
    goalCode?: string;
    level?: string;
    daysPerWeek?: number;
    minutesPerSession?: number;
  }): Promise<WorkoutPlanDto | null> {
    try {
      const res = await apiClient.post<WorkoutPlanDto>("/workout-plans/generate", payload || {});
      return res.data;
    } catch (err) {
      console.warn("Backend generatePlan error", err);
      return null;
    }
  },

  async listSessions(): Promise<WorkoutSessionDto[]> {
    try {
      const res = await apiClient.get<WorkoutSessionDto[]>("/workout-sessions");
      return res.data || [];
    } catch (err) {
      console.warn("Backend listSessions error", err);
      return [];
    }
  },

  async createSession(payload: {
    workoutPlanId?: number;
    durationSeconds?: number;
    status?: string;
    energyLevel?: number;
    difficultyRating?: number;
    notes?: string;
  }): Promise<WorkoutSessionDto | null> {
    try {
      const res = await apiClient.post<WorkoutSessionDto>("/workout-sessions", payload);
      return res.data;
    } catch (err) {
      console.warn("Backend createSession error", err);
      return null;
    }
  },
};

