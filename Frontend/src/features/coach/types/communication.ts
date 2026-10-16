import type { ISODateString, Severity, StudentRef } from "./common";

/* ---------------------------------- Messages ---------------------------------- */

export type MessageSender = "COACH" | "STUDENT";

/** Students send TEXT / WORKOUT_QUESTION / ASSESSMENT_QUESTION; coaches send TEXT / FEEDBACK / WORKOUT_PLAN / RECOMMENDATION. */
export type MessageKind =
  | "TEXT"
  | "WORKOUT_QUESTION"
  | "ASSESSMENT_QUESTION"
  | "FEEDBACK"
  | "WORKOUT_PLAN"
  | "RECOMMENDATION";

export interface MessageAttachment {
  type: "PLAN" | "SESSION" | "ASSESSMENT";
  refId: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  kind: MessageKind;
  content: string;
  attachment: MessageAttachment | null;
  sentAt: ISODateString;
  read: boolean;
}

export interface Conversation extends StudentRef {
  id: string;
  lastMessage: string;
  lastMessageAt: ISODateString;
  unreadCount: number;
  online: boolean;
}

export interface SendMessageInput {
  conversationId: string;
  kind: MessageKind;
  content: string;
  attachment?: MessageAttachment | null;
}

/* -------------------------------- Notifications -------------------------------- */

export type CoachNotificationType = "STUDENT" | "ASSESSMENT" | "WORKOUT" | "AI" | "ACHIEVEMENT" | "SYSTEM";

export interface CoachNotification {
  id: string;
  type: CoachNotificationType;
  severity: Severity;
  title: string;
  message: string;
  createdAt: ISODateString;
  read: boolean;
  /** In-app route the notification leads to. */
  href: string | null;
}

/* ----------------------------------- Calendar ---------------------------------- */

export type CalendarEventType = "ASSESSMENT" | "WORKOUT_REVIEW" | "PROGRESS_REVIEW" | "COACHING_SESSION";
export type CalendarEventStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  studentId: string | null;
  studentName: string | null;
  studentAvatar: string | null;
  start: ISODateString;
  end: ISODateString;
  status: CalendarEventStatus;
  location: string;
  notes: string;
}

export interface CalendarRangeParams {
  from: ISODateString;
  to: ISODateString;
}

export interface CalendarEventInput {
  title: string;
  type: CalendarEventType;
  studentId: string | null;
  start: ISODateString;
  end: ISODateString;
  location: string;
  notes: string;
}
