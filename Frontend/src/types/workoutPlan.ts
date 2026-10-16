import type { ExerciseFormData } from "../features/exercises/types/exercise";

export type FitnessGoal =
  | "Strength"
  | "Muscle Gain"
  | "Endurance"
  | "Mobility"
  | "Weight Management"
  | "Calisthenics Skills"
  | "General Fitness";

export type FitnessLevel = "Foundation" | "Beginner" | "Intermediate" | "Advanced" | "Elite";

export type ProgramStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type DayType = "WORKOUT" | "REST" | "RECOVERY" | "MOBILITY" | "SKILL_TEST";

export type SectionType = "WARMUP" | "MAIN" | "SKILL" | "ACCESSORY" | "COOLDOWN";

export type PrescriptionType =
  | "FIXED_REPS"
  | "REP_RANGE"
  | "TIME_HOLD"
  | "AMRAP"
  | "EMOM"
  | "DISTANCE";

export type IntensityType = "RPE" | "RIR" | "BODYWEIGHT" | "ASSISTED" | "WEIGHTED";

export interface ExerciseItem {
  id: string;
  name: string;
  vietnameseName: string;
  imageUrl: string;
  videoUrl?: string;
  category: "Push" | "Pull" | "Core" | "Legs" | "Skill" | "Mobility" | "Warmup" | "Cooldown";
  movementPattern: string;
  difficulty: FitnessLevel;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  description: string;
  cues: string[];
  commonMistakes: string[];
  regressionId?: string;
  progressionId?: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  /** Bài dùng được ở phần nào của buổi tập (WARMUP, MAIN, ACCESSORY, COOLDOWN); rỗng = chưa phân loại. */
  sessionRoles?: string[];
  viewsCount?: number;
  completionCount?: number;
  updatedAt?: string;
  // Toàn bộ dữ liệu Exercise Builder (phases, muscles, technique, AI rules...) đã lưu
  builderData?: ExerciseFormData;
  // Kết quả đồng bộ AI runtime của lần lưu gần nhất (chỉ có ngay sau khi tạo/cập nhật)
  aiSync?: import("../features/exercises/api").ExerciseAiSyncResult;
}

export interface WorkoutExercisePrescription {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseCategory: string;
  exerciseDifficulty: FitnessLevel;
  exerciseImageUrl: string;
  sets: number;
  prescriptionType: PrescriptionType;
  reps: string; // e.g. "10", "8-12", "30s", "AMRAP"
  restSeconds: number; // e.g. 60, 90, 120
  tempo?: string; // e.g. "3-1-1-0"
  intensityType: IntensityType;
  rpe?: number; // 1-10
  rir?: number; // 0-5
  weightOffsetKg?: number; // e.g. +10kg or -5kg band
  coachingCues?: string;
  /** true = giữ đúng bài này cho mọi học viên; false = engine tự điều chỉnh theo nấc tiến trình của từng người */
  locked?: boolean;
}

export interface WorkoutSection {
  id: string;
  name: string;
  sectionType: SectionType;
  order: number;
  exercises: WorkoutExercisePrescription[];
}

export interface TrainingDay {
  id: string;
  dayNumber: number;
  dayOfWeekTitle: string; // e.g. "Thứ 2" or "Ngày 1"
  name: string; // e.g. "Push Strength & Hypertrophy"
  focus: string; // e.g. "Sức mạnh đẩy thân trên & Ngực"
  dayType: DayType;
  estimatedDurationMinutes: number;
  difficulty: FitnessLevel;
  primaryMuscleGroups: string[];
  coachNotes?: string;
  sections: WorkoutSection[];
}

export interface ProgressionTarget {
  type: "Volume" | "Intensity" | "Skill" | "Density" | "Deload";
  targetDescription: string;
  targetMetric?: string;
}

export interface WorkoutWeek {
  id: string;
  weekNumber: number;
  title: string; // e.g. "Tuần 1: Xây dựng Nền tảng & Kỹ thuật"
  objective: string;
  progressionTarget: ProgressionTarget;
  coachNotes?: string;
  days: TrainingDay[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  primaryGoal: FitnessGoal;
  secondaryGoals: FitnessGoal[];
  fitnessLevel: FitnessLevel;
  durationWeeks: number;
  frequencyDaysPerWeek: number;
  sessionDurationMinutes: number;
  equipmentRequired: string[];
  programType: "Structured Program" | "AI Adaptive" | "Coach Custom";
  status: ProgramStatus;
  version: string;
  assignedUsersCount: number;
  completionRate: number;
  averageRating: number;
  updatedAt: string;
  createdAt: string;
  createdBy: string;
  coachNotes?: string;
  thumbnailUrl?: string;
  weeks: WorkoutWeek[];

  // ---- Điều kiện áp dụng của Level Engine (giáo án mẫu theo level) ----
  /** Mã giáo án ở backend */
  code?: string;
  /** Khoảng level học viên được áp dụng giáo án; fitnessLevel là level chính trong khoảng */
  levelMin?: FitnessLevel;
  levelMax?: FitnessLevel;
  /** Số buổi/tuần tối đa (khoảng frequencyDaysPerWeek..frequencyDaysMax) */
  frequencyDaysMax?: number;
  /** Tuần giảm tải (deload) - khối lượng tự giảm theo cấu hình rule set */
  deloadWeek?: number | null;
  /** Mục tiêu kỹ năng cụ thể (FIRST_PULL_UP, MUSCLE_UP, HANDSTAND...) */
  targetGoalCodes?: string[];
  /** Dụng cụ bắt buộc dạng mã: PULL_UP_BAR | PARALLEL_BARS | LOW_BAR | RINGS | RESISTANCE_BAND */
  requiredEquipmentCodes?: string[];
  /** Trọng tâm năng lực (tự tính từ số set) */
  emphasis?: Record<string, number>;
  activeUsersCount?: number;
}

export interface WorkoutPlanAnalytics {
  totalEnrolled: number;
  activeTrainees: number;
  completedTrainees: number;
  avgCompletionRate: number;
  avgSessionDurationMin: number;
  avgRating: number;
  dropOffRate: number;
  weeklyProgressData: {
    week: string;
    completedUsers: number;
    avgRpe: number;
    completionPct: number;
  }[];
  levelDistribution: {
    name: string;
    value: number;
  }[];
}

export interface WorkoutPlanFilters {
  searchQuery: string;
  goal?: FitnessGoal | "ALL";
  fitnessLevel?: FitnessLevel | "ALL";
  durationWeeks?: number | "ALL";
  status?: ProgramStatus | "ALL";
}
