export type MilestoneTier = "bronze" | "silver" | "gold" | "diamond" | "legendary" | "mythic";
export type MilestoneStatus = "unlocked" | "in_progress" | "locked";

export interface StreakMilestoneBadge {
  id: string;
  daysRequired: number;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  tier: MilestoneTier;
  status: MilestoneStatus;
  unlockedAt?: string;
  progressPercentage: number; // 0 - 100
  currentDays: number;
  rewardXp: number;
  rewardTitle: string;
  specialPerk: string;
  lore: string;
  gradient: string;
  borderColor: string;
  badgeColor: string;
}

export interface DayActivity {
  dayName: string; // T2, T3, T4, T5, T6, T7, CN
  fullDate: string; // 2026-09-30
  displayDate: string; // 30/09
  isCompleted: boolean;
  isToday: boolean;
  isRestDay: boolean;
  isFrozen: boolean;
  workoutTitle?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  freezesRemaining: number;
  freezesMax: number;
  streakMultiplier: number;
  todayCompleted: boolean;
  totalWorkouts: number;
  startDate: string;
  weeklyDays: DayActivity[];
  recentHistory: {
    date: string;
    level: 0 | 1 | 2 | 3 | 4; // intensity level for heatmap
    count: number;
    title: string;
  }[];
  nextMilestone: StreakMilestoneBadge;
  milestones: StreakMilestoneBadge[];
}
