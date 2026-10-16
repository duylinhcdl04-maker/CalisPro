import { FitnessDimensionType, FitnessLevel, FitnessProfilesFilterState } from "../types/fitnessProfile";

export const FITNESS_DIMENSION_LABELS: Record<FitnessDimensionType, string> = {
  strength: "Sức mạnh (Strength)",
  endurance: "Sức bền (Endurance)",
  mobility: "Linh hoạt (Mobility)",
  core: "Cơ trung tâm (Core)",
  balance: "Thăng bằng (Balance)",
  skill: "Kỹ năng (Skill)",
};

export const FITNESS_DIMENSION_SHORT_LABELS: Record<FitnessDimensionType, string> = {
  strength: "Sức mạnh",
  endurance: "Sức bền",
  mobility: "Linh hoạt",
  core: "Core",
  balance: "Thăng bằng",
  skill: "Kỹ năng",
};

export const FITNESS_DIMENSION_COLORS: Record<FitnessDimensionType, string> = {
  strength: "#E07A5F", // Warm coral red-orange
  endurance: "#3FA56B", // Forest Green
  mobility: "#5B86C5", // Slate Blue
  core: "#E7A74E", // Amber Ochre
  balance: "#8E7DBE", // Soft Purple
  skill: "#4EA8DE", // Sky Cyan
};

export const FITNESS_LEVEL_COLORS: Record<FitnessLevel, { bg: string; text: string; border: string; dot: string }> = {
  Beginner: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  Intermediate: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  Advanced: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    dot: "bg-purple-500",
  },
  Elite: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    dot: "bg-amber-500",
  },
};

export const PROFILE_STATUS_STYLES = {
  Healthy: {
    label: "Khỏe mạnh",
    badgeClass: "whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  "Needs Attention": {
    label: "Cần chú ý",
    badgeClass: "whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  "Reassessment Due": {
    label: "Đến hạn test",
    badgeClass: "whitespace-nowrap bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500 animate-pulse",
  },
  Inactive: {
    label: "Tạm ngưng",
    badgeClass: "whitespace-nowrap bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-zinc-400",
  },
  Injured: {
    label: "Chấn thương",
    badgeClass: "whitespace-nowrap bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
};

export const DEFAULT_FITNESS_FILTER: FitnessProfilesFilterState = {
  searchQuery: "",
  level: "all",
  goal: "all",
  status: "all",
  assessmentType: "all",
  timeframe: "30d",
  dimensionFilter: "all",
  overdueOnly: false,
};
