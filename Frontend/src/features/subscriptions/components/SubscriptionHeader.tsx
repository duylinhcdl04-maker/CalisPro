import React from "react";
import { Link } from "react-router-dom";
import { Plus, Download, RotateCcw, ArrowLeft, Sparkles, CreditCard } from "lucide-react";

interface SubscriptionHeaderProps {
  onCreatePlanClick: () => void;
  onExportClick: () => void;
  onResetData: () => void;
}

export const SubscriptionHeader: React.FC<SubscriptionHeaderProps> = ({
  onCreatePlanClick,
  onExportClick,
  onResetData,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#172019] dark:text-white">
              Quản lý Gói Hội viên & Doanh thu
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4E8] px-3 py-1 text-xs font-semibold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              <CreditCard className="h-3.5 w-3.5 text-[#7C9B5B]" />
              Subscription Management
            </span>
          </div>
          <p className="mt-1 text-sm text-[#687268] dark:text-zinc-400">
            Quản lý gói dịch vụ, hội viên, thanh toán, gia hạn và hiệu quả doanh thu của CalisHealth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onResetData}
            title="Khôi phục dữ liệu mẫu"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-medium text-[#687268] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Khôi phục mẫu</span>
          </button>

          <button
            onClick={onExportClick}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium text-[#172019] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Download className="h-3.5 w-3.5 text-[#7C9B5B]" />
            <span>Xuất báo cáo</span>
          </button>

          <button
            onClick={onCreatePlanClick}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#55733C] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tạo gói mới</span>
          </button>

          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-medium text-[#687268] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#7C9B5B]" />
            <span>Về Dashboard</span>
          </Link>
        </div>
      </div>
      <div className="h-[1px] w-full bg-[#E3E7DF] dark:bg-zinc-800" />
    </div>
  );
};
