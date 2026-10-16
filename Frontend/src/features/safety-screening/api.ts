import { apiClient } from "../../lib/api/client";

/** Sàng lọc an toàn V2 (ASSESSMENT_FRAMEWORK_V2 §3): không chẩn đoán, chỉ quyết định hạn chế bài tập/bài test. Backend chỉ có khi app.assessment-v2.enabled=true. */

export interface ScreeningOption { code: string; label: string }

export interface ScreeningQuestion {
  code: string;
  text: string;
  instruction: string | null;
  /** SINGLE_CHOICE | MULTIPLE_CHOICE */
  inputType: string;
  required: boolean;
  options: ScreeningOption[];
}

export interface StartScreening { sessionId: number; resumed: boolean }
export interface QuestionsResponse { sessionId: number; questions: ScreeningQuestion[]; answers: Record<string, unknown> }
export interface SaveAnswersResponse { visibleQuestions: string[]; removedQuestions: string[]; answered: number; requiredRemaining: string[] }

export interface ActiveFlag { code: string; sticky: boolean; severity: string }

/** status: CLEARED | REVIEW_REQUIRED | RESTRICTED */
export interface SafetyStatus {
  status: "CLEARED" | "REVIEW_REQUIRED" | "RESTRICTED" | string;
  validUntil: string | null;
  expired: boolean;
  activeFlags: ActiveFlag[];
  constraints: string[];
  clearanceMethod: string;
  acknowledged: boolean;
}

/** status: REQUESTED | UNDER_REVIEW | GRANTED | REJECTED */
export interface Clearance {
  id: number;
  method: string;
  status: string;
  resultingStatus: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  note: string | null;
}

export const safetyApi = {
  /** null khi chưa sàng lọc lần nào (backend trả 400 "Chưa có kết quả sàng lọc an toàn"). */
  status: async (): Promise<SafetyStatus | null> => {
    try {
      return (await apiClient.get<SafetyStatus>("/me/safety-status")).data;
    } catch (e) {
      const r = (e as { response?: { status?: number } }).response;
      if (r?.status === 400) return null;
      throw e;
    }
  },
  start: () => apiClient.post<StartScreening>("/safety-screening/start").then((r) => r.data),
  questions: (sessionId: number) => apiClient.get<QuestionsResponse>(`/safety-screening/${sessionId}/questions`).then((r) => r.data),
  saveAnswers: (sessionId: number, answers: { questionCode: string; value: unknown }[]) =>
    apiClient.put<SaveAnswersResponse>(`/safety-screening/${sessionId}/answers`, { answers }).then((r) => r.data),
  complete: (sessionId: number) => apiClient.post<SafetyStatus>(`/safety-screening/${sessionId}/complete`).then((r) => r.data),
  acknowledge: () => apiClient.post<{ advisoryVersion: string }>("/me/safety-status/acknowledge", {}).then((r) => r.data),
  requestClearance: () =>
    apiClient.post<Clearance>("/me/safety-status/clearance-requests", { method: "COACH_VERIFIED" }).then((r) => r.data),
  clearances: () => apiClient.get<Clearance[]>("/me/safety-status/clearance-requests").then((r) => r.data),
};

/** Backend trả "CODE: nội dung": tách code để UI rẽ nhánh, nội dung để hiển thị. */
export function parseApiError(err: unknown, fallback: string): { code: string | null; message: string } {
  const raw = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (!raw) return { code: null, message: fallback };
  const m = /^([A-Z][A-Z0-9_]+):\s*(.*)$/s.exec(raw);
  return m ? { code: m[1], message: m[2] } : { code: null, message: raw };
}
