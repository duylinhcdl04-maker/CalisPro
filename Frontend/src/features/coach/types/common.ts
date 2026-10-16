/** ISO-8601 timestamp string, exactly as the Spring Boot API serialises java.time.Instant / LocalDateTime. */
export type ISODateString = string;

export type TrendDirection = "up" | "down" | "flat";

/** Semantic status used across the coach area: green / amber / red / blue. */
export type Severity = "success" | "warning" | "critical" | "info";

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type StudentLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ELITE";

export type TrainingGoal = "STRENGTH" | "MUSCLE" | "FAT_LOSS" | "SKILL" | "MOBILITY" | "ENDURANCE";

export type FitnessMetricKey = "strength" | "endurance" | "mobility" | "core" | "balance";

export interface FitnessScores {
  strength: number;
  endurance: number;
  mobility: number;
  core: number;
  balance: number;
  overall: number;
}

/** Mirrors Spring Data's Page<T> after mapping to a DTO. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type SortDirection = "asc" | "desc";

/** Minimal student reference embedded in other resources (sessions, alerts, messages...). */
export interface StudentRef {
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
}
