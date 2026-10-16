import type { LabelTone } from "../../../constants/labels";
import type { AIReviewStatus, FitnessMetricKey, PerformanceRange, Severity } from "../../../types";
import type { SegmentOption } from "../../ui";

export type StudentDetailTab = "overview" | "assessments" | "sessions" | "progress" | "ai" | "notes";

export const DETAIL_TABS: SegmentOption<StudentDetailTab>[] = [
  { value: "overview", label: "Tổng quan" },
  { value: "assessments", label: "Đánh giá" },
  { value: "sessions", label: "Buổi tập" },
  { value: "progress", label: "Tiến độ" },
  { value: "ai", label: "AI Analysis" },
  { value: "notes", label: "Ghi chú" },
];

export function parseTab(value: string | null): StudentDetailTab {
  return DETAIL_TABS.some((t) => t.value === value) ? (value as StudentDetailTab) : "overview";
}

export const METRIC_KEYS: FitnessMetricKey[] = ["strength", "endurance", "mobility", "core", "balance"];

export const RANGE_OPTIONS: SegmentOption<PerformanceRange>[] = [
  { value: "4W", label: "4 tuần" },
  { value: "12W", label: "12 tuần" },
  { value: "6M", label: "6 tháng" },
  { value: "1Y", label: "1 năm" },
];

export const SEVERITY_LABEL: Record<Severity, LabelTone> = {
  critical: { label: "Nghiêm trọng", tone: "critical" },
  warning: { label: "Cần chú ý", tone: "warning" },
  info: { label: "Thông tin", tone: "info" },
  success: { label: "Tốt", tone: "success" },
};

export const AI_REVIEW_STATUS: Record<AIReviewStatus, LabelTone> = {
  PENDING_REVIEW: { label: "Chờ review", tone: "accent" },
  REVIEWED: { label: "Đã review", tone: "neutral" },
};

/** 16 -> "1 năm 4 tháng". */
export function formatExperience(months: number): string {
  if (months < 12) return `${months} tháng`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} năm ${m} tháng` : `${y} năm`;
}

/** Reads the HTTP status from either a mock error or an axios error. */
export function errorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("status" in error && typeof error.status === "number") return error.status;
  if ("response" in error && typeof error.response === "object" && error.response !== null && "status" in error.response) {
    const s = error.response.status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

export const stagger = (i: number, step = 60) => ({ animationDelay: `${i * step}ms` });
