import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api/client";

/** EXP chuyên cần (backend /me/exp). Điểm danh hằng ngày chính là check-in sức khỏe (/daily-checkins). */

export interface ExpEvent {
  type: "CHECKIN" | "SESSION" | "GOOD_FORM" | "STREAK7" | "ASSESSMENT" | string;
  ref: string;
  points: number;
  date: string;
}

export interface ExpSummary {
  /** false: rule set chưa bật EXP, check-in vẫn lưu nhưng chưa có điểm. */
  enabled: boolean;
  totalExp: number;
  expLevel: number;
  expInLevel: number;
  expPerLevel: number;
  checkedInToday: boolean;
  streakDays: number;
  windowDays: number | null;
  windowExp: number | null;
  targetExp: number | null;
  attendanceScore: number | null;
  minScore: number | null;
  gatePassed: boolean | null;
  bonusMax: number | null;
  recent: ExpEvent[];
}

export const EXP_EVENT_LABEL: Record<string, string> = {
  CHECKIN: "Điểm danh",
  SESSION: "Hoàn thành buổi tập",
  GOOD_FORM: "Tập đúng form",
  STREAK7: "Chuỗi 7 ngày",
  ASSESSMENT: "Làm đánh giá định kỳ",
};

export interface CheckinInput {
  sleepHours: number;
  energyLevel: number;
  stressLevel: number;
  muscleSoreness: number;
  motivationLevel: number;
  notes?: string;
}

/** Ngày địa phương dạng YYYY-MM-DD (không dùng toISOString vì lệch múi giờ). */
export function localDateKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function useExp() {
  return useQuery({ queryKey: ["me-exp"], queryFn: async () => (await apiClient.get<ExpSummary>("/me/exp")).data, retry: false, staleTime: 30_000 });
}

export function useDailyCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckinInput) =>
      (await apiClient.post("/daily-checkins", { checkinDate: localDateKey(), ...input })).data,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["me-exp"] }); },
  });
}
