import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Download,
  Calendar,
  Layers,
  Users,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  LineChart,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { SubscriptionMainKPICards } from '../components/SubscriptionMainKPICards';
import { SubscriptionSecondaryKPIs } from '../components/SubscriptionSecondaryKPIs';
import { RevenueAnalyticsChart } from '../components/RevenueAnalyticsChart';
import { RevenueByPlanChart } from '../components/RevenueByPlanChart';
import { SubscriberDistributionChart } from '../components/SubscriberDistributionChart';
import { SubscriptionFunnelChart } from '../components/SubscriptionFunnelChart';
import { ChurnRetentionCard } from '../components/ChurnRetentionCard';
import { BusinessInsightsAlerts } from '../components/BusinessInsightsAlerts';
import { CohortRetentionTable } from '../components/CohortRetentionTable';
import { ExportSubscriptionReportModal, ExportOptions } from '../components/modals/ExportSubscriptionReportModal';
import { toast } from 'sonner';

type AnalyticsTabKey = 'revenue_mrr' | 'growth_funnel' | 'retention_cohort' | 'ai_reports';

export const AdminBusinessAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTabKey>('revenue_mrr');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    mainKPIs,
    isLoadingMainKPIs,
    secondaryKPIs,
    isLoadingSecondaryKPIs,
    revenueAnalytics,
    isLoadingAnalytics,
    revenueByPlan,
    subscriberDistribution,
    funnel,
    churnReasons,
    businessInsights,
  } = useSubscriptions();

  const handleExportData = (options: ExportOptions) => {
    toast.success(`Đang khởi tạo tệp báo cáo ${options.fileFormat.toUpperCase()} (${options.dateRange})... Tệp sẽ tự động tải xuống!`);
  };

  const tabs: {
    id: AnalyticsTabKey;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeClass?: string;
  }[] = [
    {
      id: 'revenue_mrr',
      label: 'Doanh thu & MRR',
      icon: <BarChart3 className="h-4 w-4" />,
      badge: '+12.8% YoY',
      badgeClass: 'bg-[#EEF4E8] text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'growth_funnel',
      label: 'Tăng trưởng & Phễu chuyển đổi',
      icon: <TrendingUp className="h-4 w-4" />,
      badge: '31.2% Conv.',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      id: 'retention_cohort',
      label: 'Giữ chân & Ma trận Cohort',
      icon: <LineChart className="h-4 w-4" />,
      badge: '94.2% Retention',
      badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    },
    {
      id: 'ai_reports',
      label: 'Khuyến nghị AI & Báo cáo',
      icon: <Sparkles className="h-4 w-4" />,
      badge: 'AI Insights',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] p-6 lg:p-8 space-y-6 dark:bg-zinc-950">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#172019] dark:text-white">
              Phân tích Doanh thu & Báo cáo Tăng trưởng
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4E8] px-3 py-1 text-xs font-semibold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              <BarChart3 className="h-3.5 w-3.5 text-[#7C9B5B]" />
              Business Intelligence & Analytics
            </span>
          </div>
          <p className="mt-1 text-sm text-[#687268] dark:text-zinc-400">
            Trung tâm dữ liệu phân tích chỉ số tài chính, xu hướng MRR, phễu chuyển đổi và ma trận giữ chân người dùng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/subscriptions"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#172019] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <Layers className="h-3.5 w-3.5 text-[#7C9B5B]" />
            <span>Quản lý Gói & Hội viên</span>
          </Link>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Xuất Báo cáo (Excel/PDF)</span>
          </button>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[#E3E7DF] dark:bg-zinc-800" />

      {/* 2. Executive Metric Cards */}
      <SubscriptionMainKPICards kpis={mainKPIs} isLoading={isLoadingMainKPIs} />

      {/* 3. Clean Responsive Tab Switcher - No Horizontal Scrollbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E3E7DF] pb-3 dark:border-zinc-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#7C9B5B] text-white shadow-xs'
                  : 'bg-white text-[#687268] border border-[#E3E7DF] hover:bg-zinc-50 hover:text-[#172019] dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#7C9B5B]'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeClass
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* Tab 1: DOANH THU & MRR */}
      {activeTab === 'revenue_mrr' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Main Area Chart & Plan Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 xl:col-span-7">
              <RevenueAnalyticsChart
                data={revenueAnalytics}
                isLoading={isLoadingAnalytics}
              />
            </div>
            <div className="lg:col-span-5 xl:col-span-5">
              <RevenueByPlanChart
                data={revenueByPlan}
              />
            </div>
          </div>

          {/* Unit Economics Snapshot Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-[#E3E7DF] bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
              <span className="text-xs font-semibold text-[#687268] block dark:text-zinc-400">ARPU (Doanh thu TB / Hội viên)</span>
              <div className="text-xl font-bold text-[#172019] mt-1 dark:text-white">119,700 ₫ <span className="text-xs text-emerald-600 font-medium">(+6.4%)</span></div>
              <span className="text-[11px] text-[#687268] mt-1 block dark:text-zinc-400">Dựa trên 4,281 học viên trả phí tháng này</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E3E7DF] bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
              <span className="text-xs font-semibold text-[#687268] block dark:text-zinc-400">LTV (Giá trị trọn đời KH)</span>
              <div className="text-xl font-bold text-[#55733C] mt-1 dark:text-emerald-400">2,060,000 ₫ <span className="text-xs text-emerald-600 font-medium">(~17.2 tháng)</span></div>
              <span className="text-[11px] text-[#687268] mt-1 block dark:text-zinc-400">Tỷ lệ LTV / CAC đạt 5.2x (Chuẩn ngành: &gt;3.0x)</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E3E7DF] bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
              <span className="text-xs font-semibold text-[#687268] block dark:text-zinc-400">Dự báo MRR Quý tới (Q4/2026)</span>
              <div className="text-xl font-bold text-[#172019] mt-1 dark:text-white">560 - 590 tr ₫ <span className="text-xs text-emerald-600 font-medium">(+18.5%)</span></div>
              <span className="text-[11px] text-[#687268] mt-1 block dark:text-zinc-400">Dựa trên mô hình hồi quy tuyến tính tăng trưởng</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: TĂNG TRƯỞNG & PHỄU CHUYỂN ĐỔI */}
      {activeTab === 'growth_funnel' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* 5 Quick KPIs */}
          <SubscriptionSecondaryKPIs
            secondaryKPIs={secondaryKPIs}
            isLoading={isLoadingSecondaryKPIs}
          />

          {/* Funnel & Subscriber Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <SubscriptionFunnelChart
                funnelData={funnel}
              />
            </div>
            <div className="lg:col-span-5">
              <SubscriberDistributionChart
                data={subscriberDistribution}
                totalSubscribers={mainKPIs?.activeSubscribers || 4281}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GIỮ CHÂN & COHORT */}
      {activeTab === 'retention_cohort' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Cohort Retention Table Matrix */}
          <CohortRetentionTable />

          {/* Churn Reasons Survey Card */}
          <ChurnRetentionCard
            churnRate={secondaryKPIs?.churnRate || 5.8}
            retentionRate={94.2}
            reasons={churnReasons}
          />
        </div>
      )}

      {/* Tab 4: KHUYẾN NGHỊ AI & BÁO CÁO */}
      {activeTab === 'ai_reports' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <BusinessInsightsAlerts insights={businessInsights} />

          {/* Scheduled Accounting & Business Reports */}
          <div className="p-5 rounded-2xl border border-[#E3E7DF] bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#172019] dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#7C9B5B]" />
                  <span>Báo cáo Kế toán & Phân tích định kỳ</span>
                </h3>
                <p className="text-xs text-[#687268] dark:text-zinc-400 mt-0.5">
                  Các bản kết xuất số liệu đối soát doanh thu, thuế và phân tích đăng ký hàng tháng
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EEF4E8] text-[#55733C] text-xs font-bold hover:bg-[#7C9B5B] hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất tệp mới</span>
              </button>
            </div>

            <div className="divide-y divide-[#F0F2ED] dark:divide-zinc-800 text-xs">
              {[
                { title: 'Báo cáo Doanh thu & MRR Tháng 08/2026', format: 'Excel .xlsx', size: '2.4 MB', date: '01/09/2026', status: 'Đã khóa sổ' },
                { title: 'Báo cáo Phân tích Phễu & Giữ chân Q2/2026', format: 'PDF Report', size: '5.1 MB', date: '01/07/2026', status: 'Lưu trữ' },
                { title: 'Đối soát Giao dịch Cổng VNPay & MoMo Tháng 08/2026', format: 'CSV Data', size: '1.1 MB', date: '01/09/2026', status: 'Khớp 100%' },
              ].map((rpt, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#F7F8F4] text-[#55733C] dark:bg-zinc-800 font-bold text-[10px]">
                      {rpt.format.split(' ')[0]}
                    </div>
                    <div>
                      <div className="font-bold text-[#172019] dark:text-white">{rpt.title}</div>
                      <div className="text-[11px] text-[#687268] dark:text-zinc-400">
                        {rpt.format} • {rpt.size} • Tạo ngày {rpt.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] dark:bg-emerald-950/60 dark:text-emerald-300">
                      {rpt.status}
                    </span>
                    <button
                      onClick={() => toast.success(`Đang tải xuống tệp: ${rpt.title}`)}
                      className="p-1.5 rounded-lg border border-[#E3E7DF] hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
                      title="Tải tệp"
                    >
                      <Download className="w-4 h-4 text-[#7C9B5B]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      <ExportSubscriptionReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportData}
      />
    </div>
  );
};

export default AdminBusinessAnalyticsPage;
