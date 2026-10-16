import type { FitnessMetricKey, ISODateString } from "./common";
import type { FitnessScorePoint } from "./student";

export type PerformanceRange = "4W" | "12W" | "6M" | "1Y";
export type PerformanceMetric = FitnessMetricKey | "overall";

export interface PerformanceParams {
  /** "ALL" = cohort average across the coach's students. */
  studentId: string | "ALL";
  range: PerformanceRange;
}

export interface PersonalRecordEntry {
  id: string;
  exerciseName: string;
  /** Who holds the record, only set in the cohort ("ALL") view. */
  holderName: string | null;
  value: number;
  unit: "reps" | "sec";
  previousValue: number | null;
  achievedAt: ISODateString;
}

export interface WeeklyAdherence {
  /** ISO date of the week's Monday. */
  weekStart: string;
  planned: number;
  completed: number;
}

export interface AdherenceStats {
  sessionsPlanned: number;
  sessionsCompleted: number;
  adherencePercent: number;
  trainingFrequency: number;
  currentStreak: number;
  longestStreak: number;
  weekly: WeeklyAdherence[];
}

export interface PerformanceReport {
  studentId: string | "ALL";
  range: PerformanceRange;
  series: FitnessScorePoint[];
  personalRecords: PersonalRecordEntry[];
  adherence: AdherenceStats;
}
