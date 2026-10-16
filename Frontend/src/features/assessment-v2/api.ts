import { apiClient } from "../../lib/api/client";
import type { BackendExerciseResponse } from "../exercises/api";

/** API đánh giá định kỳ V2 phía học viên (ASSESSMENT_FRAMEWORK_V2 §34). Backend chỉ có các endpoint này khi app.assessment-v2.enabled=true. */

export interface NextStep {
  level: number;
  exerciseCode: string;
  attemptNo: number;
  reason: string;
  restRemainingSec: number;
  metric: "VALID_REPS" | "HOLD_SEC" | "ANGLE_DEG" | null;
  competency: string | null;
}

/** status: PENDING | VALID | INVALID_MEASUREMENT | USER_ABORTED */
export interface PeriodicItem {
  exerciseCode: string;
  competency: string;
  metric: "VALID_REPS" | "HOLD_SEC" | "ANGLE_DEG";
  status: string;
}

export interface StartPeriodic {
  sessionId: number;
  resumed: boolean;
  restSec: number;
  expiresAt: string;
  currentLevel: string;
  targetLevel: string;
  levelStatus: string;
  tests: PeriodicItem[];
  next: NextStep | null;
}

export interface AttemptResult {
  attemptId: number;
  exerciseCode: string;
  attemptNo: number;
  measurementStatus: string;
  invalidReason: string | null;
  reliability: number;
}

export interface CompetencyScore {
  code: string;
  score: number | null;
  coverage: number;
  dataQuality: string;
}

/** outcome: IN_PROGRESS | DECIDED | RETEST_REQUIRED | INSUFFICIENT_EVIDENCE; decision: PROMOTED | MAINTAINED | REGRESSED (chỉ khi DECIDED). */
export interface PeriodicProgress {
  outcome: string;
  decision: string | null;
  levelBefore: string | null;
  levelAfter: string | null;
  levelChanged: boolean;
  reasonCode: string | null;
  blockedGates: Record<string, string> | null;
  l4Review: "PENDING_COACH" | "RECORDING_CONSENT_REQUIRED" | null;
  overallScore: number | null;
  ewma: number | null;
  consecutiveBelow: number | null;
  tests: PeriodicItem[];
  next: NextStep | null;
  lastAttempt: AttemptResult | null;
  retestAfter: string | null;
  rescreenRecommended: boolean;
  competencies: CompetencyScore[];
}

export interface StartBaseline { sessionId: number; resumed: boolean; restSec: number; expiresAt: string; next: NextStep | null }

/** outcome: IN_PROGRESS | VERIFIED | RETEST_REQUIRED (INCOMPLETE do backend trả là IN_PROGRESS). finalLevel chỉ có khi VERIFIED. */
export interface BaselineProgress {
  outcome: string;
  decision: string | null;
  finalLevel: string | null;
  fastTrackConsumed: boolean;
  reasonCode: string | null;
  next: NextStep | null;
  lastAttempt: AttemptResult | null;
  stabilityByLevel: Record<string, string> | null;
  retestAfter: string | null;
  rescreenRecommended: boolean;
  overallScore: number | null;
  competencies: CompetencyScore[];
  l4Review: "PENDING_COACH" | "RECORDING_CONSENT_REQUIRED" | null;
}

export interface SubmitAttempt {
  exerciseCode: string;
  movementSessionId: number;
  startedAt: string;
  endedAt: string;
  totalReps?: number;
  validReps?: number;
  holdSec?: number;
  angleDeg?: number;
  formScore?: number;
  romScore?: number;
  majorViolations?: number;
  poseConfidenceAvg?: number;
  visibilityAvg?: number;
  trackedRatio?: number;
  userAborted?: boolean;
  abortReason?: "PAIN" | "USER_STOPPED";
}

export interface LevelHistoryItem {
  at: string;
  kind: string;
  outcome: string;
  decision: string | null;
  levelBefore: string | null;
  levelAfter: string | null;
  reasonCode: string | null;
}

export interface LevelState {
  levelCode: string;
  levelRank: number;
  status: "PROVISIONAL" | "VERIFIED" | "RETURNING" | string;
  source: string;
  ewma: number | null;
  lastAssessedAt: string | null;
  nextAssessmentEarliest: string | null;
  /** OPEN | TOO_SOON | CYCLE_IN_PROGRESS: đo định kỳ chỉ mở khi hết chu kỳ tập. */
  periodicGate?: "OPEN" | "TOO_SOON" | "CYCLE_IN_PROGRESS" | string;
  cycleEnd?: string | null;
  cycleSessionsDone?: number;
  cycleSessionsPlanned?: number;
  l4Review: string | null;
  history: LevelHistoryItem[];
}

export interface L4ReviewMine {
  id: number;
  status: string;
  verifiedLevel: string;
  pendingLevel: string;
  decisionReason: string | null;
  confirmedLevel: string | null;
  expiresAt: string;
}

export interface RetakeInfo { eligible: boolean; used: boolean; availableUntil: string | null; firstLevel: string | null; retakeLevel: string | null; maxRetakes: number }

/** displayLabel: VERIFIED (đã đo) | PROVISIONAL (tạm thời, từ khảo sát tự khai) | NONE. verifiedPartial = kết thúc sớm nên level là mức tối thiểu. */
export interface LevelStatus {
  provisionalLevel: string | null;
  provisionalCap: string | null;
  verifiedLevel: string | null;
  verifiedPartial: boolean;
  displayLevel: string | null;
  displayLabel: "VERIFIED" | "PROVISIONAL" | "NONE";
  retake: RetakeInfo;
  deferredUntil: string | null;
}

export const baselineApi = {
  start: () => apiClient.post<StartBaseline>("/assessments/baseline/start").then((r) => r.data),
  /** Kết thúc sớm (vd không có dụng cụ): chốt level theo các bài đã đo đủ. 409 nếu chưa đủ bằng chứng. */
  finishEarly: (sessionId: number) => apiClient.post<BaselineProgress>(`/assessments/baseline/${sessionId}/finish-early`).then((r) => r.data),
  /** "Bỏ qua, đo sau": dùng level tạm từ khảo sát. */
  defer: () => apiClient.post<{ remindAfter: string; deferCount: number }>("/assessments/baseline/defer").then((r) => r.data),
  levelStatus: () => apiClient.get<LevelStatus>("/me/assessment-v2/level-status").then((r) => r.data),
  next: (sessionId: number) => apiClient.get<BaselineProgress>(`/assessments/baseline/${sessionId}/next`).then((r) => r.data),
  submit: (sessionId: number, req: SubmitAttempt) =>
    apiClient.post<BaselineProgress>(`/assessments/baseline/${sessionId}/attempts`, req).then((r) => r.data),
};

export const periodicApi = {
  /** null khi chưa có level đã xác minh (HTTP 204): cần Baseline trước. */
  level: async (): Promise<LevelState | null> => {
    const r = await apiClient.get<LevelState | "">("/me/assessment-v2/level");
    return r.status === 204 || !r.data ? null : (r.data as LevelState);
  },
  l4Review: async (): Promise<L4ReviewMine | null> => {
    const r = await apiClient.get<L4ReviewMine | "">("/me/l4-review");
    return r.status === 204 || !r.data ? null : (r.data as L4ReviewMine);
  },
  start: () => apiClient.post<StartPeriodic>("/assessments/periodic/start").then((r) => r.data),
  next: (sessionId: number) => apiClient.get<PeriodicProgress>(`/assessments/periodic/${sessionId}/next`).then((r) => r.data),
  submit: (sessionId: number, req: SubmitAttempt) =>
    apiClient.post<PeriodicProgress>(`/assessments/periodic/${sessionId}/attempts`, req).then((r) => r.data),
  exercises: () => apiClient.get<BackendExerciseResponse[]>("/exercises").then((r) => r.data),
};

export function apiMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}
