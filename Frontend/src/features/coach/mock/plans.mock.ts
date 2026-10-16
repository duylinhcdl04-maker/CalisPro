import type { Intensity, PlanDay, PlanExercise, PlanSession, PlanWeek, Weekday, WorkoutPlan } from "../types";
import { exerciseById } from "./exercises.mock";
import { studentRef } from "./students.mock";
import { daysAgo } from "./helpers";

export const WEEKDAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type ExSeed = [exerciseId: string, sets: number, reps: string, rest: number, tempo: string, intensity: Intensity];
type SessionSeed = { title: string; focus: PlanSession["focus"]; duration: number; exercises: ExSeed[] };

const S = {
  pushStrength: { title: "Push Strength", focus: "PUSH", duration: 50, exercises: [["push-up", 4, "10", 90, "2-0-1-0", "MODERATE"], ["dips", 4, "6-8", 120, "3-0-1-0", "HIGH"], ["pike-push-up", 3, "8", 90, "2-1-1-0", "MODERATE"], ["plank", 3, "45s", 60, "-", "LOW"]] },
  pullStrength: { title: "Pull Strength", focus: "PULL", duration: 55, exercises: [["pull-up", 5, "5", 150, "3-1-1-0", "HIGH"], ["chin-up", 3, "8", 120, "2-0-1-1", "MODERATE"], ["australian-row", 3, "12", 75, "2-0-1-1", "MODERATE"], ["hanging-leg-raise", 3, "10", 60, "2-0-1-0", "MODERATE"]] },
  core: { title: "Core Stability", focus: "CORE", duration: 30, exercises: [["hollow-body-hold", 4, "30s", 45, "-", "MODERATE"], ["hanging-leg-raise", 3, "12", 60, "2-0-1-0", "MODERATE"], ["plank", 3, "60s", 45, "-", "LOW"]] },
  mobility: { title: "Mobility Flow", focus: "MOBILITY", duration: 25, exercises: [["shoulder-dislocate", 3, "12", 30, "2-0-2-0", "LOW"], ["deep-squat-hold", 3, "45s", 30, "-", "LOW"]] },
  legs: { title: "Legs & Balance", focus: "LEGS", duration: 45, exercises: [["squat", 4, "15", 75, "3-1-1-0", "MODERATE"], ["bulgarian-split-squat", 3, "10", 90, "2-0-1-0", "MODERATE"], ["pistol-squat", 3, "5", 120, "3-0-1-0", "HIGH"]] },
  skill: { title: "Handstand & L-sit Skill", focus: "SKILL", duration: 45, exercises: [["wall-handstand", 5, "30s", 90, "-", "MODERATE"], ["pike-push-up", 4, "8", 90, "2-1-1-0", "MODERATE"], ["l-sit", 5, "10s", 60, "-", "HIGH"], ["hollow-body-hold", 3, "30s", 45, "-", "MODERATE"]] },
  conditioning: { title: "Conditioning Circuit", focus: "LEGS", duration: 35, exercises: [["push-up", 3, "12", 45, "1-0-1-0", "HIGH"], ["squat", 3, "20", 45, "1-0-1-0", "HIGH"], ["australian-row", 3, "12", 45, "1-0-1-0", "HIGH"], ["plank", 3, "40s", 30, "-", "MODERATE"]] },
  hypertrophyPush: { title: "Push Hypertrophy", focus: "PUSH", duration: 55, exercises: [["diamond-push-up", 4, "10-12", 75, "3-0-1-0", "MODERATE"], ["dips", 4, "10", 90, "3-0-1-0", "MODERATE"], ["archer-push-up", 3, "6", 90, "2-0-1-0", "HIGH"]] },
  hypertrophyPull: { title: "Pull Hypertrophy", focus: "PULL", duration: 55, exercises: [["pull-up", 4, "8-10", 90, "3-0-1-1", "MODERATE"], ["chin-up", 4, "10", 90, "3-0-1-1", "MODERATE"], ["australian-row", 3, "15", 60, "2-0-1-1", "MODERATE"]] },
} satisfies Record<string, SessionSeed>;

type WeekTemplate = Partial<Record<Weekday, SessionSeed>>;

function buildWeeks(planId: string, weeks: number, template: WeekTemplate): PlanWeek[] {
  return Array.from({ length: weeks }, (_, w) => ({
    id: `${planId}-w${w + 1}`,
    weekNumber: w + 1,
    days: WEEKDAYS.map((day): PlanDay => {
      const seed = template[day];
      return {
        id: `${planId}-w${w + 1}-${day}`,
        dayOfWeek: day,
        session: seed
          ? {
              id: `${planId}-w${w + 1}-${day}-s`,
              title: seed.title,
              focus: seed.focus,
              durationMinutes: seed.duration,
              exercises: seed.exercises.map(([exerciseId, sets, reps, restSeconds, tempo, intensity], i): PlanExercise => {
                const ex = exerciseById(exerciseId);
                // Progressive overload: +1 set every 3 weeks on the first exercise.
                const extraSet = i === 0 ? Math.floor(w / 3) : 0;
                return { id: `${planId}-w${w + 1}-${day}-e${i}`, exerciseId, exerciseName: ex.name, imageUrl: ex.imageUrl, sets: sets + extraSet, reps, restSeconds, tempo, intensity, notes: "" };
              }),
            }
          : null,
      };
    }),
  }));
}

function plan(
  id: string,
  base: Omit<WorkoutPlan, "id" | "weeks" | "studentName" | "studentAvatar" | "createdAt" | "updatedAt">,
  template: WeekTemplate,
  createdDaysAgo: number,
  updatedDaysAgo: number
): WorkoutPlan {
  const ref = base.studentId ? studentRef(base.studentId) : null;
  return {
    id,
    ...base,
    studentName: ref?.studentName ?? null,
    studentAvatar: ref?.studentAvatar ?? null,
    weeks: buildWeeks(id, base.durationWeeks, template),
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(updatedDaysAgo, 16),
  };
}

export const PLANS: WorkoutPlan[] = [
  plan("plan-001", { name: "8 Week Strength Program", description: "Tăng sức mạnh kéo/đẩy nền tảng, hướng tới 15 pull-up liên tục.", studentId: "stu-003", goal: "STRENGTH", level: "INTERMEDIATE", durationWeeks: 8, frequencyPerWeek: 4, status: "ACTIVE" }, { MON: S.pushStrength, WED: S.pullStrength, FRI: S.core, SUN: S.mobility }, 30, 2),
  plan("plan-002", { name: "Skill Foundation: Handstand & L-sit", description: "Xây nền tảng vai và core cho handstand tự do và L-sit 20 giây.", studentId: "stu-001", goal: "SKILL", level: "INTERMEDIATE", durationWeeks: 8, frequencyPerWeek: 4, status: "ACTIVE" }, { MON: S.skill, TUE: S.pullStrength, THU: S.skill, SAT: S.mobility }, 36, 1),
  plan("plan-003", { name: "Fat Loss Conditioning 6W", description: "3 buổi circuit ngắn mỗi tuần, ưu tiên duy trì thói quen.", studentId: "stu-002", goal: "FAT_LOSS", level: "BEGINNER", durationWeeks: 6, frequencyPerWeek: 3, status: "ACTIVE" }, { MON: S.conditioning, WED: S.legs, FRI: S.conditioning }, 18, 4),
  plan("plan-004", { name: "Push/Pull Hypertrophy 10W", description: "Tăng cơ thân trên với volume cao, tempo chậm.", studentId: "stu-012", goal: "MUSCLE", level: "ADVANCED", durationWeeks: 10, frequencyPerWeek: 5, status: "ACTIVE" }, { MON: S.hypertrophyPush, TUE: S.hypertrophyPull, THU: S.legs, FRI: S.hypertrophyPush, SAT: S.hypertrophyPull }, 42, 3),
  plan("plan-005", { name: "Mobility Reset 4W", description: "Mở khớp vai, hông, cổ chân cho người mới bắt đầu.", studentId: "stu-006", goal: "MOBILITY", level: "BEGINNER", durationWeeks: 4, frequencyPerWeek: 3, status: "ACTIVE" }, { MON: S.mobility, WED: S.core, SAT: S.mobility }, 8, 1),
  plan("plan-006", { name: "Beginner Calisthenics Base", description: "Template chuẩn cho học viên mới, chưa gán học viên.", studentId: null, goal: "STRENGTH", level: "BEGINNER", durationWeeks: 6, frequencyPerWeek: 3, status: "DRAFT" }, { MON: S.conditioning, WED: S.core, FRI: S.legs }, 5, 0),
  plan("plan-007", { name: "Muscle-Up Mastery", description: "Chuỗi progression explosive pull-up tới strict muscle-up.", studentId: "stu-005", goal: "SKILL", level: "ELITE", durationWeeks: 6, frequencyPerWeek: 4, status: "ARCHIVED" }, { MON: S.pullStrength, WED: S.pushStrength, FRI: S.pullStrength, SAT: S.core }, 120, 60),
  plan("plan-008", { name: "Endurance Builder 8W", description: "Tăng sức bền cơ bắp với rep cao và nghỉ ngắn.", studentId: "stu-008", goal: "ENDURANCE", level: "INTERMEDIATE", durationWeeks: 8, frequencyPerWeek: 3, status: "PAUSED" }, { TUE: S.conditioning, THU: S.pushStrength, SAT: S.conditioning }, 50, 7),
];

/** Rough "where is the student in the plan" computation, used for list progress bars. */
export function planProgress(p: WorkoutPlan): { currentWeek: number; progressPercent: number } {
  if (p.status === "DRAFT") return { currentWeek: 0, progressPercent: 0 };
  const elapsedWeeks = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (7 * 86_400_000));
  const currentWeek = Math.min(p.durationWeeks, Math.max(1, elapsedWeeks + 1));
  const progressPercent = p.status === "ARCHIVED" ? 100 : Math.round(((currentWeek - 0.5) / p.durationWeeks) * 100);
  return { currentWeek, progressPercent };
}
