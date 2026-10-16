import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Users,
  CreditCard,
  Plus,
  BarChart3,
  CalendarClock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { SubscriptionHeader } from "../components/SubscriptionHeader";
import { SubscriptionMainKPICards } from "../components/SubscriptionMainKPICards";
import { PlanCardsGrid } from "../components/PlanCardsGrid";
import { CreatePlanModal } from "../components/CreatePlanModal";
import { PlanDetailEditDrawer } from "../components/PlanDetailEditDrawer";
import { SubscriberFilters } from "../components/SubscriberFilters";
import { SubscriberTable } from "../components/SubscriberTable";
import { SubscriberDetailDrawer } from "../components/SubscriberDetailDrawer";
import { UpcomingRenewalsCard } from "../components/UpcomingRenewalsCard";
import { PaymentKPICards } from "../components/PaymentKPICards";
import { PaymentFilters, PaymentFilterState } from "../components/PaymentFilters";
import { PaymentTransactionTable } from "../components/PaymentTransactionTable";
import { PaymentDetailDrawer } from "../components/PaymentDetailDrawer";
import { ExportSubscriptionReportModal, ExportOptions } from "../components/modals/ExportSubscriptionReportModal";
import { SubscriptionPlan } from "../types/subscription.types";
import { toast } from "sonner";

type SubscriptionOperationalTabKey = "plans" | "subscribers" | "renewals" | "payments";

export const AdminSubscriptionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubscriptionOperationalTabKey>("plans");

  const {
    filters,
    updateFilter,
    resetFilters,
    mainKPIs,
    isLoadingMainKPIs,
    upcomingRenewals,
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
    createPlan,
    updatePlan,
    resetToDefaults,
  } = useSubscriptions();

  // Payment Tab Internal Filter State
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilterState>({
    searchQuery: "",
    status: "ALL",
    paymentMethod: "ALL",
    dateRange: "ALL",
  });

  // Filtered transactions for the Payment tab
  const filteredTransactions = transactions.filter((tx) => {
    if (paymentFilters.status !== "ALL" && tx.status !== paymentFilters.status) return false;
    if (paymentFilters.paymentMethod !== "ALL" && tx.paymentMethod !== paymentFilters.paymentMethod) return false;
    if (paymentFilters.searchQuery) {
      const q = paymentFilters.searchQuery.toLowerCase();
      const matchCode = tx.transactionCode.toLowerCase().includes(q);
      const matchUser = tx.userName.toLowerCase().includes(q);
      const matchEmail = tx.userEmail.toLowerCase().includes(q);
      const matchInvoice = tx.invoiceId.toLowerCase().includes(q);
      if (!matchCode && !matchUser && !matchEmail && !matchInvoice) return false;
    }
    return true;
  });

  const handleExportData = (options: ExportOptions) => {
    toast.success(`Đang xuất tệp ${options.fileFormat.toUpperCase()} cho dữ liệu [${options.dataset}]...`);
  };

  const handleCreatePlanSubmit = async (newPlan: Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt">) => {
    await createPlan(newPlan);
  };

  const handleSavePlanUpdates = async (id: string, updates: Partial<SubscriptionPlan>) => {
    await updatePlan({ id, updates });
  };

  const tabs: {
    id: SubscriptionOperationalTabKey;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeClass?: string;
  }[] = [
    {
      id: "plans",
      label: "Gói hội viên",
      icon: <Layers className="h-4 w-4" />,
      badge: `${plans.length} gói`,
      badgeClass: "bg-[#EEF4E8] text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    {
      id: "subscribers",
      label: "Hội viên đăng ký",
      icon: <Users className="h-4 w-4" />,
      badge: `${subscribers.length} học viên`,
      badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    },
    {
      id: "renewals",
      label: "Gia hạn sắp tới",
      icon: <CalendarClock className="h-4 w-4" />,
      badge: `${upcomingRenewals.length} đến hạn`,
      badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    },
    {
      id: "payments",
      label: "Giao dịch thanh toán",
      icon: <CreditCard className="h-4 w-4" />,
      badge: `${transactions.length} GD`,
      badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] p-6 lg:p-8 space-y-6 dark:bg-zinc-950">
      {/* 1. Header with Breadcrumb, Link to Deep Analytics & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#172019] dark:text-white">
              Quản lý Gói Hội viên & Doanh thu
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4E8] px-3 py-1 text-xs font-semibold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              <CreditCard className="h-3.5 w-3.5 text-[#7C9B5B]" />
              Subscription Operations
            </span>
          </div>
          <p className="mt-1 text-sm text-[#687268] dark:text-zinc-400">
            Quản trị danh mục gói dịch vụ, hội viên kích hoạt, quản lý gia hạn và lịch sử đối soát thanh toán.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick link to Deep Business Analytics */}
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#172019] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#7C9B5B]" />
            <span>Phân tích & Báo cáo chuyên sâu</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#172019] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <span>Xuất báo cáo</span>
          </button>

          <button
            onClick={() => setIsCreatePlanOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tạo gói mới</span>
          </button>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[#E3E7DF] dark:bg-zinc-800" />

      {/* 2. Executive Summary - 4 Main Financial KPI Cards */}
      <SubscriptionMainKPICards
        kpis={mainKPIs}
        isLoading={isLoadingMainKPIs}
      />

      {/* 3. Operational Tab Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E3E7DF] pb-3 dark:border-zinc-800 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#7C9B5B] text-white shadow-xs"
                  : "bg-white text-[#687268] border border-[#E3E7DF] hover:bg-zinc-50 hover:text-[#172019] dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={isActive ? "text-white" : "text-[#7C9B5B]"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.badgeClass
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB 1: GÓI HỘI VIÊN (Subscription Plans Management) */}
      {activeTab === "plans" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#E3E7DF] bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-[#172019] dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#7C9B5B]" />
                <span>Danh mục Gói Hội viên CalisHealth</span>
              </h2>
              <p className="text-xs text-[#687268] dark:text-zinc-400 mt-0.5">
                Đang phát hành <strong>{plans.filter((p) => p.status === "ACTIVE").length}</strong> gói bán hàng chính thức. Mọi điều chỉnh về giá và quyền lợi sẽ áp dụng ngay lập tức cho chu kỳ tiếp theo.
              </p>
            </div>
            <button
              onClick={() => setIsCreatePlanOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Tạo gói mới</span>
            </button>
          </div>

          <PlanCardsGrid
            plans={plans}
            onEditPlan={(plan) => setSelectedPlanForEdit(plan)}
            onViewPlanDetails={(plan) => setSelectedPlanForEdit(plan)}
          />
        </div>
      )}

      {/* 5. TAB 2: HỘI VIÊN ĐĂNG KÝ (Subscribers Directory) */}
      {activeTab === "subscribers" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <SubscriberFilters
            filters={filters}
            onFilterChange={updateFilter}
            onResetFilters={resetFilters}
            totalResults={subscribers.length}
          />

          <SubscriberTable
            subscribers={subscribers}
            isLoading={isLoadingSubscribers}
            onSelectSubscriber={(sub) => setSelectedSubscriber(sub)}
          />
        </div>
      )}

      {/* 6. TAB 3: GIA HẠN SẮP TỚI (Upcoming Renewals & Notifications) */}
      {activeTab === "renewals" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <UpcomingRenewalsCard
            renewals={upcomingRenewals}
            onRemindUser={(item) => {
              toast.success(`Đã gửi email & SMS nhắc gia hạn tới học viên ${item.userName} (${item.userEmail})`);
            }}
          />

          {/* Filtered subscribers who are at risk or upcoming */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#172019] dark:text-white">
                Danh sách học viên sắp đến kỳ thanh toán hoặc tắt Auto-Renew
              </h4>
              <span className="text-xs text-[#687268] dark:text-zinc-400">
                Tự động kiểm tra chu kỳ thanh toán
              </span>
            </div>
            <SubscriberTable
              subscribers={subscribers.filter((s) => !s.autoRenewal || s.status === 'PAST_DUE' || s.status === 'GRACE_PERIOD')}
              isLoading={isLoadingSubscribers}
              onSelectSubscriber={(sub) => setSelectedSubscriber(sub)}
            />
          </div>
        </div>
      )}

      {/* 7. TAB 4: GIAO DỊCH & CỔNG THANH TOÁN (Payments & Billing) */}
      {activeTab === "payments" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <PaymentKPICards transactions={transactions} />

          <PaymentFilters
            filters={paymentFilters}
            onFilterChange={setPaymentFilters}
            onReset={() =>
              setPaymentFilters({
                searchQuery: "",
                status: "ALL",
                paymentMethod: "ALL",
                dateRange: "ALL",
              })
            }
            onExport={() => setIsExportModalOpen(true)}
            totalFiltered={filteredTransactions.length}
          />

          <PaymentTransactionTable
            transactions={filteredTransactions}
            isLoading={isLoadingTransactions}
            onViewDetail={(tx) => setSelectedTransaction(tx)}
            onRetryPayment={(tx) => {
              toast.success(`Đã gửi lại link thanh toán qua SMS & Email cho khách hàng: ${tx.userEmail}`);
            }}
            onRefundPayment={(tx) => {
              if (confirm(`Bạn có chắc muốn gửi yêu cầu hoàn tiền cho giao dịch ${tx.transactionCode}?`)) {
                toast.success(`Đã gửi yêu cầu hoàn tiền cho giao dịch ${tx.transactionCode} tới cổng thanh toán!`);
              }
            }}
          />
        </div>
      )}

      {/* DRAWERS & MODALS */}

      {/* 1. Create Plan 5-Step Wizard Modal */}
      <CreatePlanModal
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        onCreatePlan={handleCreatePlanSubmit}
      />

      {/* 2. Plan Detail & Edit Drawer (600px Sheet) */}
      <PlanDetailEditDrawer
        isOpen={!!selectedPlanForEdit}
        onClose={() => setSelectedPlanForEdit(null)}
        plan={selectedPlanForEdit}
        onSave={handleSavePlanUpdates}
      />

      {/* 3. Subscriber Detail Drawer */}
      <SubscriberDetailDrawer
        isOpen={!!selectedSubscriber}
        onClose={() => setSelectedSubscriber(null)}
        subscriber={selectedSubscriber}
      />

      {/* 4. Payment Transaction Detail Drawer */}
      <PaymentDetailDrawer
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onRetryPayment={(tx) => {
          toast.success(`Đã gửi lại biên lai và link thanh toán tới ${tx.userEmail}`);
        }}
        onRefundPayment={(tx) => {
          toast.success(`Đã gửi yêu cầu hoàn tiền cho giao dịch ${tx.transactionCode}`);
        }}
      />

      {/* 5. Export Report Modal */}
      <ExportSubscriptionReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportData}
      />
    </div>
  );
};

export default AdminSubscriptionsPage;
