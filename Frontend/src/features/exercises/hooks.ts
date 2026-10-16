import { useQuery } from "@tanstack/react-query";
import { exercisesApi } from "./api";

export function useExercisesQuery() {
  return useQuery({ queryKey: ["exercises"], queryFn: exercisesApi.list });
}

export function useExerciseQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["exercise", id],
    queryFn: () => exercisesApi.getById(id!),
    enabled: !!id,
  });
}
