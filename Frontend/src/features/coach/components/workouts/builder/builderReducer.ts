import { arrayMove } from "@dnd-kit/sortable";
import type { ExerciseLibraryItem, PlanExercise, PlanSession, PlanWeek } from "../../../types";
import { cloneExercise, cloneWeekInto, emptyWeek, exerciseFromLibrary, MAX_WEEKS, newSession, normalizeWeeks } from "./planModel";

export interface BuilderState {
  weeks: PlanWeek[];
  weekIndex: number;
  selectedDayId: string | null;
  /** True once the week/session structure differs from the last load/save. */
  dirty: boolean;
}

export type SessionPatch = Partial<Pick<PlanSession, "title" | "focus" | "durationMinutes">>;
export type ExercisePatch = Partial<Omit<PlanExercise, "id" | "exerciseId" | "exerciseName" | "imageUrl">>;

export type BuilderAction =
  | { type: "load"; weeks: PlanWeek[] }
  | { type: "markSaved" }
  | { type: "resizeWeeks"; count: number }
  | { type: "selectWeek"; index: number }
  | { type: "selectDay"; dayId: string | null }
  | { type: "swapDays"; fromDayId: string; toDayId: string }
  | { type: "addSession"; dayId: string }
  | { type: "setRest"; dayId: string }
  | { type: "updateSession"; dayId: string; patch: SessionPatch }
  | { type: "addExercise"; dayId: string; item: ExerciseLibraryItem }
  | { type: "updateExercise"; dayId: string; exerciseId: string; patch: ExercisePatch }
  | { type: "duplicateExercise"; dayId: string; exerciseId: string }
  | { type: "removeExercise"; dayId: string; exerciseId: string }
  | { type: "reorderExercises"; dayId: string; fromId: string; toId: string }
  | { type: "copyWeekToNext"; index: number }
  | { type: "applyWeekToAll"; index: number };

export function initBuilderState(weeks: PlanWeek[]): BuilderState {
  return { weeks: normalizeWeeks(weeks), weekIndex: 0, selectedDayId: null, dirty: false };
}

function mapSession(weeks: PlanWeek[], dayId: string, fn: (s: PlanSession) => PlanSession): PlanWeek[] {
  return weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => (d.id === dayId && d.session ? { ...d, session: fn(d.session) } : d)),
  }));
}

function mapExercises(weeks: PlanWeek[], dayId: string, fn: (list: PlanExercise[]) => PlanExercise[]) {
  return mapSession(weeks, dayId, (s) => ({ ...s, exercises: fn(s.exercises) }));
}

function setDaySession(weeks: PlanWeek[], dayId: string, session: PlanSession | null): PlanWeek[] {
  return weeks.map((w) => ({ ...w, days: w.days.map((d) => (d.id === dayId ? { ...d, session } : d)) }));
}

/** Structural edits: every one of them marks the builder dirty. */
function edit(state: BuilderState, action: BuilderAction): PlanWeek[] {
  const { weeks } = state;
  switch (action.type) {
    case "swapDays": {
      const week = weeks.find((w) => w.days.some((d) => d.id === action.fromDayId));
      const from = week?.days.find((d) => d.id === action.fromDayId);
      const to = week?.days.find((d) => d.id === action.toDayId);
      if (!week || !from || !to) return weeks;
      return setDaySession(setDaySession(weeks, from.id, to.session), to.id, from.session);
    }
    case "addSession":
      return setDaySession(weeks, action.dayId, newSession());
    case "setRest":
      return setDaySession(weeks, action.dayId, null);
    case "updateSession":
      return mapSession(weeks, action.dayId, (s) => ({ ...s, ...action.patch }));
    case "addExercise":
      return mapExercises(weeks, action.dayId, (list) => [...list, exerciseFromLibrary(action.item)]);
    case "updateExercise":
      return mapExercises(weeks, action.dayId, (list) => list.map((e) => (e.id === action.exerciseId ? { ...e, ...action.patch } : e)));
    case "duplicateExercise":
      return mapExercises(weeks, action.dayId, (list) => {
        const i = list.findIndex((e) => e.id === action.exerciseId);
        return i < 0 ? list : [...list.slice(0, i + 1), cloneExercise(list[i]), ...list.slice(i + 1)];
      });
    case "removeExercise":
      return mapExercises(weeks, action.dayId, (list) => list.filter((e) => e.id !== action.exerciseId));
    case "reorderExercises":
      return mapExercises(weeks, action.dayId, (list) => {
        const from = list.findIndex((e) => e.id === action.fromId);
        const to = list.findIndex((e) => e.id === action.toId);
        return from < 0 || to < 0 ? list : arrayMove(list, from, to);
      });
    case "copyWeekToNext": {
      const src = weeks[action.index];
      const next = weeks[action.index + 1];
      if (!src || !next) return weeks;
      return weeks.map((w, i) => (i === action.index + 1 ? cloneWeekInto(src, w) : w));
    }
    case "applyWeekToAll": {
      const src = weeks[action.index];
      if (!src) return weeks;
      return weeks.map((w, i) => (i === action.index ? w : cloneWeekInto(src, w)));
    }
    case "resizeWeeks": {
      const count = Math.max(1, Math.min(MAX_WEEKS, Math.round(action.count)));
      if (count === weeks.length) return weeks;
      if (count < weeks.length) return weeks.slice(0, count);
      return [...weeks, ...Array.from({ length: count - weeks.length }, (_, i) => emptyWeek(weeks.length + i + 1))];
    }
    default:
      return weeks;
  }
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "load": {
      // After a save the server may replace local ids: keep the same week + weekday selected.
      const next = initBuilderState(action.weeks);
      const weekIndex = Math.min(state.weekIndex, Math.max(0, next.weeks.length - 1));
      const selectedDow = state.weeks[state.weekIndex]?.days.find((d) => d.id === state.selectedDayId)?.dayOfWeek;
      const selectedDayId = selectedDow ? (next.weeks[weekIndex]?.days.find((d) => d.dayOfWeek === selectedDow)?.id ?? null) : null;
      return { ...next, weekIndex, selectedDayId };
    }
    case "markSaved":
      return { ...state, dirty: false };
    case "selectWeek":
      return { ...state, weekIndex: action.index, selectedDayId: null };
    case "selectDay":
      return { ...state, selectedDayId: action.dayId };
    default: {
      const weeks = edit(state, action);
      if (weeks === state.weeks) return state;
      const weekIndex = Math.min(state.weekIndex, weeks.length - 1);
      const selectedStillExists = weeks[weekIndex]?.days.some((d) => d.id === state.selectedDayId);
      return { weeks, weekIndex, selectedDayId: selectedStillExists ? state.selectedDayId : null, dirty: true };
    }
  }
}
