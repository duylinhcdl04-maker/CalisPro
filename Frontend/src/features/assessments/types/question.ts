export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'YES_NO'
  | 'NUMERIC_INPUT'
  | 'RATING_SCALE'
  | 'PERFORMANCE_TEST'
  | 'MEASUREMENT'
  | 'SELF_ASSESSMENT';

export type FitnessDimension =
  | 'UPPER_BODY_STRENGTH'
  | 'LOWER_BODY_STRENGTH'
  | 'CORE_STABILITY'
  | 'MUSCULAR_ENDURANCE'
  | 'CARDIO_ENDURANCE'
  | 'SHOULDER_MOBILITY'
  | 'HIP_MOBILITY'
  | 'ANKLE_MOBILITY'
  | 'BALANCE'
  | 'BODY_CONTROL'
  | 'CALISTHENICS_SKILL'
  | 'RECOVERY'
  | 'TRAINING_CONSISTENCY'
  | 'PERCEIVED_EFFORT';

export interface QuestionOption {
  id: string;
  label: string;
  value: string | number;
  score: number; // 0 - 100
  isRecommended?: boolean;
}

export interface PerformanceTestConfig {
  exerciseId?: string;
  exerciseName: string;
  measurementType: 'REPETITIONS' | 'HOLD_DURATION_SECONDS' | 'DISTANCE_CM' | 'WEIGHT_KG';
  unit: string;
  minValue: number;
  maxValue: number;
  instructionText: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface MeasurementConfig {
  metricName: string;
  unit: string;
  minValue: number;
  maxValue: number;
  guideText?: string;
}

export interface RatingScaleConfig {
  minScale: number; // e.g. 1
  maxScale: number; // e.g. 5 or 10
  minLabel: string; // e.g. "Rất yếu / Rất đau"
  maxLabel: string; // e.g. "Rất tốt / Không đau"
  step: number;
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  instruction?: string;
  type: QuestionType;
  category: FitnessDimension;
  required: boolean;
  weight: number; // default weight %
  unit?: string;
  options?: QuestionOption[];
  performanceConfig?: PerformanceTestConfig;
  measurementConfig?: MeasurementConfig;
  ratingConfig?: RatingScaleConfig;
  scoringRules?: import('./scoring').ScoringRule[];
  usedInAssessmentsCount?: number;
  isBankItem?: boolean;
  version?: number;
  createdAt: string;
  updatedAt: string;
}
