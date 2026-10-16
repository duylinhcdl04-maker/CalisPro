import type { ISODateString, StudentRef } from "./common";

export type SessionStatus = "COMPLETED" | "PARTIAL" | "MISSED";
export type ReviewStatus = "PENDING" | "REVIEWED";

export interface WorkoutSessionSummary extends StudentRef {
  id: string;
  workoutName: string;
  planName: string | null;
  durationMinutes: number;
  /** 0-100. */
  completionPercent: number;
  formScore: number | null;
  validReps: number;
  totalReps: number;
  date: ISODateString;
  status: SessionStatus;
  reviewStatus: ReviewStatus;
}

export interface SessionListParams {
  search?: string;
  status?: SessionStatus;
  reviewStatus?: ReviewStatus;
  studentId?: string;
  page?: number;
  pageSize?: number;
}

export interface SessionExerciseResult {
  id: string;
  exerciseId: string;
  exerciseName: string;
  imageUrl: string;
  targetSets: number;
  targetReps: number;
  /** One entry per performed set. */
  actualReps: number[];
  formScore: number | null;
  validReps: number;
  invalidReps: number;
  restSeconds: number;
  aiAnalysisId: string | null;
}

export type FeedbackType = "PRAISE" | "CORRECTION" | "GENERAL";

export interface SessionFeedback {
  id: string;
  authorName: string;
  type: FeedbackType;
  content: string;
  createdAt: ISODateString;
}

export interface SessionFeedbackInput {
  sessionId: string;
  type: FeedbackType;
  content: string;
}

export interface WorkoutSessionDetail extends WorkoutSessionSummary {
  /** Session RPE reported by the student, 1-10. */
  rpe: number | null;
  avgHeartRate: number | null;
  studentNote: string | null;
  exercises: SessionExerciseResult[];
  feedback: SessionFeedback[];
}
