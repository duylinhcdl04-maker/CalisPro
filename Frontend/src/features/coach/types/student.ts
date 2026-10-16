import type {
  FitnessScores,
  ISODateString,
  SortDirection,
  StudentLevel,
  StudentRef,
  TrainingGoal,
  TrendDirection,
  Severity,
} from "./common";

export type StudentStatus = "ACTIVE" | "NEEDS_ATTENTION" | "INACTIVE" | "PAUSED" | "NEW";

export interface Student {
  id: string;
  /** Human-facing student code, searchable (e.g. "CH-1024"). */
  code: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  level: StudentLevel;
  goal: TrainingGoal;
  status: StudentStatus;
  fitnessScore: number;
  performanceTrend: TrendDirection;
  streak: number;
  /** 0-100, completed / planned sessions over the last 4 weeks. */
  adherence: number;
  /** Average sessions per week over the last 4 weeks. */
  trainingFrequency: number;
  lastWorkoutAt: ISODateString | null;
  joinedAt: ISODateString;
  needsAttention: boolean;
  tags: string[];
}

export type TrainingFrequencyBucket = "LOW" | "MEDIUM" | "HIGH";
export type LastActiveBucket = "7D" | "14D" | "30D" | "30D_PLUS";

export type StudentSortKey = "name" | "fitnessScore" | "streak" | "adherence" | "lastWorkoutAt" | "level";

export interface StudentListParams {
  search?: string;
  level?: StudentLevel;
  goal?: TrainingGoal;
  status?: StudentStatus;
  frequency?: TrainingFrequencyBucket;
  performance?: TrendDirection;
  lastActive?: LastActiveBucket;
  needsAttention?: boolean;
  sortBy?: StudentSortKey;
  sortDir?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface StudentPlanSummary {
  planId: string;
  planName: string;
  currentWeek: number;
  totalWeeks: number;
  progressPercent: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  adherence: number;
}

export interface FitnessScorePoint extends FitnessScores {
  /** ISO date (yyyy-MM-dd). */
  date: string;
}

export type CoachNoteCategory = "GENERAL" | "TECHNIQUE" | "INJURY" | "PROGRESS" | "MOTIVATION";

export interface CoachNote {
  id: string;
  studentId: string;
  authorName: string;
  category: CoachNoteCategory;
  content: string;
  pinned: boolean;
  createdAt: ISODateString;
}

export interface CoachNoteInput {
  studentId: string;
  category: CoachNoteCategory;
  content: string;
  pinned: boolean;
}

/** Read-only summary of what AI Motion detected recently for a student. Coaches cannot edit AI rules. */
export interface StudentAIInsight {
  id: string;
  exerciseName: string;
  label: string;
  detail: string;
  severity: Severity;
  analysisId: string;
  detectedAt: ISODateString;
}

export interface StudentDetail extends Student {
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  heightCm: number;
  weightKg: number;
  trainingExperienceMonths: number;
  fitness: FitnessScores;
  limitations: string[];
  currentPlan: StudentPlanSummary | null;
  fitnessHistory: FitnessScorePoint[];
  aiInsights: StudentAIInsight[];
}

export type AttentionType =
  | "INACTIVE"
  | "PERFORMANCE_DROP"
  | "FORM_DROP"
  | "ASSESSMENT_OVERDUE"
  | "SUBSCRIPTION"
  | "INJURY"
  | "LOW_ADHERENCE";

export interface AttentionAlert extends StudentRef {
  id: string;
  type: AttentionType;
  severity: Severity;
  title: string;
  detail: string;
  metric: { from: number; to: number; unit?: string } | null;
  createdAt: ISODateString;
}
