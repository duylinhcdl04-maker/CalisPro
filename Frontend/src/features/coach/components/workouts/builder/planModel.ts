import type { ExerciseLibraryItem, PlanDay, PlanExercise, PlanSession, PlanWeek, Weekday } from "../../../types";

/** Monday-first ordering used by every week in the builder. */
export const WEEK_ORDER: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const MAX_WEEKS = 16;

/** Local ids are prefixed so they can be stripped to "" before saving (the server assigns real ids). */
const LOCAL_PREFIX = "local-";
let counter = 0;
export function localId(kind: string): string {
  counter += 1;
  return `${LOCAL_PREFIX}${kind}-${Date.now().toString(36)}-${counter}`;
}
const isLocal = (id: string) => id.startsWith(LOCAL_PREFIX);

export function emptyWeek(weekNumber: number): PlanWeek {
  return {
    id: localId("w"),
    weekNumber,
    days: WEEK_ORDER.map((dayOfWeek): PlanDay => ({ id: localId("d"), dayOfWeek, session: null })),
  };
}

export function emptyWeeks(count: number): PlanWeek[] {
  return Array.from({ length: count }, (_, i) => emptyWeek(i + 1));
}

export function newSession(): PlanSession {
  return { id: localId("s"), title: "Buổi tập mới", focus: "PUSH", durationMinutes: 45, exercises: [] };
}

export function exerciseFromLibrary(item: ExerciseLibraryItem): PlanExercise {
  return {
    id: localId("e"),
    exerciseId: item.id,
    exerciseName: item.name,
    imageUrl: item.imageUrl,
    sets: 3,
    reps: "10",
    restSeconds: 90,
    tempo: "2-0-1-0",
    intensity: "MODERATE",
    notes: "",
  };
}

export function cloneExercise(e: PlanExercise): PlanExercise {
  return { ...e, id: localId("e") };
}

export function cloneSession(s: PlanSession | null): PlanSession | null {
  if (!s) return null;
  return { ...s, id: localId("s"), exercises: s.exercises.map(cloneExercise) };
}

/** Copy the day structure of `source` into a week that keeps its own id/number. */
export function cloneWeekInto(source: PlanWeek, target: PlanWeek): PlanWeek {
  return {
    ...target,
    days: target.days.map((d) => {
      const src = source.days.find((s) => s.dayOfWeek === d.dayOfWeek);
      return { ...d, session: cloneSession(src?.session ?? null) };
    }),
  };
}

export function weekHasContent(w: PlanWeek): boolean {
  return w.days.some((d) => d.session !== null);
}

/** Make sure every loaded week has 7 days in Monday-first order. */
export function normalizeWeeks(weeks: PlanWeek[]): PlanWeek[] {
  return [...weeks]
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((w, i) => ({
      ...w,
      weekNumber: i + 1,
      days: WEEK_ORDER.map((day) => w.days.find((d) => d.dayOfWeek === day) ?? { id: localId("d"), dayOfWeek: day, session: null }),
    }));
}

/** Strip local ids so the server assigns real ones. */
export function serializeWeeks(weeks: PlanWeek[]): PlanWeek[] {
  const strip = (id: string) => (isLocal(id) ? "" : id);
  return weeks.map((w) => ({
    ...w,
    id: strip(w.id),
    days: w.days.map((d) => ({
      ...d,
      id: strip(d.id),
      session: d.session
        ? { ...d.session, id: strip(d.session.id), exercises: d.session.exercises.map((e) => ({ ...e, id: strip(e.id) })) }
        : null,
    })),
  }));
}

export interface WeekStats {
  trainingDays: number;
  exercises: number;
  minutes: number;
}

export function weekStats(w: PlanWeek | undefined): WeekStats {
  const sessions = (w?.days ?? []).flatMap((d) => (d.session ? [d.session] : []));
  return {
    trainingDays: sessions.length,
    exercises: sessions.reduce((n, s) => n + s.exercises.length, 0),
    minutes: sessions.reduce((n, s) => n + s.durationMinutes, 0),
  };
}

export interface StructureIssue {
  weekIndex: number;
  dayId: string;
  message: string;
}

const DAY_SHORT: Record<Weekday, string> = { MON: "T2", TUE: "T3", WED: "T4", THU: "T5", FRI: "T6", SAT: "T7", SUN: "CN" };

/**
 * Structural checks before saving. Drafts only need named sessions;
 * an ACTIVE plan also needs at least one session and no empty sessions.
 */
export function findStructureIssue(weeks: PlanWeek[], forActivation: boolean): StructureIssue | null {
  let sessions = 0;
  for (const [weekIndex, w] of weeks.entries()) {
    for (const d of w.days) {
      if (!d.session) continue;
      sessions += 1;
      const where = `${DAY_SHORT[d.dayOfWeek]}, tuần ${w.weekNumber}`;
      if (!d.session.title.trim()) return { weekIndex, dayId: d.id, message: `Buổi tập ${where} chưa có tên.` };
      if (forActivation && d.session.exercises.length === 0)
        return { weekIndex, dayId: d.id, message: `Buổi "${d.session.title}" (${where}) chưa có bài tập nào.` };
    }
  }
  if (forActivation && sessions === 0) return { weekIndex: 0, dayId: "", message: "Giáo án cần ít nhất một buổi tập trước khi áp dụng." };
  return null;
}
