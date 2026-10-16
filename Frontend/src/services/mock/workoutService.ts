import type { WorkoutPlanDetail } from "../../types";
import { withLatency } from "./latency";

const PLAN: WorkoutPlanDetail = {
  id: 12,
  name: "Sức mạnh phần thân trên",
  durationMinutes: 35,
  difficulty: "Intermediate",
  muscleGroups: ["Ngực", "Lưng", "Tay sau", "Core"],
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
      id: "diamond-push-up",
      name: "Diamond Push Up",
      imageUrl: "https://picsum.photos/seed/calis-diamond-push-up/320/240",
      sets: 3,
      reps: "8-10",
      restSeconds: 60,
      rpe: 7,
      muscleGroup: "Tay sau",
    },
    {
      id: "dead-hang",
      name: "Dead Hang",
      imageUrl: "https://picsum.photos/seed/calis-dead-hang/320/240",
      sets: 3,
      reps: "30 giây",
      restSeconds: 45,
      rpe: 6,
      muscleGroup: "Lưng",
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

export const workoutService = {
  async getPlanDetail(id: number): Promise<WorkoutPlanDetail> {
    await withLatency(null, 500);
    return { ...PLAN, id };
  },
};
