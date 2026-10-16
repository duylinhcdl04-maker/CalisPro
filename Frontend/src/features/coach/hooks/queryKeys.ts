import type {
  AIAnalysisListParams,
  AssessmentListParams,
  CalendarRangeParams,
  ExerciseFilterParams,
  PerformanceParams,
  PlanListParams,
  SessionListParams,
  StudentListParams,
} from "../types";
import type { NotificationListParams } from "../services/notificationService";

/** Single source of truth for coach query keys, so mutations can invalidate precisely. */
export const coachKeys = {
  all: ["coach"] as const,
  dashboard: () => [...coachKeys.all, "dashboard"] as const,
  aiStatus: () => [...coachKeys.all, "ai-status"] as const,
  profile: () => [...coachKeys.all, "profile"] as const,
  settings: () => [...coachKeys.all, "settings"] as const,

  students: () => [...coachKeys.all, "students"] as const,
  studentList: (params: StudentListParams) => [...coachKeys.students(), "list", params] as const,
  studentOptions: () => [...coachKeys.students(), "options"] as const,
  student: (id: string) => [...coachKeys.students(), "detail", id] as const,
  studentNotes: (id: string) => [...coachKeys.students(), "notes", id] as const,
  attention: () => [...coachKeys.students(), "attention"] as const,

  assessments: () => [...coachKeys.all, "assessments"] as const,
  assessmentList: (params: AssessmentListParams) => [...coachKeys.assessments(), "list", params] as const,
  assessmentCounts: () => [...coachKeys.assessments(), "counts"] as const,
  assessment: (id: string) => [...coachKeys.assessments(), "detail", id] as const,

  plans: () => [...coachKeys.all, "plans"] as const,
  planList: (params: PlanListParams) => [...coachKeys.plans(), "list", params] as const,
  plan: (id: string) => [...coachKeys.plans(), "detail", id] as const,
  exercises: (params: ExerciseFilterParams) => [...coachKeys.all, "exercises", params] as const,

  sessions: () => [...coachKeys.all, "sessions"] as const,
  sessionList: (params: SessionListParams) => [...coachKeys.sessions(), "list", params] as const,
  session: (id: string) => [...coachKeys.sessions(), "detail", id] as const,

  ai: () => [...coachKeys.all, "ai"] as const,
  aiOverview: () => [...coachKeys.ai(), "overview"] as const,
  aiList: (params: AIAnalysisListParams) => [...coachKeys.ai(), "list", params] as const,
  aiAnalysis: (id: string) => [...coachKeys.ai(), "detail", id] as const,

  performance: (params: PerformanceParams) => [...coachKeys.all, "performance", params] as const,

  notifications: () => [...coachKeys.all, "notifications"] as const,
  notificationList: (params: NotificationListParams) => [...coachKeys.notifications(), "list", params] as const,

  conversations: () => [...coachKeys.all, "conversations"] as const,
  messages: (conversationId: string) => [...coachKeys.conversations(), "messages", conversationId] as const,

  calendar: () => [...coachKeys.all, "calendar"] as const,
  calendarRange: (range: CalendarRangeParams) => [...coachKeys.calendar(), range] as const,

  l4Reviews: () => [...coachKeys.all, "l4-reviews"] as const,
  l4ReviewList: (status: string) => [...coachKeys.l4Reviews(), "list", status] as const,
  l4Review: (id: number) => [...coachKeys.l4Reviews(), "detail", id] as const,

  safetyClearances: () => [...coachKeys.all, "safety-clearances"] as const,
  safetyClearanceList: (status: string) => [...coachKeys.safetyClearances(), "list", status] as const,
  safetyClearance: (id: number) => [...coachKeys.safetyClearances(), "detail", id] as const,

  ruleSets: () => [...coachKeys.all, "rule-sets"] as const,
  ruleSetList: () => [...coachKeys.ruleSets(), "list"] as const,
  ruleSet: (id: number) => [...coachKeys.ruleSets(), "detail", id] as const,
};
