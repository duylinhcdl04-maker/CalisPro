import type { ISODateString, StudentLevel, TrainingGoal, Weekday } from "./common";

export type PlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type Intensity = "LOW" | "MODERATE" | "HIGH" | "MAX";

export type Equipment = "NONE" | "PULL_UP_BAR" | "PARALLEL_BARS" | "RINGS" | "RESISTANCE_BAND" | "WALL";
export type MovementPattern = "PUSH" | "PULL" | "LEGS" | "CORE" | "SKILL" | "MOBILITY";
export type ExerciseDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  imageUrl: string;
  videoUrl: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: Equipment;
  difficulty: ExerciseDifficulty;
  movementPattern: MovementPattern;
  instructions: string[];
  /** Whether AI Motion Analysis has a trained model for this movement. */
  aiAnalysisAvailable: boolean;
}

export interface ExerciseFilterParams {
  search?: string;
  muscle?: string;
  equipment?: Equipment;
  difficulty?: ExerciseDifficulty;
  pattern?: MovementPattern;
}

export interface PlanExercise {
  /** Instance id inside the plan (a plan can contain the same exercise twice). */
  id: string;
  exerciseId: string;
  exerciseName: string;
  imageUrl: string;
  sets: number;
  /** "10", "8-12" or a duration like "30s". */
  reps: string;
  restSeconds: number;
  /** Eccentric-pause-concentric-pause, e.g. "2-0-1-0". */
  tempo: string;
  intensity: Intensity;
  notes: string;
}

export interface PlanSession {
  id: string;
  title: string;
  focus: MovementPattern;
  durationMinutes: number;
  exercises: PlanExercise[];
}

export interface PlanDay {
  id: string;
  dayOfWeek: Weekday;
  /** null = rest day. */
  session: PlanSession | null;
}

export interface PlanWeek {
  id: string;
  weekNumber: number;
  days: PlanDay[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  studentId: string | null;
  studentName: string | null;
  studentAvatar: string | null;
  goal: TrainingGoal;
  level: StudentLevel;
  durationWeeks: number;
  frequencyPerWeek: number;
  status: PlanStatus;
  weeks: PlanWeek[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface WorkoutPlanSummary {
  id: string;
  name: string;
  studentId: string | null;
  studentName: string | null;
  studentAvatar: string | null;
  goal: TrainingGoal;
  level: StudentLevel;
  durationWeeks: number;
  frequencyPerWeek: number;
  status: PlanStatus;
  progressPercent: number;
  currentWeek: number;
  updatedAt: ISODateString;
}

export interface PlanListParams {
  status?: PlanStatus;
  search?: string;
}

/** Payload for create / update. The server assigns ids for new weeks/days/exercises if they are missing. */
export type WorkoutPlanInput = Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt" | "studentName" | "studentAvatar"> & {
  id?: string;
};
