import { apiClient } from "../../../lib/api/client";
import { withLatency } from "../../../services/mock/latency";

/**
 * Set VITE_USE_MOCK_API=false once the Spring Boot backend is available.
 * Every service method has a real REST branch, so UI code never changes.
 */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

/** Relative to apiClient's baseURL (VITE_API_BASE_URL, default "/api/v1"). */
export const COACH_ENDPOINTS = {
  dashboard: "/coach/dashboard",
  aiStatus: "/coach/ai/status",
  profile: "/coach/profile",
  settings: "/coach/settings",
  password: "/coach/settings/password",
  students: "/coach/students",
  student: (id: string) => `/coach/students/${id}`,
  studentNotes: (id: string) => `/coach/students/${id}/notes`,
  attention: "/coach/students/attention",
  assessments: "/coach/assessments",
  assessmentCounts: "/coach/assessments/counts",
  assessment: (id: string) => `/coach/assessments/${id}`,
  assessmentReview: (id: string) => `/coach/assessments/${id}/review`,
  plans: "/coach/plans",
  plan: (id: string) => `/coach/plans/${id}`,
  planDuplicate: (id: string) => `/coach/plans/${id}/duplicate`,
  planStatus: (id: string) => `/coach/plans/${id}/status`,
  planAssign: (id: string) => `/coach/plans/${id}/assign`,
  exercises: "/exercises",
  sessions: "/coach/sessions",
  session: (id: string) => `/coach/sessions/${id}`,
  sessionFeedback: (id: string) => `/coach/sessions/${id}/feedback`,
  sessionReview: (id: string) => `/coach/sessions/${id}/review`,
  aiOverview: "/coach/ai-analysis/overview",
  aiAnalyses: "/coach/ai-analysis",
  aiAnalysis: (id: string) => `/coach/ai-analysis/${id}`,
  aiRecommendation: (id: string, recId: string) => `/coach/ai-analysis/${id}/recommendations/${recId}`,
  aiFeedback: (id: string) => `/coach/ai-analysis/${id}/feedback`,
  aiReview: (id: string) => `/coach/ai-analysis/${id}/review`,
  performance: "/coach/performance",
  notifications: "/coach/notifications",
  notificationRead: (id: string) => `/coach/notifications/${id}/read`,
  notificationsReadAll: "/coach/notifications/read-all",
  conversations: "/coach/conversations",
  conversationMessages: (id: string) => `/coach/conversations/${id}/messages`,
  conversationRead: (id: string) => `/coach/conversations/${id}/read`,
  calendar: "/coach/calendar/events",
  calendarEvent: (id: string) => `/coach/calendar/events/${id}`,
  calendarCancel: (id: string) => `/coach/calendar/events/${id}/cancel`,
  l4Reviews: "/coach/l4-reviews",
  l4Review: (id: number) => `/coach/l4-reviews/${id}`,
  l4ReviewDecision: (id: number) => `/coach/l4-reviews/${id}/decision`,
  safetyClearances: "/coach/safety-clearances",
  safetyClearance: (id: number) => `/coach/safety-clearances/${id}`,
  safetyClearanceDecision: (id: number) => `/coach/safety-clearances/${id}/decision`,
  ruleSets: "/coach/assessment-v2/rule-sets",
  ruleSet: (id: number) => `/coach/assessment-v2/rule-sets/${id}`,
  ruleSetClone: (id: number) => `/coach/assessment-v2/rule-sets/${id}/clone`,
  ruleSetSubmit: (id: number) => `/coach/assessment-v2/rule-sets/${id}/submit`,
} as const;

export const api = {
  get: async <T>(url: string, params?: object) => (await apiClient.get<T>(url, { params })).data,
  post: async <T>(url: string, body?: unknown) => (await apiClient.post<T>(url, body)).data,
  put: async <T>(url: string, body?: unknown) => (await apiClient.put<T>(url, body)).data,
  patch: async <T>(url: string, body?: unknown) => (await apiClient.patch<T>(url, body)).data,
};

/** Resolve a deep copy after simulated latency, so callers can never mutate the mock store through the cache. */
export function mockResponse<T>(value: T, ms = 450): Promise<T> {
  return withLatency(structuredClone(value), ms);
}

export function paginate<T>(items: T[], page = 1, pageSize = 10) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function includesText(haystack: (string | null | undefined)[], needle?: string) {
  if (!needle) return true;
  const n = needle.trim().toLowerCase();
  return haystack.some((h) => h?.toLowerCase().includes(n));
}
