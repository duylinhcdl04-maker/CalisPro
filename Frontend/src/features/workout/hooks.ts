import { useQuery } from "@tanstack/react-query";
import { workoutApi } from "./api";

export function useWorkoutPlanQuery(id: number) {
  return useQuery({
    queryKey: ["workout-plan", id],
    queryFn: () => workoutApi.getPlanDetail(id),
    enabled: Number.isFinite(id),
  });
}
