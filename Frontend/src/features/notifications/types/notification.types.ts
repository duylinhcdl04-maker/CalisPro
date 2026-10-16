export type NotificationChannel = "EMAIL" | "IN_APP" | "PUSH";

export type NotificationCategory =
  | "SUBSCRIPTION"
  | "TRIAL"
  | "TRAINING"
  | "ACHIEVEMENT"
  | "ASSESSMENT"
  | "SYSTEM";

export type DeliveryStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "CLICKED"
  | "FAILED";

export type NotificationType = "TRANSACTIONAL" | "MARKETING";

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: NotificationCategory;
  triggerEvent: string; // e.g. "SUBSCRIPTION_EXPIRING_3_DAYS", "WORKOUT_MISSED_2_DAYS", "PR_RECORD_BROKEN"
  conditionSummary: string; // e.g. "Gói Pro/Premium còn <= 3 ngày"
  channels: NotificationChannel[];
  targetAudience: string; // e.g. "Hội viên có gói trả phí"
  templateId: string;
  status: "ACTIVE" | "PAUSED";
  stats: {
    triggered: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    conversionRate?: number;
  };
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastCampaign {
  id: string;
  name: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  targetAudience: string;
  recipientCount: number;
  subject: string;
  bodyPreview: string;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "CANCELLED";
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  createdBy: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  code: string; // e.g. "TPL_SUB_RENEWAL_3D"
  name: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  subject: string;
  body: string; // text or HTML with {{variables}}
  variables: string[]; // e.g. ["user.name", "subscription.expiry_date", "subscription.plan"]
  description: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientAvatar?: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  bodySummary: string;
  status: DeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  ruleOrCampaignName?: string;
}

export interface NotificationKPIs {
  totalSentMonthly: number;
  deliveryRate: number; // e.g. 98.6%
  openRate: number; // e.g. 42.8%
  clickThroughRate: number; // e.g. 18.4%
  activeAutomations: number;
  totalAutomations: number;
}
