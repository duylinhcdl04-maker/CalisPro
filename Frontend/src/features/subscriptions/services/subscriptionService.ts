import {
  SubscriptionPlan,
  SubscriptionMainKPIs,
  SubscriptionSecondaryKPIs,
  RevenueAnalyticsPoint,
  PlanRevenueDistribution,
  PlanSubscriberDistribution,
  SubscriptionFunnelStep,
  SubscriberRecord,
  PaymentTransaction,
  UpcomingRenewalItem,
  ChurnReasonItem,
  BusinessInsightItem,
  SubscriptionFilterState,
} from "../types/subscription.types";
import {
  MOCK_SUBSCRIPTION_PLANS,
  MOCK_SUBSCRIPTION_KPIS,
  MOCK_SECONDARY_KPIS,
  MOCK_REVENUE_ANALYTICS,
  MOCK_REVENUE_BY_PLAN,
  MOCK_SUBSCRIBER_DISTRIBUTION,
  MOCK_SUBSCRIPTION_FUNNEL,
  MOCK_CHURN_REASONS,
  MOCK_UPCOMING_RENEWALS,
  MOCK_BUSINESS_INSIGHTS,
  MOCK_SUBSCRIBERS,
  MOCK_PAYMENT_TRANSACTIONS,
} from "../mock/subscription.mock";

const STORAGE_KEYS = {
  PLANS: "calishealth_sub_plans_v1",
  SUBSCRIBERS: "calishealth_subscribers_v1",
  TRANSACTIONS: "calishealth_transactions_v1",
};

export const subscriptionService = {
  // 1. KPIs
  async getMainKPIs(): Promise<SubscriptionMainKPIs> {
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_SUBSCRIPTION_KPIS;
  },

  async getSecondaryKPIs(): Promise<SubscriptionSecondaryKPIs> {
    await new Promise((r) => setTimeout(r, 100));
    return MOCK_SECONDARY_KPIS;
  },

  // 2. Analytics & Charts
  async getRevenueAnalytics(timeframe = "12m"): Promise<RevenueAnalyticsPoint[]> {
    await new Promise((r) => setTimeout(r, 150));
    if (timeframe === "30d" || timeframe === "7d") {
      return MOCK_REVENUE_ANALYTICS.slice(-4);
    }
    if (timeframe === "3m") {
      return MOCK_REVENUE_ANALYTICS.slice(-3);
    }
    if (timeframe === "6m") {
      return MOCK_REVENUE_ANALYTICS.slice(-6);
    }
    return MOCK_REVENUE_ANALYTICS;
  },

  async getRevenueByPlan(): Promise<PlanRevenueDistribution[]> {
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_REVENUE_BY_PLAN;
  },

  async getSubscriberDistribution(): Promise<PlanSubscriberDistribution[]> {
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_SUBSCRIBER_DISTRIBUTION;
  },

  async getSubscriptionFunnel(): Promise<SubscriptionFunnelStep[]> {
    await new Promise((r) => setTimeout(r, 100));
    return MOCK_SUBSCRIPTION_FUNNEL;
  },

  async getUpcomingRenewals(): Promise<UpcomingRenewalItem[]> {
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_UPCOMING_RENEWALS;
  },

  async getChurnReasons(): Promise<ChurnReasonItem[]> {
    await new Promise((r) => setTimeout(r, 100));
    return MOCK_CHURN_REASONS;
  },

  async getBusinessInsights(): Promise<BusinessInsightItem[]> {
    await new Promise((r) => setTimeout(r, 100));
    return MOCK_BUSINESS_INSIGHTS;
  },

  // 3. Plans CRUD
  async getPlans(): Promise<SubscriptionPlan[]> {
    await new Promise((r) => setTimeout(r, 150));
    const cached = localStorage.getItem(STORAGE_KEYS.PLANS);
    if (!cached) {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(MOCK_SUBSCRIPTION_PLANS));
      return MOCK_SUBSCRIPTION_PLANS;
    }
    try {
      return JSON.parse(cached);
    } catch {
      return MOCK_SUBSCRIPTION_PLANS;
    }
  },

  async getPlanById(id: string): Promise<SubscriptionPlan | null> {
    const plans = await this.getPlans();
    return plans.find((p) => p.id === id || p.code === id) || null;
  },

  async createPlan(planData: Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt">): Promise<SubscriptionPlan> {
    const plans = await this.getPlans();
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...plans, newPlan];
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updated));
    return newPlan;
  },

  async updatePlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plans = await this.getPlans();
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Plan not found");
    const updatedPlan: SubscriptionPlan = {
      ...plans[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    plans[index] = updatedPlan;
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    return updatedPlan;
  },

  // 4. Subscribers List & Detail
  async getSubscribers(filters?: Partial<SubscriptionFilterState>): Promise<SubscriberRecord[]> {
    await new Promise((r) => setTimeout(r, 150));
    const cached = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
    let list: SubscriberRecord[] = MOCK_SUBSCRIBERS;
    if (cached) {
      try {
        list = JSON.parse(cached);
      } catch {
        list = MOCK_SUBSCRIBERS;
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(MOCK_SUBSCRIBERS));
    }

    if (!filters) return list;

    return list.filter((sub) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = sub.userName.toLowerCase().includes(q);
        const matchesEmail = sub.userEmail.toLowerCase().includes(q);
        const matchesPlan = sub.planName.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPlan) return false;
      }
      if (filters.plan && filters.plan !== "all" && sub.planId !== filters.plan && sub.planCode !== filters.plan) {
        return false;
      }
      if (filters.billingCycle && filters.billingCycle !== "all" && sub.billingCycle !== filters.billingCycle) {
        return false;
      }
      if (filters.status && filters.status !== "all" && sub.status !== filters.status) {
        return false;
      }
      if (filters.autoRenewalOnly && !sub.autoRenewal) {
        return false;
      }
      if (filters.atRiskOnly && sub.status !== "PAST_DUE" && sub.status !== "CANCELLED") {
        return false;
      }
      return true;
    });
  },

  async getSubscriberById(id: string): Promise<SubscriberRecord | null> {
    const list = await this.getSubscribers();
    return list.find((s) => s.id === id || s.userId === id) || null;
  },

  // 5. Payment Transactions
  async getTransactions(paymentStatus = "all", method = "all"): Promise<PaymentTransaction[]> {
    await new Promise((r) => setTimeout(r, 120));
    const cached = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    let list: PaymentTransaction[] = MOCK_PAYMENT_TRANSACTIONS;
    if (cached) {
      try {
        list = JSON.parse(cached);
      } catch {
        list = MOCK_PAYMENT_TRANSACTIONS;
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(MOCK_PAYMENT_TRANSACTIONS));
    }

    return list.filter((tx) => {
      if (paymentStatus !== "all" && tx.status !== paymentStatus) return false;
      if (method !== "all" && tx.paymentMethod !== method) return false;
      return true;
    });
  },

  // 6. Reset Defaults
  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.PLANS);
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIBERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  },
};
