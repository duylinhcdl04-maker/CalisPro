import type { ISODateString, Severity, StudentRef, Weekday } from "./common";
import type { AttentionAlert } from "./student";
import type { WorkoutSessionSummary } from "./session";
import type { CalendarEvent, CoachNotificationType } from "./communication";

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number;
}

export interface CoachProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  bio: string;
  specializations: string[];
  experienceYears: number;
  certifications: Certification[];
  assignedStudents: number;
  rating: number;
  location: string;
  languages: string[];
}

export type CoachProfileInput = Pick<CoachProfile, "name" | "phone" | "bio" | "specializations" | "experienceYears" | "location">;

export interface AvailabilitySlot {
  day: Weekday;
  enabled: boolean;
  /** "HH:mm" */
  start: string;
  end: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  digest: "OFF" | "DAILY" | "WEEKLY";
  types: Record<CoachNotificationType, boolean>;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChangeAt: ISODateString;
  activeSessions: { id: string; device: string; location: string; lastActiveAt: ISODateString; current: boolean }[];
}

export interface CoachSettings {
  notifications: NotificationPreferences;
  availability: AvailabilitySlot[];
  security: SecuritySettings;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/* ---------------------------------- Dashboard ---------------------------------- */

export type DashboardKpiKey = "TOTAL_STUDENTS" | "ACTIVE_STUDENTS" | "NEEDS_ATTENTION" | "ASSESSMENTS_DUE";

export interface DashboardKpi {
  key: DashboardKpiKey;
  label: string;
  value: number;
  description: string;
  trend: { direction: "up" | "down" | "flat"; value: string; label: string } | null;
  status: Severity;
  /** Every KPI leads to an action (UX principle #8). */
  href: string;
}

export type AchievementType = "PR" | "STREAK" | "LEVEL_UP" | "CHALLENGE";

export interface Achievement extends StudentRef {
  id: string;
  type: AchievementType;
  title: string;
  detail: string;
  achievedAt: ISODateString;
}

export interface CoachDashboard {
  coachName: string;
  kpis: DashboardKpi[];
  todaySchedule: CalendarEvent[];
  attention: AttentionAlert[];
  achievements: Achievement[];
  recentSessions: WorkoutSessionSummary[];
}

/** Lightweight status for the topbar AI indicator. */
export interface AISystemStatus {
  status: "OPERATIONAL" | "DEGRADED" | "OFFLINE";
  label: string;
  queuedAnalyses: number;
}
