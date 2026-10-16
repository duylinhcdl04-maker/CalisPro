export type ContentType =
  | "NEWS"
  | "EVENT"
  | "CHALLENGE"
  | "REWARD"
  | "COMMUNITY"
  | "PRODUCT_UPDATE";

export type ContentStatus =
  | "DRAFT"
  | "REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export type AudiencePlan = "ALL" | "FREE" | "PRO" | "PREMIUM" | "TRIAL";
export type AudienceFitnessLevel = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface ContentAudienceTargeting {
  targetPlan: AudiencePlan;
  targetLevel: AudienceFitnessLevel;
  minStreakDays?: number;
  isNewUserOnly?: boolean;
}

export interface ContentEventDetails {
  startDate: string;
  endDate: string;
  location: string;
  isOnline: boolean;
  meetingUrl?: string;
  registrationUrl?: string;
  maxParticipants: number;
  currentParticipants: number;
  organizer: string;
}

export interface ContentChallengeDetails {
  startDate: string;
  endDate: string;
  rulesSummary: string;
  targetGoal: string; // e.g. "Hoàn thành 500 reps Push-up trong 14 ngày"
  rewardDescription: string;
  leaderboardEnabled: boolean;
  maxParticipants?: number;
  currentParticipants: number;
}

export interface ContentRewardDetails {
  rewardType: "VOUCHER" | "MERCHANDISE" | "BADGE" | "SUBSCRIPTION_DISCOUNT";
  rewardValue: string; // e.g. "500,000 ₫" hoặc "Gói Pro 1 tháng"
  eligibilityRequirement: string;
  totalQuantity: number;
  claimedQuantity: number;
  claimDeadline: string;
  voucherCode?: string;
}

export interface ContentProductUpdateDetails {
  version: string; // e.g. "v2.4.0"
  releaseDate: string;
  highlightFeatures: string[];
  changelog: string;
}

export interface ContentCommunityDetails {
  activityName: string;
  location: string;
  eventDate: string;
  galleryImages: string[];
  participantCount: number;
}

export interface ContentAnalytics {
  views: number;
  uniqueViews: number;
  clicks: number;
  shares: number;
  likes: number;
  registrations?: number;
  completionCount?: number;
  engagementRate: number; // e.g. 18.5%
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  shortDescription: string;
  content: string; // Markdown or HTML text
  coverImage: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  status: ContentStatus;
  audience: ContentAudienceTargeting;
  featured: boolean;
  pinnedToHome: boolean;
  
  // Specific Type metadata
  eventDetails?: ContentEventDetails;
  challengeDetails?: ContentChallengeDetails;
  rewardDetails?: ContentRewardDetails;
  productUpdateDetails?: ContentProductUpdateDetails;
  communityDetails?: ContentCommunityDetails;

  // Analytics
  analytics: ContentAnalytics;

  // Timestamps & Audit
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  publishedAt?: string;
  archivedAt?: string;
  createdBy: string;
  approvedBy?: string;
}

export interface ContentFilterState {
  searchQuery: string;
  type: ContentType | "ALL";
  status: ContentStatus | "ALL";
  targetPlan: AudiencePlan | "ALL";
  category: string | "ALL";
  sortBy: "latest" | "most_viewed" | "engagement" | "oldest";
}

export interface ContentKPIs {
  totalPublished: number;
  totalViewsMonthly: number;
  activeEventsAndChallenges: number;
  totalRegistrations: number;
  viewsGrowth: number;
  publishedGrowth: number;
}
