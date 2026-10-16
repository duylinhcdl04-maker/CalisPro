import type { FitnessMetricKey, ISODateString, StudentLevel, StudentRef } from "./common";

export type AssessmentStatus = "UPCOMING" | "DUE" | "OVERDUE" | "COMPLETED" | "NEEDS_REVIEW";
export type AssessmentType = "INITIAL" | "MONTHLY" | "QUARTERLY" | "SKILL_TEST";

export interface AssessmentSummary extends StudentRef {
  id: string;
  title: string;
  type: AssessmentType;
  dueDate: ISODateString;
  completedAt: ISODateString | null;
  overallScore: number | null;
  status: AssessmentStatus;
}

export interface AssessmentListParams {
  status?: AssessmentStatus;
  search?: string;
  studentId?: string;
}

export interface AssessmentStatusCount {
  status: AssessmentStatus;
  count: number;
}

export interface AssessmentMetricComparison {
  key: FitnessMetricKey | "overall";
  label: string;
  previous: number | null;
  /** null while the assessment has not been performed yet. */
  current: number | null;
}

export interface AssessmentTestResult {
  id: string;
  name: string;
  metric: FitnessMetricKey;
  value: number;
  unit: string;
  previousValue: number | null;
}

export interface AssessmentDetail extends AssessmentSummary {
  studentLevel: StudentLevel;
  previousAssessmentDate: ISODateString | null;
  metrics: AssessmentMetricComparison[];
  tests: AssessmentTestResult[];
  /** Suggested focus points computed by the backend from metric deltas. Coach decides which to keep. */
  recommendations: string[];
  coachComment: string | null;
  reviewedAt: ISODateString | null;
}

export interface AssessmentReviewInput {
  assessmentId: string;
  coachComment: string;
  recommendations: string[];
}
