export type UserMessageSender = "COACH" | "USER" | "SYSTEM";

export type UserMessageKind =
  | "TEXT"
  | "WORKOUT_RECOMMENDATION"
  | "FORM_FEEDBACK"
  | "ASSESSMENT_REMINDER"
  | "IMAGE"
  | "VOICE";

export interface UserChatAttachment {
  type: "PLAN" | "IMAGE" | "VIDEO" | "FORM_SCORE" | "CALL_INVITE";
  title: string;
  url?: string;
  thumbnailUrl?: string;
  score?: number;
  duration?: string;
  refId?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface UserChatMessage {
  id: string;
  sender: UserMessageSender;
  kind: UserMessageKind;
  content: string;
  attachment?: UserChatAttachment | null;
  sentAt: string;
  read: boolean;
}

export interface CoachProfileInfo {
  id: string;
  name: string;
  avatar: string;
  title: string;
  badge: string;
  experience: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  online: boolean;
  responseRate: string;
  bio: string;
}
