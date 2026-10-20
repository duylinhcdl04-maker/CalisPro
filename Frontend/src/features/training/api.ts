import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api/client";

/** Trang luyện tập: buổi tập hôm nay theo giáo án đang tập, bắt đầu và kết thúc buổi (backend /me/today-workout, /me/training-sessions). */

export interface AiInfo {
  /** Có thể đếm rep hoặc giây giữ bằng camera. */
  ready: boolean;
  /** Có rule đã xuất bản để chấm form. */
  formScoring: boolean;
  movementType: "REPS" | "HOLD" | null;
  cameraView: string | null;
  repTop: number | null;
  repBottom: number | null;
  /** 3 chỉ số landmark MediaPipe tạo góc đo chính của bài. */
  metricPoints: number[];
  note: string;
  /** Coach đã bật tích hợp AI cho bài. */
  enabled?: boolean;
  /** Bài có đủ cấu hình đo (ready = enabled và configured). */
  configured?: boolean;
}

export interface TodayExercise {
  exerciseId: number;
  code: string;
  name: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  section: "WARMUP" | "MAIN" | "ACCESSORY" | "COOLDOWN" | string;
  sequenceNo: number;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  holdSec: number | null;
  restSec: number | null;
  rpe: number | null;
  tempo: string | null;
  notes: string | null;
  instructions: string | null;
  recommended: boolean;
  ai: AiInfo;
}

export interface TodayWorkout {
  state: "NO_PLAN" | "READY" | "CYCLE_DONE";
  message: string | null;
  planId: number | null;
  planName: string | null;
  planSource: "SYSTEM" | "SELF" | null;
  levelCode: string | null;
  cycleNumber: number | null;
  dayId: number | null;
  dayNumber: number | null;
  weekNumber: number | null;
  dayName: string | null;
  focus: string | null;
  estimatedMinutes: number | null;
  sessionsDone: number;
  sessionsPlanned: number;
  activeSessionId: number | null;
  exercises: TodayExercise[];
}

export interface SetResult {
  setNumber: number;
  reps: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  source: "AI" | "MANUAL";
  movementSessionId: number | null;
  /** Chỉ để hiển thị (không gửi lên): điểm form 0-100 do AI chấm. */
  quality?: number | null;
}

export interface FinishPayload {
  status: "COMPLETED" | "ABANDONED";
  durationSeconds: number;
  difficultyRating?: number | null;
  exercises: { exerciseId: number; plannedSets: number; sets: Omit<SetResult, "quality">[] }[];
}

export interface FinishResult {
  sessionId: number;
  status: "COMPLETED" | "ABANDONED";
  completionRatio: number;
  completedSets: number;
  plannedSets: number;
  aiMeasuredSets: number;
}

export const TODAY_KEY = ["today-workout"] as const;

export const trainingApi = {
  today: async () => (await apiClient.get<TodayWorkout>("/me/today-workout")).data,
  start: async (planId: number, dayId: number) => (await apiClient.post<{ sessionId: number; resumed: boolean }>("/me/training-sessions", { planId, dayId })).data,
  finish: async (sessionId: number, payload: FinishPayload) => (await apiClient.put<FinishResult>(`/me/training-sessions/${sessionId}/finish`, payload)).data,
};

export const useTodayWorkout = () => useQuery({ queryKey: TODAY_KEY, queryFn: trainingApi.today, retry: false, refetchOnWindowFocus: false });

export function useStartSession() {
  return useMutation({ mutationFn: ({ planId, dayId }: { planId: number; dayId: number }) => trainingApi.start(planId, dayId) });
}

export function useFinishSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: number; payload: FinishPayload }) => trainingApi.finish(sessionId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TODAY_KEY });
      void qc.invalidateQueries({ queryKey: ["plan-choice"] });
      void qc.invalidateQueries({ queryKey: ["home"] });      // tổng quan: tuần, kỷ lục, buổi kế tiếp
      void qc.invalidateQueries({ queryKey: ["me-exp"] });
    },
  });
}

export const SECTION_LABELS: Record<string, string> = {
  WARMUP: "Khởi động",
  MAIN: "Bài chính",
  ACCESSORY: "Bài bổ trợ",
  COOLDOWN: "Thả lỏng & đo linh hoạt",
};

/** "8-12 lần" | "15 giây" cho phần mô tả bài tập theo giáo án. */
export function prescriptionLabel(e: Pick<TodayExercise, "sets" | "repMin" | "repMax" | "holdSec">): string {
  const per = e.holdSec ? `${e.holdSec} giây` : e.repMin && e.repMax && e.repMin !== e.repMax ? `${e.repMin}-${e.repMax} lần` : `${e.repMax ?? e.repMin ?? 10} lần`;
  return `${e.sets} hiệp × ${per}`;
}
