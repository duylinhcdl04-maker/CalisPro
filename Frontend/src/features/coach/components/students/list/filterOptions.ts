import { GOAL_LABEL, LEVEL_LABEL, STUDENT_STATUS } from "../../../constants/labels";
import type {
  LastActiveBucket,
  SortDirection,
  StudentLevel,
  StudentSortKey,
  StudentStatus,
  TrainingFrequencyBucket,
  TrainingGoal,
  TrendDirection,
} from "../../../types";

export interface Option<T extends string> {
  value: T;
  label: string;
}

const toOptions = <T extends string>(record: Record<T, string>): Option<T>[] =>
  (Object.keys(record) as T[]).map((value) => ({ value, label: record[value] }));

export const LEVEL_OPTIONS = toOptions<StudentLevel>(LEVEL_LABEL);
export const GOAL_OPTIONS = toOptions<TrainingGoal>(GOAL_LABEL);
export const STATUS_OPTIONS: Option<StudentStatus>[] = (Object.keys(STUDENT_STATUS) as StudentStatus[]).map((value) => ({
  value,
  label: STUDENT_STATUS[value].label,
}));

export const FREQUENCY_OPTIONS = toOptions<TrainingFrequencyBucket>({
  LOW: "Thấp (dưới 2,5 buổi/tuần)",
  MEDIUM: "Vừa (2,5 đến 4 buổi/tuần)",
  HIGH: "Cao (từ 4 buổi/tuần)",
});

export const PERFORMANCE_OPTIONS = toOptions<TrendDirection>({
  up: "Đang tiến bộ",
  flat: "Đi ngang",
  down: "Đang giảm",
});

export const LAST_ACTIVE_OPTIONS = toOptions<LastActiveBucket>({
  "7D": "Trong 7 ngày",
  "14D": "Trong 14 ngày",
  "30D": "Trong 30 ngày",
  "30D_PLUS": "Hơn 30 ngày",
});

export const SORT_KEYS: readonly StudentSortKey[] = ["name", "fitnessScore", "streak", "adherence", "lastWorkoutAt", "level"];
export const SORT_DIRS: readonly SortDirection[] = ["asc", "desc"];

/** Narrow an untrusted URL value to one of the allowed options. */
export function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export const values = <T extends string>(options: Option<T>[]): T[] => options.map((o) => o.value);
