import { PerformanceFilterState, PerformanceFitnessLevel, PerformanceStatus } from "../types/performance.types";

export const PERFORMANCE_FITNESS_LEVEL_STYLES: Record<
  PerformanceFitnessLevel,
  { bg: string; text: string; border: string; dot: string }
> = {
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

export const PERFORMANCE_STATUS_STYLES: Record<
  PerformanceStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  Active: {
    label: "Đang hoạt động",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  Improving: {
    label: "Tiến bộ nhanh",
    badgeClass: "bg-[#8CA9FF]/15 text-[#1e3a8a] border-[#8CA9FF]/30 dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF] dark:border-[#8CA9FF]/40",
    dotClass: "bg-[#547EFF] animate-pulse",
  },
  Stable: {
    label: "Duy trì ổn định",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  "At Risk": {
    label: "Nguy cơ giảm sút",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500 animate-ping",
  },
  Inactive: {
    label: "Không tập luyện",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-zinc-400",
  },
};

export const DEFAULT_PERFORMANCE_FILTERS: PerformanceFilterState = {
  searchQuery: "",
  fitnessLevel: "all",
  status: "all",
  exercise: "all",
  timeframe: "8w",
  metricType: "overall",
  dateRange: "01/09/2026 - 28/09/2026",
  riskOnly: false,
};
