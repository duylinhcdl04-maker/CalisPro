import type { AssessmentSnapshot, PersonalRecord, ProgressMetrics, ProgressPoint } from "../../types";
import { withLatency } from "./latency";

function series(base: number, weeks: number, growthPerWeek: number, jitterSeed: number): ProgressPoint[] {
  const points: ProgressPoint[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const jitter = Math.sin(i * jitterSeed) * 2;
    const value = Math.max(0, Math.round(base + (weeks - 1 - i) * growthPerWeek + jitter));
    points.push({ date: date.toISOString().slice(0, 10), value });
  }
  return points;
}

const METRICS: ProgressMetrics = {
  strength: series(58, 12, 1.6, 0.7),
  endurance: series(50, 12, 1.1, 0.9),
  mobility: series(45, 12, 0.6, 1.1),
  pushUp: series(18, 12, 1.0, 0.5),
  pullUp: series(3, 12, 0.4, 0.4),
  plank: series(60, 12, 4.5, 0.6),
};

const PERSONAL_RECORDS: PersonalRecord[] = [
  { exercise: "Push Up", value: "30", unit: "reps", trend: "up", changeLabel: "+4 so với lần trước" },
  { exercise: "Pull Up", value: "8", unit: "reps", trend: "up", changeLabel: "+1 so với lần trước" },
  { exercise: "Plank", value: "2:15", unit: "", trend: "flat", changeLabel: "Không đổi" },
  { exercise: "Squat", value: "42", unit: "reps", trend: "up", changeLabel: "+6 so với lần trước" },
];

/** Assessment snapshots (empty by default until evaluated) */
const ASSESSMENT_SNAPSHOTS: AssessmentSnapshot[] = [];

export const progressService = {
  async getMetrics(): Promise<ProgressMetrics> {
    await withLatency(null, 500);
    return METRICS;
  },
  async getPersonalRecords(): Promise<PersonalRecord[]> {
    await withLatency(null, 350);
    return PERSONAL_RECORDS;
  },
  async getAssessmentSnapshots(): Promise<AssessmentSnapshot[]> {
    await withLatency(null, 400);
    return ASSESSMENT_SNAPSHOTS;
  },
};
