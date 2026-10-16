export type PerformanceFitnessLevel = "Beginner" | "Intermediate" | "Advanced" | "Elite";

export type PerformanceStatus = "Active" | "Improving" | "Stable" | "At Risk" | "Inactive";

export interface PerformanceKPIs {
  personalRecordsCount: number; // e.g. 34890
  personalRecordsGrowth: number; // e.g. 12.4%
  averagePerformanceGrowth: number; // e.g. +24.5%
  streakRetentionRate: number; // e.g. 68.2%
  workoutCompletionRate: number; // e.g. 82.6%
  completionGrowth: number; // e.g. +6.8%
  activeStudents: number; // e.g. 9842
  totalWorkouts: number; // e.g. 12842
  totalReps: number; // e.g. 486291
  trainingTimeHours: number; // e.g. 18426
  averageWorkoutsPerWeek: number; // e.g. 3.8
}

export interface WeeklyTrendPoint {
  week: string; // e.g. "Week 1", "Tuần 1"
  currentPeriod: number;
  previousPeriod: number;
  difference: number;
}

export interface TrainingVolumePoint {
  week: string;
  reps: number;
  sets: number;
  durationMinutes: number;
  workouts: number;
}

export interface TopExerciseVolume {
  id: string;
  name: string;
  volumeLabel: string;
  volumeNumber: number;
  unit: "reps" | "minutes" | "sets";
  activeStudentsCount: number;
  growthPercentage: number;
  iconName: string;
}

export interface PersonalRecordItem {
  id: string;
  studentId: string;
  studentName: string;
  exerciseName: string;
  category: "reps" | "time" | "weight" | "skill";
  currentRecord: string; // e.g. "18 reps", "03:42", "+30kg"
  previousRecord: string; // e.g. "15 reps", "03:10"
  improvement: string; // e.g. "+3 reps", "+32 sec"
  dateAchieved: string;
  isRecent: boolean;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "reps" | "milestone" | "consistency" | "skill";
  unlockedCount: number;
  percentageOfUsers: number;
  targetCount?: number;
}

export interface ConsistencyHeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (Sun-Sat)
  weekNumber: number;
  level: 0 | 1 | 2 | 3; // 0: no activity, 1: low, 2: medium, 3: high
  workoutsCount: number;
  activeStudentsCount: number;
}

export interface AIMotionExerciseScore {
  exerciseName: string;
  formScore: number; // 0-100
  trend: number;
}

export interface AIMotionFormIssue {
  issueName: string;
  percentage: number;
  severity: "low" | "medium" | "high";
  recommendation: string;
}

export interface AIMotionSummary {
  averageFormScore: number;
  formScoreGrowth: number;
  exercises: AIMotionExerciseScore[];
  commonIssues: AIMotionFormIssue[];
}

export interface StudentPerformanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  initials: string;
  avatarUrl?: string;
  fitnessLevel: PerformanceFitnessLevel;
  performanceScore: number; // 0-100
  startingScore: number;
  improvementPercentage: number; // e.g. +32%
  totalWorkouts: number;
  currentStreakDays: number;
  longestStreakDays: number;
  personalRecordsCount: number;
  lastWorkoutDate: string;
  status: PerformanceStatus;
  riskReason?: string;
  trainingFrequencyWeekly: number; // e.g. 3.8
  formScoreAverage: number;
  assignedCoach: string;
}

export interface StudentWorkoutSession {
  id: string;
  studentId: string;
  date: string;
  workoutTitle: string;
  durationMinutes: number;
  exercisesCount: number;
  totalReps: number;
  formScore: number;
  caloriesBurned: number;
  completionRate: number; // %
  status: "Completed" | "Partial" | "Skipped";
}

export interface PerformanceFilterState {
  searchQuery: string;
  fitnessLevel: string; // 'all' | PerformanceFitnessLevel
  status: string; // 'all' | PerformanceStatus
  exercise: string; // 'all' | exerciseName
  timeframe: string; // '8w' | '3m' | '6m' | '1y'
  metricType: string; // 'overall' | 'strength' | 'endurance' | 'form' | 'volume'
  dateRange: string;
  riskOnly?: boolean;
}
