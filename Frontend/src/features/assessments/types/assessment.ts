import type { Question } from "./question";
// ==========================================
// SCORING CONFIG TYPES
// ==========================================
export type ConditionOperator = 'GT' | 'GTE' | 'LT' | 'LTE' | 'BETWEEN' | 'EQ';

export interface ScoringRule {
  id: string;
  questionId: string;
  operator: ConditionOperator;
  minValue?: number;
  maxValue?: number;
  exactValue?: number | string;
  score: number; // 0 - 100 points
  label?: string;
}

export interface QuestionScoringMap {
  questionId: string;
  rules: ScoringRule[];
}

export interface ScoringConfig {
  maxTotalScore: number; // usually 100
  questionScoring: QuestionScoringMap[];
  passScore?: number;
}

export interface CalculatedUserScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  fitnessLevelName: string;
  dimensionScores: Record<string, number>;
}

// ==========================================
// FITNESS LEVEL TYPES
// ==========================================
export interface FitnessLevel {
  id: string;
  code: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE' | string;
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
  recommendation: string;
  colorScheme: 'green' | 'blue' | 'purple' | 'amber' | 'emerald';
  badgeLabel: string;
}

export interface DimensionMetric {
  dimension: string;
  displayName: string;
  score: number;
  fullMark: number;
  category: string;
  benchmarkScore?: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK';
  insightText: string;
}

export interface FitnessProfileSummary {
  overallScore: number;
  level: FitnessLevel;
  dimensions: DimensionMetric[];
  completedAt: string;
  nextAssessmentDate: string;
}

// ==========================================
// SCHEDULE TYPES
// ==========================================
export type TriggerType = 'TIME_BASED' | 'WORKOUT_BASED' | 'DYNAMIC_LEVEL' | 'MANUAL';
export type TimeUnit = 'DAYS' | 'WEEKS' | 'MONTHS';

export interface DynamicLevelRule {
  levelCode: string;
  levelName: string;
  intervalValue: number;
  intervalUnit: TimeUnit;
}

export interface WorkoutTriggerConfig {
  enabled: boolean;
  requiredWorkoutsCount: number;
}

export type ReminderTiming = '7_DAYS_BEFORE' | '3_DAYS_BEFORE' | 'ON_DUE_DATE' | '3_DAYS_AFTER';
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

export interface ReminderRule {
  id: string;
  timing: ReminderTiming;
  timingLabel: string;
  enabled: boolean;
  channels: NotificationChannel[];
  customMessage?: string;
}

export interface AssessmentSchedule {
  enabled: boolean;
  triggerTypes: TriggerType[];
  triggerLogic: 'OR' | 'AND';
  timeFrequency: {
    value: number;
    unit: TimeUnit;
  };
  dynamicRules: DynamicLevelRule[];
  workoutTrigger: WorkoutTriggerConfig;
  gracePeriodDays: number;
  reminders: ReminderRule[];
}

// ==========================================
// ASSESSMENT CORE TYPES
// ==========================================
export type AssessmentType = 
  | 'INITIAL'
  | 'PERIODIC'
  | 'STRENGTH'
  | 'ENDURANCE'
  | 'MOBILITY'
  | 'SKILL'
  | 'CUSTOM'
  | (string & {});

export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type TargetFitnessLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE' | (string & {});

export type TrainingGoal = 
  | 'GENERAL_FITNESS'
  | 'STRENGTH'
  | 'MUSCLE_BUILDING'
  | 'SKILL'
  | 'MOBILITY'
  | 'ENDURANCE'
  | (string & {});

export interface TargetAudience {
  fitnessLevels: TargetFitnessLevel[];
  goals: TrainingGoal[];
  ageRange?: [number, number];
}

export interface AssessmentQuestionRef {
  questionId: string;
  order: number;
  weight: number; // Percentage, sum of all questions = 100; 0 = câu chỉ thu thập thông tin
  required: boolean;
  // Phần / bước hiển thị cho học viên (vd. "Thông tin cơ bản")
  section?: string;
  // Định nghĩa đầy đủ của câu hỏi (backend trả về; gửi kèm khi lưu để tạo/cập nhật câu hỏi riêng của bài)
  question?: Question;
}

export interface Assessment {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: AssessmentType;
  estimatedDuration: number; // in minutes
  tags: string[];
  status: AssessmentStatus;
  targetAudience: TargetAudience;
  questions: AssessmentQuestionRef[];
  scoringConfig: ScoringConfig;
  fitnessLevels: FitnessLevel[];
  schedule: AssessmentSchedule;
  createdAt: string;
  updatedAt: string;
  version: number;
  attemptsCount: number;
  averageScore: number;
  completionRate: number; // 0 - 100
  // ---- Do backend trả về ----
  isOnboarding?: boolean; // đang là bài test đầu vào
  locked?: boolean; // đang là bài test đầu vào -> lưu sẽ tạo phiên bản mới
  rootId?: string;
  forkedFromId?: string | null; // vừa tạo phiên bản mới từ bài này
  idMap?: Record<string, string> | null; // id tạm của câu hỏi -> id thật
}

export interface AssessmentFilterState {
  search: string;
  type: AssessmentType | 'ALL';
  status: AssessmentStatus | 'ALL';
  fitnessLevel: TargetFitnessLevel | 'ALL';
  sortBy: 'NEWEST' | 'OLDEST' | 'MOST_USED' | 'HIGHEST_COMPLETION' | 'LOWEST_COMPLETION';
}
