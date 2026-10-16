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
