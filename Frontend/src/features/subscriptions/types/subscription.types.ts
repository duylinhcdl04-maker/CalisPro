export type BillingCycle = "TRIAL" | "MONTHLY" | "ANNUAL";

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "GRACE_PERIOD"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

export type PaymentMethod = "VNPAY" | "MOMO" | "BANK_TRANSFER" | "CREDIT_CARD";

export interface PlanFeature {
  id: string;
  name: string;
  included: boolean;
  limitLabel?: string;
  category: "core" | "library" | "ai" | "assessment" | "coaching";
}

export interface PlanFeatureLimits {
  aiCoachingSessions: number | "UNLIMITED";
  aiMotionAnalysis: number | "UNLIMITED" | "LIMITED";
  assessmentsPerMonth: number | "UNLIMITED";
  workoutPlans: number | "UNLIMITED";
  workoutHistoryDays: number;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number; // in VND (e.g. 199000, 299000, 1199000)
  currency: string;
  billingCycle: BillingCycle;
  trialDays: number;
  status: "ACTIVE" | "INACTIVE";
  badge?: "POPULAR" | "BEST_VALUE" | "TRIAL";
  subscriberCount: number;
  mrr: number;
  churnRate: number; // e.g. 4.2%
  trialConversionRate?: number; // e.g. 31.4%
  features: PlanFeature[];
  limits: PlanFeatureLimits;
  annualSavingsText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionMainKPIs {
  activeSubscribers: number; // e.g. 4281
  activeSubscribersGrowth: number; // e.g. +8.4%
  mrr: number; // e.g. 480000000
  mrrGrowth: number; // e.g. +9.4%
  revenueThisMonth: number; // e.g. 512400000
  revenueGrowth: number; // e.g. +12.8%
  renewalRate: number; // e.g. 84.2%
  renewalGrowth: number; // e.g. +3.8%
}

export interface SubscriptionSecondaryKPIs {
  activeTrials: number; // e.g. 1284
  trialToPaidConversion: number; // e.g. 31.2%
  churnRate: number; // e.g. 5.8%
  upcomingRenewalsCount: number; // e.g. 382
  expectedRenewalRevenue: number; // e.g. 86420000
}

export interface RevenueAnalyticsPoint {
  period: string; // "T1", "T2", "Jan", etc.
  revenue: number; // e.g. 320000000
  mrr: number; // e.g. 290000000
  isForecast?: boolean;
}

export interface PlanRevenueDistribution {
  planId: string;
  planName: string;
  percentage: number; // e.g. 51%
  revenue: number; // e.g. 304900000
  subscribers: number; // e.g. 1021
  color: string;
}

export interface PlanSubscriberDistribution {
  planId: string;
  planName: string;
  percentage: number; // e.g. 43%
  subscribers: number; // e.g. 1842
  color: string;
}

export interface SubscriptionFunnelStep {
  stepName: string;
  label: string;
  count: number;
  conversionRate: number; // % relative to previous step
  dropOffRate: number;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  eventType: "CREATED" | "TRIAL_STARTED" | "TRIAL_CONVERTED" | "RENEWED" | "CANCELLED" | "EXPIRED" | "PLAN_CHANGED";
  title: string;
  description: string;
  timestamp: string;
}

export interface SubscriberRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAvatar?: string;
  initials: string;
  planId: string;
  planCode: string;
  planName: string;
  billingCycle: BillingCycle;
  price: number;
  startDate: string;
  expiryDate: string;
  autoRenewal: boolean;
  status: SubscriptionStatus;
  paymentMethod: PaymentMethod;
  totalPaid: number;
  consecutiveRenewals: number;
  aiCoachingSessionsUsed: number;
  aiMotionAnalysesUsed: number;
  recentTransactionsCount: number;
}

export interface PaymentTransaction {
  id: string;
  transactionCode: string; // e.g. "TXN-2026-9812"
  invoiceId: string; // e.g. "INV-2026-0901"
  gatewayTransactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  initials: string;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  gateway: "VNPAY" | "MOMO" | "VIETCOMBANK" | "STRIPE" | "LOCAL_GATEWAY";
  status: PaymentStatus;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  receiptUrl?: string;
}

export interface UpcomingRenewalItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  renewalDate: string;
  daysRemaining: number;
  autoRenewal: boolean;
  status: "NORMAL" | "EXPIRING_24H" | "AUTO_RENEWAL_OFF";
}

export interface ChurnReasonItem {
  reason: string;
  percentage: number;
  count: number;
}

export interface BusinessInsightItem {
  id: string;
  type: "positive" | "warning" | "info";
  title: string;
  description: string;
  actionText: string;
  actionTargetTab?: "analytics" | "plans" | "subscribers" | "payments";
}

export interface SubscriptionFilterState {
  searchQuery: string;
  plan: string; // 'all' | planId
  billingCycle: string; // 'all' | BillingCycle
  status: string; // 'all' | SubscriptionStatus
  paymentStatus: string; // 'all' | PaymentStatus
  timeframe: string; // '7d' | '30d' | '3m' | '6m' | '12m'
  autoRenewalOnly?: boolean;
  atRiskOnly?: boolean;
}
