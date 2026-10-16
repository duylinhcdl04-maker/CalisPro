import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api/client";

/** Bước quyết định "giáo án hệ thống hay tự tạo", danh sách bài tập tự tạo và gợi ý bài tập (backend /me/plan-choice, /me/self-plan, /me/exercise-recommendations). */

export type PlanMode = "SYSTEM" | "SELF";
export type TrainingFocus = "HEALTH" | "SKILL";

export interface PlanChoiceStatus {
  levelCode: string | null;
  planMode: PlanMode | null;
  effectiveMode: PlanMode | null;
  needsDecision: boolean;
  trainingFocus: TrainingFocus | null;
  activePlanId: number | null;
  activePlanName: string | null;
  activePlanSource: PlanMode | null;
}

/** Một bài trong danh sách tự tạo. Danh sách này KHÔNG dùng để nâng/hạ level. */
export interface SelfPlanItem {
  exerciseId: number;
  name: string;
  thumbnailUrl: string | null;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  holdSec: number | null;
  restSec: number | null;
}

export interface SelfPlanInput {
  exerciseId: number;
  sets?: number | null;
  repMin?: number | null;
  repMax?: number | null;
  holdSec?: number | null;
  restSec?: number | null;
}

export interface SelfPlanView {
  planId: number | null;
  active: boolean;
  items: SelfPlanItem[];
}

export const planChoiceApi = {
  status: async () => (await apiClient.get<PlanChoiceStatus>("/me/plan-choice")).data,
  choose: async (mode: PlanMode, trainingFocus?: TrainingFocus | null) =>
    (await apiClient.post<PlanChoiceStatus>("/me/plan-choice", { mode, trainingFocus: trainingFocus ?? null })).data,
  setFocus: async (trainingFocus: TrainingFocus | null) => (await apiClient.put<PlanChoiceStatus>("/me/training-focus", { trainingFocus })).data,
  selfPlan: async () => (await apiClient.get<SelfPlanView>("/me/self-plan")).data,
  saveSelfPlan: async (items: SelfPlanInput[]) => (await apiClient.put<SelfPlanView>("/me/self-plan", { items })).data,
};

export const PLAN_CHOICE_KEY = ["plan-choice"] as const;

export const usePlanChoice = () => useQuery({ queryKey: PLAN_CHOICE_KEY, queryFn: planChoiceApi.status, retry: false });

/** Sau khi đổi cách tập, chu kỳ và lộ trình thay đổi theo nên làm mới các dữ liệu liên quan. */
export function useInvalidatePlans() {
  const qc = useQueryClient();
  return () => {
    for (const key of [PLAN_CHOICE_KEY, ["exercise-recommendations"], ["fitness-state"], ["training-cycle"], ["roadmap"], ["home"]]) qc.invalidateQueries({ queryKey: key });
  };
}

export function useChoosePlan() {
  const refresh = useInvalidatePlans();
  return useMutation({ mutationFn: (v: { mode: PlanMode; focus?: TrainingFocus | null }) => planChoiceApi.choose(v.mode, v.focus), onSuccess: refresh });
}

export function useSetFocus() {
  const refresh = useInvalidatePlans();
  return useMutation({ mutationFn: (focus: TrainingFocus | null) => planChoiceApi.setFocus(focus), onSuccess: refresh });
}

export const SELF_PLAN_KEY = ["self-plan"] as const;

export const useSelfPlan = () => useQuery({ queryKey: SELF_PLAN_KEY, queryFn: planChoiceApi.selfPlan, retry: false });

export function useSaveSelfPlan() {
  const refresh = useInvalidatePlans();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: SelfPlanInput[]) => planChoiceApi.saveSelfPlan(items),
    onSuccess: (data) => { qc.setQueryData(SELF_PLAN_KEY, data); refresh(); },
  });
}

export function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  const raw = anyErr?.response?.data?.message;
  if (!raw) return fallback;
  return raw.replace(/^[A-Z_]+:\s*/, "");
}

export interface RecommendedExercise {
  exerciseId: number;
  code: string;
  name: string;
  thumbnailUrl: string | null;
  competency: string | null;
  reason: string;
}

export interface Recommendations {
  source: "PLAN" | "GOAL" | "FOUNDATION" | "WEAK_AREAS";
  title: string;
  items: RecommendedExercise[];
}

export const useExerciseRecommendations = () =>
  useQuery({ queryKey: ["exercise-recommendations"], queryFn: async () => (await apiClient.get<Recommendations>("/me/exercise-recommendations")).data, retry: false });

export interface RecommendedIds {
  source: "PLAN" | "FOCUS" | "NONE";
  ids: number[];
}

/** Tập mã bài được đánh dấu "Đề xuất cho bạn" (so khớp theo chuỗi vì mã bài ở danh sách là chuỗi). */
export function useRecommendedSet() {
  const q = useQuery({ queryKey: ["exercise-recommendations", "ids"], queryFn: async () => (await apiClient.get<RecommendedIds>("/me/exercise-recommendations/ids")).data, retry: false, staleTime: 60_000 });
  return { source: q.data?.source ?? "NONE", has: (id: string | number) => !!q.data && q.data.ids.includes(Number(id)) };
}
