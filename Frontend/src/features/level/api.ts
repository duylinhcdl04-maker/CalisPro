import { apiClient } from "../../lib/api/client";

/** API Level Engine phía học viên: trạng thái thể lực, chu kỳ tập, bài đánh giá định kỳ. */

export interface LevelDto {
  code: string;
  name: string;
  description?: string;
  status: "PROVISIONAL" | "VERIFIED" | "RETURNING" | string;
  source?: string;
}

export interface CompetencyDto {
  code: string;
  name: string;
  score: number | null;
  observation: number | null;
  band: string;
  confidence: number;
  trend?: string | null;
  source?: string;
  dataQuality?: string;
}

export interface ReasonDto {
  gate: string;
  code: string;
  competency?: string;
  exerciseCode?: string;
  required?: number | null;
  actual?: number | null;
  passed: boolean;
  message: string;
}

export interface EvaluationDto {
  id: string;
  previousLevel?: string;
  candidateLevel?: string;
  finalLevel: string;
  overallScore?: number | null;
  ewmaOverall?: number | null;
  gates: Record<string, string>;
  decision: string;
  reasons: ReasonDto[];
  explanation?: string;
  ruleSet?: string;
  createdAt: string;
}

export interface ConstraintsDto {
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: string[];
  limitations: string[];
  screeningFlag: boolean;
}

export interface FitnessStateDto {
  level: LevelDto | null;
  overallScore: number | null;
  ewmaOverall: number | null;
  competencies: CompetencyDto[];
  weakestCompetency?: string | null;
  nextAssessmentDue?: string | null;
  assessmentDue: boolean;
  baselineRecommended: boolean;
  lastEvaluation?: EvaluationDto | null;
  constraints: ConstraintsDto;
  primaryGoal?: string | null;
  activeCycleId?: string | null;
}

export interface GapDto {
  exerciseId?: string | null;
  exerciseCode?: string | null;
  competency?: string | null;
  required: number;
  current: number;
  deficit: number;
  priority: number;
  kind: string;
  message: string;
}

export interface SkillTreeDto {
  goalReadiness?: { goalCode: string; targetCode: string; status: string; percent: number; missing: GapDto[] } | null;
  gaps: GapDto[];
}

export interface CycleExerciseDto {
  id: string;
  exerciseId: string;
  exerciseCode: string;
  exerciseName: string;
  thumbnailUrl?: string;
  section?: string;
  sets?: number;
  repMin?: number | null;
  repMax?: number | null;
  holdSec?: number | null;
  restSec?: number | null;
  rpe?: number | null;
  notes?: string | null;
  selectionReason?: string | null;
}

export interface CycleDayDto {
  id: string;
  dayNumber: number;
  weekNumber?: number;
  name: string;
  focus?: string;
  restDay: boolean;
  deload: boolean;
  estimatedMinutes?: number;
  exercises: CycleExerciseDto[];
}

export interface CycleDto {
  planId: string;
  cycleNumber?: number;
  name: string;
  description?: string;
  levelCode: string;
  startDate?: string;
  endDate?: string;
  generationReason?: string;
  days: CycleDayDto[];
}

export interface TestResultDto {
  id: string;
  itemId: string;
  validReps?: number | null;
  totalReps?: number | null;
  holdSec?: number | null;
  angleDeg?: number | null;
  formScore?: number | null;
  reliability?: number | null;
  source: string;
  status: string;
  statusReason?: string | null;
}

export interface TestItemDto {
  itemId: string;
  exerciseId: string;
  exerciseCode: string;
  exerciseName: string;
  thumbnailUrl?: string;
  competency: string;
  metric: "VALID_REPS" | "HOLD_SEC" | "ANGLE_DEG";
  mandatory: boolean;
  protocol: { instruction?: string; restSec?: number };
  aiAvailable: boolean;
  result?: TestResultDto | null;
}

export interface StartPeriodicResponse {
  sessionId: string;
  purpose: "BASELINE" | "PERIODIC";
  level: LevelDto;
  estimatedMinutes: number;
  items: TestItemDto[];
  instructions: string[];
}

export interface SubmitTestResultRequest {
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
  movementSessionId?: number;
  source?: "AI_MEASURED" | "SELF_REPORTED";
}

export interface CompletePeriodicResponse {
  evaluation: EvaluationDto;
  competencies: CompetencyDto[];
  overallScore?: number | null;
  gaps: GapDto[];
  cycleId?: string | null;
  cycleName?: string | null;
  retestItems: string[];
}

export const levelApi = {
  state: () => apiClient.get<FitnessStateDto>("/me/fitness-state").then((r) => r.data),
  history: () => apiClient.get<EvaluationDto[]>("/me/level-history").then((r) => r.data),
  skills: () => apiClient.get<SkillTreeDto>("/me/skills").then((r) => r.data),
  cycle: () => apiClient.get<CycleDto>("/me/training-cycle").then((r) => r.data),
  regenerate: (reason = "CONSTRAINT_CHANGED") =>
    apiClient.post<CycleDto>("/me/training-cycle/regenerate", { reason }).then((r) => r.data),
  updateConstraints: (req: Partial<ConstraintsDto> & { regenerate?: boolean }) =>
    apiClient.put<ConstraintsDto>("/me/training-constraints", req).then((r) => r.data),
  startPeriodic: () => apiClient.post<StartPeriodicResponse>("/assessments/periodic/start").then((r) => r.data),
  submitResult: (sessionId: string, itemId: string, req: SubmitTestResultRequest) =>
    apiClient.post<TestResultDto>(`/assessments/periodic/${sessionId}/tests/${itemId}/result`, req).then((r) => r.data),
  completePeriodic: (sessionId: string) =>
    apiClient.post<CompletePeriodicResponse>(`/assessments/periodic/${sessionId}/complete`).then((r) => r.data),
};

export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}
