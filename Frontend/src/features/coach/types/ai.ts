import type { ISODateString, StudentRef } from "./common";

export type AIReviewStatus = "PENDING_REVIEW" | "REVIEWED";
export type MotionErrorSeverity = "LOW" | "MEDIUM" | "HIGH";
export type RecommendationStatus = "PENDING" | "ACCEPTED" | "DISMISSED";

/** One scored form dimension, e.g. { key: "elbowPosition", label: "Elbow Position", score: 86 }. */
export interface MotionMetric {
  key: string;
  label: string;
  score: number;
  /** Plain-language explanation shown to the coach. */
  description: string;
}

export interface MotionError {
  id: string;
  code: string;
  label: string;
  severity: MotionErrorSeverity;
  /** 1-based rep indices where the error was detected. */
  affectedReps: number[];
  bodyPart: string;
  description: string;
}

export interface AIRecommendation {
  id: string;
  text: string;
  rationale: string;
  status: RecommendationStatus;
}

export interface RepResult {
  rep: number;
  valid: boolean;
  score: number;
  tempoSeconds: number;
}

export interface AIAnalysisSummary extends StudentRef {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  analyzedAt: ISODateString;
  totalReps: number;
  validReps: number;
  invalidReps: number;
  formScore: number;
  previousFormScore: number | null;
  primaryError: string | null;
  reviewStatus: AIReviewStatus;
}

export interface AIAnalysisListParams {
  reviewStatus?: AIReviewStatus;
  search?: string;
  studentId?: string;
}

export interface AIAnalysis extends AIAnalysisSummary {
  modelVersion: string;
  metrics: MotionMetric[];
  errors: MotionError[];
  observations: string[];
  potentialIssue: string;
  recommendations: AIRecommendation[];
  reps: RepResult[];
  coachFeedback: string | null;
  reviewedAt: ISODateString | null;
}

export interface CommonMotionError {
  code: string;
  label: string;
  count: number;
  /** Share of analysed sessions where it appeared, 0-100. */
  percent: number;
}

export interface AIOverview {
  analyzedSessions: number;
  analyzedSessionsChange: number;
  avgFormScore: number;
  avgFormScoreChange: number;
  /** 0-100. */
  invalidRepRate: number;
  invalidRepRateChange: number;
  studentsNeedingReview: number;
  commonErrors: CommonMotionError[];
  formScoreHistory: { date: string; score: number }[];
}

export interface AIFeedbackInput {
  analysisId: string;
  feedback: string;
}
