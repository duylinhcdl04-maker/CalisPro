import React from "react";
import { Search, RotateCcw, X, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { SubscriptionFilterState } from "../types/subscription.types";

interface SubscriberFiltersProps {
  filters: SubscriptionFilterState;
  onFilterChange: <K extends keyof SubscriptionFilterState>(
    key: K,
    value: SubscriptionFilterState[K]
  ) => void;
  onResetFilters: () => void;
  totalResults: number;
}

export const SubscriberFilters: React.FC<SubscriberFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.plan !== "all" ||
    filters.billingCycle !== "all" ||
    filters.status !== "all" ||
    filters.autoRenewalOnly ||
    filters.atRiskOnly;

  return (
    <div className="space-y-3 rounded-2xl border border-[#E3E7DF] bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#687268] dark:text-zinc-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
            placeholder="Tìm theo tên học viên, email hoặc mã gói..."
            className="h-10 w-full rounded-xl border border-[#E3E7DF] bg-[#F7F8F4] pr-4 pl-10 text-sm text-[#172019] placeholder-[#687268] transition-colors focus:border-[#7C9B5B] focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange("searchQuery", "")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Plan Filter */}
          <select
            value={filters.plan}
            onChange={(e) => onFilterChange("plan", e.target.value)}
            className="h-10 rounded-xl border border-[#E3E7DF] bg-white px-3 text-xs font-medium text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">Tất cả gói</option>
            <option value="CALIS_TRIAL">Calis Free Trial</option>
            <option value="CALIS_PRO">Calis Pro</option>
            <option value="CALIS_PREMIUM">Calis Premium</option>
            <option value="CALIS_ANNUAL">Calis Premium Annual</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="h-10 rounded-xl border border-[#E3E7DF] bg-white px-3 text-xs font-medium text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="TRIAL">Đang dùng thử</option>
            <option value="PAST_DUE">Quá hạn thanh toán</option>
            <option value="GRACE_PERIOD">Gia hạn tạm thời</option>
            <option value="CANCELLED">Đã hủy tự gia hạn</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </select>

          {/* Risk Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange("atRiskOnly", !filters.atRiskOnly)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors ${
              filters.atRiskOnly
                ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                : "border-[#E3E7DF] bg-white text-[#172019] hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${filters.atRiskOnly ? "text-rose-500" : "text-zinc-400"}`} />
            Sắp hết hạn / Quá hạn
          </button>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-[#E3E7DF] bg-transparent px-3 text-xs font-medium text-[#687268] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0F2ED] pt-2 text-xs text-[#687268] dark:border-zinc-800 dark:text-zinc-400">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#7C9B5B]" />
            Bộ lọc:
          </span>

          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF4E8] px-2 py-0.5 text-xs text-[#55733C]">
              &quot;{filters.searchQuery}&quot;
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onFilterChange("searchQuery", "")} />
            </span>
          )}

          {filters.plan !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF4E8] px-2 py-0.5 text-xs text-[#55733C]">
              Gói: {filters.plan}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onFilterChange("plan", "all")} />
            </span>
          )}

          {filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF4E8] px-2 py-0.5 text-xs text-[#55733C]">
              Trạng thái: {filters.status}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onFilterChange("status", "all")} />
            </span>
          )}

          {!hasActiveFilters && <span className="italic text-zinc-400">Hiển thị toàn bộ hội viên</span>}
        </div>

        <div className="font-medium text-[#172019] dark:text-zinc-300">
          Tổng số: <span className="font-bold text-[#55733C]">{totalResults}</span> hội viên
        </div>
      </div>
    </div>
  );
};
