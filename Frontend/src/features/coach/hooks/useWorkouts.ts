import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workoutService } from "../services";
import type { ExerciseFilterParams, PlanListParams, PlanStatus, SessionFeedbackInput, SessionListParams, WorkoutPlanInput } from "../types";
import { coachKeys } from "./queryKeys";

/* --------------------------------- Plans --------------------------------- */

export function usePlans(params: PlanListParams) {
  return useQuery({ queryKey: coachKeys.planList(params), queryFn: () => workoutService.getPlans(params), placeholderData: keepPreviousData });
}

export function usePlan(id: string | undefined) {
  return useQuery({ queryKey: coachKeys.plan(id ?? ""), queryFn: () => workoutService.getPlan(id!), enabled: !!id });
}

function usePlanMutation<TVars>(fn: (vars: TVars) => ReturnType<typeof workoutService.getPlan>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (plan) => {
      qc.setQueryData(coachKeys.plan(plan.id), plan);
      qc.invalidateQueries({ queryKey: coachKeys.plans() });
    },
  });
}

export const useSavePlan = () => usePlanMutation((input: WorkoutPlanInput) => workoutService.savePlan(input));
export const useDuplicatePlan = () => usePlanMutation((id: string) => workoutService.duplicatePlan(id));
export const useUpdatePlanStatus = () =>
  usePlanMutation(({ id, status }: { id: string; status: PlanStatus }) => workoutService.updatePlanStatus(id, status));
export const useAssignPlan = () =>
  usePlanMutation(({ id, studentId }: { id: string; studentId: string }) => workoutService.assignPlan(id, studentId));

export function useExercises(params: ExerciseFilterParams) {
  return useQuery({ queryKey: coachKeys.exercises(params), queryFn: () => workoutService.getExercises(params), staleTime: 10 * 60_000 });
}

/* -------------------------------- Sessions -------------------------------- */

export function useSessions(params: SessionListParams) {
  return useQuery({ queryKey: coachKeys.sessionList(params), queryFn: () => workoutService.getSessions(params), placeholderData: keepPreviousData });
}

export function useSession(id: string | undefined) {
  return useQuery({ queryKey: coachKeys.session(id ?? ""), queryFn: () => workoutService.getSession(id!), enabled: !!id });
}

export function useAddSessionFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SessionFeedbackInput) => workoutService.addSessionFeedback(input),
    onSuccess: (_fb, input) => {
      qc.invalidateQueries({ queryKey: coachKeys.session(input.sessionId) });
      qc.invalidateQueries({ queryKey: coachKeys.sessions() });
    },
  });
}

export function useMarkSessionReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutService.markSessionReviewed(id),
    onSuccess: (session) => {
      qc.setQueryData(coachKeys.session(session.id), session);
      qc.invalidateQueries({ queryKey: coachKeys.sessions() });
    },
  });
}
