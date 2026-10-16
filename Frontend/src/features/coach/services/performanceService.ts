import { MockApiError } from "../../../services/mock/latency";
import type { AdherenceStats, FitnessScorePoint, PerformanceParams, PerformanceRange, PerformanceReport, PersonalRecordEntry, Student } from "../types";
import { STUDENTS, buildStudentDetail } from "../mock/students.mock";
import { clamp, createRng, daysAgo, isoDate } from "../mock/helpers";
import { COACH_ENDPOINTS, USE_MOCK_API, api, mockResponse } from "./http";

const RANGE_WEEKS: Record<PerformanceRange, number> = { "4W": 4, "12W": 12, "6M": 26, "1Y": 52 };

function recordsFor(student: Student, holderName: string | null, seed: number): PersonalRecordEntry[] {
  const d = buildStudentDetail(student, []);
  const rng = createRng(seed);
  const scale = (score: number, max: number) => Math.max(1, Math.round((score / 100) * max));
  const row = (id: string, exerciseName: string, value: number, unit: PersonalRecordEntry["unit"]): PersonalRecordEntry => ({
    id: `${student.id}-${id}`,
    exerciseName,
    holderName,
    value,
    unit,
    previousValue: student.performanceTrend === "down" ? value : Math.max(1, value - rng.int(1, 3)),
    achievedAt: daysAgo(rng.int(1, 40), 18),
  });
  return [
    row("pu", "Push Up", scale(d.fitness.strength, 36), "reps"),
    row("pl", "Pull Up", scale(d.fitness.strength, 14), "reps"),
    row("dp", "Dips", scale(d.fitness.strength, 22), "reps"),
    row("pk", "Plank", scale(d.fitness.core, 250), "sec"),
    row("ps", "Pistol Squat", scale(d.fitness.balance, 12), "reps"),
    row("hs", "Wall Handstand", scale(d.fitness.balance, 90), "sec"),
  ];
}

function adherenceFor(students: Student[], seed: number): AdherenceStats {
  const rng = createRng(seed);
  const avgAdherence = students.reduce((s, x) => s + x.adherence, 0) / students.length;
  const avgFreq = students.reduce((s, x) => s + x.trainingFrequency, 0) / students.length;
  const plannedPerWeek = Math.max(3, Math.round(avgFreq + 0.5)) * students.length;
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const w = 7 - i;
    const rate = clamp(avgAdherence + rng.int(-10, 8)) / 100;
    return { weekStart: isoDate(-w * 7), planned: plannedPerWeek, completed: Math.round(plannedPerWeek * rate) };
  });
  const sessionsPlanned = weekly.slice(-4).reduce((s, w) => s + w.planned, 0);
  const sessionsCompleted = weekly.slice(-4).reduce((s, w) => s + w.completed, 0);
  const streaks = students.map((s) => s.streak);
  return {
    sessionsPlanned,
    sessionsCompleted,
    adherencePercent: Math.round((sessionsCompleted / sessionsPlanned) * 100),
    trainingFrequency: Math.round(avgFreq * 10) / 10,
    currentStreak: students.length === 1 ? streaks[0] : Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length),
    longestStreak: Math.max(...streaks) + (students.length === 1 ? rng.int(0, 12) : 0),
    weekly,
  };
}

function averageSeries(students: Student[]): FitnessScorePoint[] {
  const series = students.map((s) => buildStudentDetail(s, []).fitnessHistory);
  return series[0].map((point, i) => {
    const avg = (key: keyof Omit<FitnessScorePoint, "date">) => Math.round(series.reduce((sum, s) => sum + s[i][key], 0) / series.length);
    return { date: point.date, strength: avg("strength"), endurance: avg("endurance"), mobility: avg("mobility"), core: avg("core"), balance: avg("balance"), overall: avg("overall") };
  });
}

export const performanceService = {
  async getReport(params: PerformanceParams): Promise<PerformanceReport> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.performance, params);
    const weeks = RANGE_WEEKS[params.range];
    if (params.studentId === "ALL") {
      const series = averageSeries(STUDENTS).slice(-weeks);
      // Cohort PR board: best value per exercise across all students.
      const all = STUDENTS.flatMap((s, i) => recordsFor(s, s.name, i + 1));
      const best = new Map<string, PersonalRecordEntry>();
      all.forEach((r) => {
        const cur = best.get(r.exerciseName);
        if (!cur || r.value > cur.value) best.set(r.exerciseName, r);
      });
      return mockResponse({ studentId: "ALL", range: params.range, series, personalRecords: [...best.values()], adherence: adherenceFor(STUDENTS, 99) }, 550);
    }
    const index = STUDENTS.findIndex((s) => s.id === params.studentId);
    if (index < 0) throw new MockApiError("Không tìm thấy học viên.", 404);
    const student = STUDENTS[index];
    return mockResponse(
      {
        studentId: student.id,
        range: params.range,
        series: buildStudentDetail(student, []).fitnessHistory.slice(-weeks),
        personalRecords: recordsFor(student, null, index + 1),
        adherence: adherenceFor([student], index + 3),
      },
      500
    );
  },
};
