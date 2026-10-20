// BLOCKED: chưa có bài test đầu vào và admin chặn người dùng mới ở màn chờ
export type OnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
export type UserRole = "ADMIN" | "USER" | "COACH";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  onboarding: { status: OnboardingStatus; currentStep?: number; /** đã bỏ qua bài test đầu vào: vào được ứng dụng, chưa có level, được làm bài sau */ skipped?: boolean };
  /** Đang dùng mật khẩu tạm do Admin cấp: chỉ được đổi mật khẩu cho tới khi đổi xong. */
  mustChangePassword?: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMBER" | "BOOLEAN" | "SCALE";

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface AssessmentQuestion {
  id: string;
  step: number;
  stepTitle: string;
  type: QuestionType;
  prompt: string;
  helperText?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  unit?: string;
  required: boolean;
}

export type AnswerValue = string | string[] | number | boolean;

export interface FitnessProfile {
  overallScore: number;
  strength: number;
  endurance: number;
  mobility: number;
  core: number;
  balance: number;
}

export interface WeeklySummary {
  completedWorkouts: number;
  plannedWorkouts: number;
  totalMinutes: number;
  streak: number;
}

export interface Readiness {
  score: number;
  energy: number;
  sleepHours: number;
  soreness: number;
  stress: number;
}

export interface TodayWorkout {
  type: "WORKOUT" | "REST";
  workoutPlanId?: number;
  dayId?: number;
  name?: string;
  durationMinutes?: number;
  exerciseCount?: number;
  focus?: string[];
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface AICoachInsight {
  headline: string;
  message: string;
  ctaLabel: string;
}

export interface PersonalRecord {
  exercise: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "flat";
  changeLabel: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  imageUrl: string;
  sets: number;
  reps: string;
  restSeconds: number;
  rpe: number;
  muscleGroup: string;
}

export interface WorkoutPlanDetail {
  id: number;
  name: string;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  muscleGroups: string[];
  exercises: WorkoutExercise[];
}

export interface Exercise {
  id: string;
  name: string;
  imageUrl: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  primaryMuscles: string[];
  secondaryMuscles: string[];
  description: string;
  safetyNotes: string;
  progression: { previous?: string; current: string; next?: string };
  videoUrl?: string;
  equipment?: string[];
  /** false khi bài chưa có ảnh đại diện thật (imageUrl khi đó chỉ là ảnh giữ chỗ). Không có trường này = ảnh có sẵn. */
  hasRealImage?: boolean;
  /** id số của bài trên máy chủ (id của Exercise là mã bài), dùng gọi API theo bài. */
  backendId?: number;
  details?: import("../features/exercises/mappers/exerciseDetailsMapper").BackendExerciseDetails | null;
}


export interface ProgressPoint {
  date: string;
  value: number;
}

export interface ProgressMetrics {
  strength: ProgressPoint[];
  endurance: ProgressPoint[];
  mobility: ProgressPoint[];
  pushUp: ProgressPoint[];
  pullUp: ProgressPoint[];
  plank: ProgressPoint[];
}

export type ProgressMetricKey = keyof ProgressMetrics;

export interface AssessmentSnapshotMetrics {
  strength: number;
  endurance: number;
  mobility: number;
  core: number;
}

export interface AssessmentSnapshot {
  id: string;
  label: string;
  dateLabel: string;
  metrics: AssessmentSnapshotMetrics;
}

export interface PrivacyConsent {
  dataProcessing: boolean;
  marketingUpdates: boolean;
}

export interface SessionInfo {
  device: string;
  status: "active";
  lastActiveLabel: string;
}
