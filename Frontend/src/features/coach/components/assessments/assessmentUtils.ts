import { differenceInCalendarDays } from "date-fns";
import type { Tone } from "../../constants/labels";
import { formatDate, formatSeconds } from "../../lib/format";
import type { AssessmentMetricComparison, AssessmentStatus, AssessmentStatusCount, AssessmentSummary, FitnessMetricKey } from "../../types";

/** List tabs. "DUE" groups DUE + OVERDUE so the coach sees everything that needs action now. */
export type AssessmentTab = "ALL" | "UPCOMING" | "DUE" | "NEEDS_REVIEW" | "COMPLETED";

export const ASSESSMENT_TABS: { value: AssessmentTab; label: string; statuses: AssessmentStatus[] | null }[] = [
  { value: "ALL", label: "Tất cả", statuses: null },
  { value: "UPCOMING", label: "Sắp tới", statuses: ["UPCOMING"] },
  { value: "DUE", label: "Đến hạn", statuses: ["DUE", "OVERDUE"] },
  { value: "NEEDS_REVIEW", label: "Cần review", statuses: ["NEEDS_REVIEW"] },
  { value: "COMPLETED", label: "Hoàn thành", statuses: ["COMPLETED"] },
];

/** Maps a `?status=` query value (from dashboard / notification links) to a tab. */
export function tabFromParam(raw: string | null): AssessmentTab {
  if (raw === "OVERDUE") return "DUE";
  return ASSESSMENT_TABS.some((t) => t.value === raw) ? (raw as AssessmentTab) : "ALL";
}

/** The single status sent to the API for a tab; the grouped "DUE" tab fetches all and filters locally. */
export function apiStatusForTab(tab: AssessmentTab): AssessmentStatus | undefined {
  const statuses = ASSESSMENT_TABS.find((t) => t.value === tab)?.statuses;
  return statuses && statuses.length === 1 ? statuses[0] : undefined;
}

export function filterForTab(items: AssessmentSummary[], tab: AssessmentTab): AssessmentSummary[] {
  const statuses = ASSESSMENT_TABS.find((t) => t.value === tab)?.statuses;
  return statuses ? items.filter((a) => statuses.includes(a.status)) : items;
}

export function countForTab(counts: AssessmentStatusCount[] | undefined, tab: AssessmentTab): number | undefined {
  if (!counts) return undefined;
  const statuses = ASSESSMENT_TABS.find((t) => t.value === tab)?.statuses;
  return counts.filter((c) => !statuses || statuses.includes(c.status)).reduce((s, c) => s + c.count, 0);
}

export const isDone = (status: AssessmentStatus) => status === "COMPLETED" || status === "NEEDS_REVIEW";

/** Human due-date hint: "Quá hạn 3 ngày", "Hôm nay", "Ngày mai", "Còn 5 ngày". */
export function dueHint(a: Pick<AssessmentSummary, "dueDate" | "completedAt" | "status">, now = new Date()): { text: string; tone: Tone } {
  if (a.completedAt) return { text: `Làm ngày ${formatDate(a.completedAt, "dd/MM")}`, tone: "neutral" };
  const days = differenceInCalendarDays(new Date(a.dueDate), now);
  if (days < 0) return { text: `Quá hạn ${Math.abs(days)} ngày`, tone: "critical" };
  if (days === 0) return { text: "Hôm nay", tone: "warning" };
  if (days === 1) return { text: "Ngày mai", tone: "warning" };
  return { text: `Còn ${days} ngày`, tone: "neutral" };
}

export function metricDelta(m: Pick<AssessmentMetricComparison, "previous" | "current">): number | null {
  return m.previous !== null && m.current !== null ? m.current - m.previous : null;
}

type Scores = Record<FitnessMetricKey, number>;
const RADAR_KEYS: FitnessMetricKey[] = ["strength", "endurance", "mobility", "core", "balance"];

/** Builds radar inputs from the metric comparison list; previous is null when any value is missing. */
export function radarScores(metrics: AssessmentMetricComparison[]): { current: Scores | null; previous: Scores | null } {
  const pick = (field: "current" | "previous"): Scores | null => {
    const out = {} as Scores;
    for (const k of RADAR_KEYS) {
      const v = metrics.find((m) => m.key === k)?.[field];
      if (v === null || v === undefined) return null;
      out[k] = v;
    }
    return out;
  };
  return { current: pick("current"), previous: pick("previous") };
}

const TIME_UNITS = new Set(["giây", "sec", "s"]);
export const isTimeUnit = (unit: string) => TIME_UNITS.has(unit);

export function formatTestValue(value: number | null, unit: string): string {
  if (value === null) return "-";
  return isTimeUnit(unit) ? formatSeconds(value) : String(value);
}

/** HTTP status from a MockApiError or an axios error, when present. */
export function errorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("status" in error && typeof error.status === "number") return error.status;
  if ("response" in error && typeof error.response === "object" && error.response !== null && "status" in error.response) {
    const s = error.response.status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
