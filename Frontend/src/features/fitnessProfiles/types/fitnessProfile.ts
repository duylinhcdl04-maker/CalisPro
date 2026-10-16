export type FitnessLevel = "Beginner" | "Intermediate" | "Advanced" | "Elite";

export type TrainingGoal =
  | "Strength"
  | "Endurance"
  | "Hypertrophy"
  | "Mobility"
  | "Skill"
  | "WeightLoss"
  | "GeneralFitness";

export type ProfileStatus = "Healthy" | "Needs Attention" | "Reassessment Due" | "Inactive" | "Injured";

export type FitnessDimensionType = "strength" | "endurance" | "mobility" | "core" | "balance" | "skill";

export interface FitnessDimensionScore {
  dimension: FitnessDimensionType;
  label: string;
  score: number; // 0-100
  trend: number; // +/- percentage or points
  color?: string;
}

export interface Student {
  id: string;
  code: string;
  fullName: string;
  avatarUrl?: string;
  initials: string;
  email: string;
  phone: string;
  age: number;
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  bmi: number;
  joinDate: string;
  assignedCoach: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  primaryGoal: string;
  targetLevel: FitnessLevel;
}

export interface FitnessProfile {
  id: string;
  studentId: string;
  student: Student;
  overallScore: number; // 0-100
  previousScore: number;
  level: FitnessLevel;
  status: ProfileStatus;
  trend: number; // e.g. +8.2%
  
  // 6 Primary Dimensions
  strength: number;
  endurance: number;
  mobility: number;
  core: number;
  balance: number;
  skill: number;

  dimensionTrends: Record<FitnessDimensionType, number>;

  lastAssessmentId?: string;
  lastAssessmentName: string;
  lastAssessmentDate: string;
  nextAssessmentDate: string;
  isReassessmentOverdue: boolean;

  totalWorkoutsCompleted: number;
  activeStreakDays: number;
  aiMotionAverageScore: number;
  notesCount: number;
  updatedAt: string;
}

export interface AssessmentRecord {
  id: string;
  studentId: string;
  assessmentId?: string;
  assessmentTitle: string;
  type: "Initial Assessment" | "Periodic Reassessment" | "Strength Milestone" | "Mobility Check" | "Custom";
  date: string;
  overallScore: number;
  scoreChange: number;
  levelAssigned: FitnessLevel;
  status: "Completed" | "In Review" | "Needs Attention" | "Scheduled";
  durationMinutes: number;
  evaluatorType: "AI" | "Coach" | "Hybrid";
  evaluatorName: string;
  
  dimensionBreakdown: {
    strength: number;
    endurance: number;
    mobility: number;
    core: number;
    balance: number;
    skill: number;
  };

  completedExercises: {
    exerciseName: string;
    performance: string; // e.g., "12 reps", "60 sec", "85kg"
    score: number;
    grade: "S" | "A" | "B" | "C" | "D";
    note?: string;
  }[];

  aiEvaluation: {
    summary: string;
    postureScore: number;
    symmetryScore: number;
    recommendation: string;
  };

  coachEvaluation?: {
    coachName: string;
    comment: string;
    targetFocus: string;
  };
}

export interface DimensionProgressDetail {
  dimension: FitnessDimensionType;
  label: string;
  startScore: number;
  currentScore: number;
  changeValue: number;
  changePercentage: number;
  history: { date: string; score: number }[];
}

export interface FitnessProgressSummary {
  studentId: string;
  startingOverallScore: number;
  currentOverallScore: number;
  totalImprovementPercentage: number;
  startDate: string;
  currentDate: string;
  dimensions: DimensionProgressDetail[];
  scoreTimeline: {
    date: string;
    overall: number;
    strength: number;
    endurance: number;
    mobility: number;
    core: number;
    balance: number;
    skill: number;
  }[];
}

export interface MotionAnalysisRecord {
  id: string;
  studentId: string;
  exerciseName: string;
  date: string;
  formScore: number; // 0-100
  repetitionQuality: number; // %
  rangeOfMotion: number; // %
  tempoScore: number; // %
  stabilityScore: number; // %
  
  commonErrors: {
    errorName: string;
    frequencyPercentage: number;
    severity: "low" | "medium" | "high";
    description: string;
  }[];

  weeklyTrend: {
    week: string;
    score: number;
  }[];

  aiFeedback: string;
  videoUrl?: string;
}

export interface CoachNote {
  id: string;
  studentId: string;
  coachId: string;
  coachName: string;
  coachAvatar?: string;
  date: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  priority: "normal" | "important" | "urgent";
}

export interface FitnessAlert {
  id: string;
  type: "danger" | "warning" | "success" | "info";
  category: "OVERDUE_REASSESSMENT" | "LOW_MOBILITY" | "HIGH_PROGRESS" | "DECLINING_PERFORMANCE";
  title: string;
  description: string;
  count: number;
  targetFilter: {
    level?: string;
    status?: string;
    minScore?: number;
    maxScore?: number;
    dimension?: FitnessDimensionType;
    isOverdue?: boolean;
  };
  ctaText: string;
}

export interface FitnessKpiData {
  totalProfiles: number;
  activeProfiles: number;
  averageScore: number;
  averageScoreTrend: number;
  improvingCount: number;
  improvingPercentage: number;
  reassessmentDueCount: number;
  reassessmentDuePercentage: number;
}

export interface FitnessLevelDistribution {
  level: FitnessLevel;
  count: number;
  percentage: number;
  color: string;
}

export interface GlobalFitnessTrendPoint {
  month: string;
  overall: number;
  strength: number;
  endurance: number;
  mobility: number;
  core: number;
  balance: number;
  skill: number;
}

export interface FitnessProfilesFilterState {
  searchQuery: string;
  level: string; // 'all' | FitnessLevel
  goal: string; // 'all' | TrainingGoal
  status: string; // 'all' | ProfileStatus
  assessmentType: string; // 'all' | type
  timeframe: string; // '30d' | '90d' | '6m' | '1y' | 'all'
  startDate?: string;
  endDate?: string;
  dimensionFilter?: FitnessDimensionType | "all";
  overdueOnly?: boolean;
}
