import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "../services/subscriptionService";
import {
  SubscriptionPlan,
  SubscriberRecord,
  PaymentTransaction,
  SubscriptionFilterState,
} from "../types/subscription.types";
import { DEFAULT_SUBSCRIPTION_FILTERS } from "../constants/subscription.constants";
import { toast } from "sonner";

export const SUBSCRIPTION_QUERY_KEYS = {
  all: ["subscriptions-management"] as const,
  mainKPIs: ["subscriptions-management", "main-kpis"] as const,
  secondaryKPIs: ["subscriptions-management", "secondary-kpis"] as const,
  revenueAnalytics: (timeframe: string) => ["subscriptions-management", "revenue-analytics", timeframe] as const,
  revenueByPlan: ["subscriptions-management", "revenue-by-plan"] as const,
  subscriberDistribution: ["subscriptions-management", "subscriber-distribution"] as const,
  funnel: ["subscriptions-management", "funnel"] as const,
  upcomingRenewals: ["subscriptions-management", "upcoming-renewals"] as const,
  churnReasons: ["subscriptions-management", "churn-reasons"] as const,
  insights: ["subscriptions-management", "insights"] as const,
  plans: ["subscriptions-management", "plans"] as const,
  planDetail: (id: string) => ["subscriptions-management", "plan-detail", id] as const,
  subscribers: (filters: Partial<SubscriptionFilterState>) => ["subscriptions-management", "subscribers", filters] as const,
  subscriberDetail: (id: string) => ["subscriptions-management", "subscriber-detail", id] as const,
  transactions: (status: string, method: string) => ["subscriptions-management", "transactions", status, method] as const,
};

export const useSubscriptions = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SubscriptionFilterState>(DEFAULT_SUBSCRIPTION_FILTERS);

  // Selected entities for Drawers & Modals
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<SubscriptionPlan | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberRecord | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // 1. Queries
  const { data: mainKPIs, isLoading: isLoadingMainKPIs } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.mainKPIs,
    queryFn: subscriptionService.getMainKPIs,
  });

  const { data: secondaryKPIs, isLoading: isLoadingSecondaryKPIs } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.secondaryKPIs,
    queryFn: subscriptionService.getSecondaryKPIs,
  });

  const { data: revenueAnalytics = [], isLoading: isLoadingAnalytics } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.revenueAnalytics(filters.timeframe),
    queryFn: () => subscriptionService.getRevenueAnalytics(filters.timeframe),
  });

  const { data: revenueByPlan = [] } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.revenueByPlan,
    queryFn: subscriptionService.getRevenueByPlan,
  });

  const { data: subscriberDistribution = [] } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.subscriberDistribution,
    queryFn: subscriptionService.getSubscriberDistribution,
  });

  const { data: funnel = [] } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.funnel,
    queryFn: subscriptionService.getSubscriptionFunnel,
  });

  const { data: upcomingRenewals = [] } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.upcomingRenewals,
    queryFn: subscriptionService.getUpcomingRenewals,
  });

  const { data: churnReasons = [] } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.churnReasons,
    queryFn: subscriptionService.getChurnReasons,
  });

  const { data: businessInsights = [] } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.insights,
    queryFn: subscriptionService.getBusinessInsights,
  });

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.plans,
    queryFn: subscriptionService.getPlans,
  });

  const { data: subscribers = [], isLoading: isLoadingSubscribers } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.subscribers(filters),
    queryFn: () => subscriptionService.getSubscribers(filters),
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.transactions(filters.paymentStatus, "all"),
    queryFn: () => subscriptionService.getTransactions(filters.paymentStatus, "all"),
  });

  // 2. Mutations
  const createPlanMutation = useMutation({
    mutationFn: subscriptionService.createPlan,
    onSuccess: (newPlan) => {
      toast.success(`Đã tạo gói ${newPlan.name} thành công!`);
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.plans });
      setIsCreatePlanOpen(false);
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SubscriptionPlan> }) =>
      subscriptionService.updatePlan(id, updates),
    onSuccess: (updated) => {
      toast.success(`Đã cập nhật cấu hình gói ${updated.name}!`);
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.plans });
      setSelectedPlanForEdit(null);
    },
  });

  const resetDataMutation = useMutation({
    mutationFn: async () => {
      subscriptionService.resetToDefaults();
    },
    onSuccess: () => {
      toast.success("Đã khôi phục dữ liệu mẫu gói hội viên & doanh thu chuẩn!");
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.all });
    },
  });

  // 3. Filter helpers
  const updateFilter = <K extends keyof SubscriptionFilterState>(
    key: K,
    value: SubscriptionFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_SUBSCRIPTION_FILTERS);
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    mainKPIs,
    isLoadingMainKPIs,
    secondaryKPIs,
    isLoadingSecondaryKPIs,
    revenueAnalytics,
    isLoadingAnalytics,
    revenueByPlan,
    subscriberDistribution,
    funnel,
    upcomingRenewals,
    churnReasons,
    businessInsights,
    plans,
    isLoadingPlans,
    subscribers,
    isLoadingSubscribers,
    transactions,
    isLoadingTransactions,
    selectedPlanForEdit,
    setSelectedPlanForEdit,
    selectedSubscriber,
    setSelectedSubscriber,
    selectedTransaction,
    setSelectedTransaction,
    isCreatePlanOpen,
    setIsCreatePlanOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    createPlan: createPlanMutation.mutateAsync,
    updatePlan: updatePlanMutation.mutateAsync,
    resetToDefaults: resetDataMutation.mutateAsync,
  };
};
