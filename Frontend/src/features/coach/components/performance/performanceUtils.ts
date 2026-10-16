import { FITNESS_METRIC_LABEL } from "../../constants/labels";
import { formatDate, formatSeconds } from "../../lib/format";
import type { FitnessMetricKey, FitnessScorePoint, PerformanceMetric, PerformanceRange, PersonalRecordEntry, Severity } from "../../types";
import type { SegmentOption } from "../ui";

export const RANGE_OPTIONS: SegmentOption<PerformanceRange>[] = [
  { value: "4W", label: "4 tuần" },
  { value: "12W", label: "12 tuần" },
  { value: "6M", label: "6 tháng" },
  { value: "1Y", label: "1 năm" },
];

export const RANGE_LABEL: Record<PerformanceRange, string> = { "4W": "4 tuần", "12W": "12 tuần", "6M": "6 tháng", "1Y": "1 năm" };

export const FITNESS_KEYS: FitnessMetricKey[] = ["strength", "endurance", "mobility", "core", "balance"];

export const METRIC_OPTIONS: SegmentOption<PerformanceMetric>[] = (["overall", ...FITNESS_KEYS] as PerformanceMetric[]).map((k) => ({
  value: k,
  label: FITNESS_METRIC_LABEL[k],
}));

export interface MetricSummary {
  current: number | null;
  change: number | null;
}

/** Latest value of a metric and its change from the first point of the range. */
export function summarizeMetric(series: FitnessScorePoint[], metric: PerformanceMetric): MetricSummary {
  if (series.length === 0) return { current: null, change: null };
  const first = series[0][metric];
  const last = series[series.length - 1][metric];
  return { current: last, change: series.length > 1 ? last - first : null };
}

export type ChartRow = { label: string } & Partial<Record<PerformanceMetric, number | null>>;

export function toChartRows(series: FitnessScorePoint[]): ChartRow[] {
  return series.map((p) => ({
    label: formatDate(p.date, "dd/MM"),
    overall: p.overall,
    strength: p.strength,
    endurance: p.endurance,
    mobility: p.mobility,
    core: p.core,
    balance: p.balance,
  }));
}

export function adherenceSeverity(percent: number): Severity {
  if (percent >= 80) return "success";
  if (percent >= 60) return "warning";
  return "critical";
}

export function formatRecord(r: Pick<PersonalRecordEntry, "value" | "unit">): { value: string; unit: string } {
  return r.unit === "sec" ? { value: formatSeconds(r.value), unit: "mm:ss" } : { value: String(r.value), unit: "reps" };
}

export function recordDelta(r: PersonalRecordEntry): number | null {
  return r.previousValue === null ? null : r.value - r.previousValue;
}

export const weekLabel = (iso: string) => formatDate(iso, "dd/MM");
