import React from "react";
import { Search, RotateCcw, Download, X, SlidersHorizontal } from "lucide-react";
import { FitnessProfilesFilterState } from "../types/fitnessProfile";

interface FitnessProfilesFilterToolbarProps {
  filters: FitnessProfilesFilterState;
  onFilterChange: <K extends keyof FitnessProfilesFilterState>(
    key: K,
    value: FitnessProfilesFilterState[K]
  ) => void;
  onResetFilters: () => void;
  onExportClick?: () => void;
  totalResults: number;
}

export const FitnessProfilesFilterToolbar: React.FC<FitnessProfilesFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onExportClick,
  totalResults,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.level !== "all" ||
    filters.status !== "all" ||
    filters.goal !== "all" ||
    filters.overdueOnly ||
    filters.dimensionFilter !== "all";

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
            placeholder="Tìm kiếm theo tên, mã học viên, email, số điện thoại hoặc HLV..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#8CA9FF] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder-slate-500 dark:focus:border-[#8CA9FF] dark:focus:bg-slate-800"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange("searchQuery", "")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right: Dropdown Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cấp độ */}
          <select
            value={filters.level}
            onChange={(e) => onFilterChange("level", e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tất cả cấp độ</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Elite">Elite</option>
          </select>

          {/* Trạng thái */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Healthy">Ổn định / Khỏe mạnh</option>
            <option value="Needs Attention">Cần chú ý</option>
            <option value="Reassessment Due">Đến hạn đánh giá</option>
            <option value="Injured">Chấn thương / Phục hồi</option>
            <option value="Inactive">Tạm ngưng</option>
          </select>

          {/* Đánh giá / Quá hạn */}
          <button
            type="button"
            onClick={() => onFilterChange("overdueOnly", !filters.overdueOnly)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
              filters.overdueOnly
                ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                filters.overdueOnly ? "bg-rose-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            Quá hạn đánh giá
          </button>

          {/* Khoảng thời gian */}
          <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span>01/09/2026 – 28/09/2026</span>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-transparent px-3 text-xs font-medium text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-red-950/30"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại
            </button>
          )}

          {/* Export */}
          {onExportClick && (
            <button
              onClick={onExportClick}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-3.5 text-xs font-semibold text-white shadow-md shadow-[#8CA9FF]/30 transition-all hover:from-[#7B9CFF] hover:to-[#436FEF] active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" />
              Xuất báo cáo
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges & Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
            Bộ lọc hoạt động:
          </span>

          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#8CA9FF]/15 px-2 py-0.5 text-xs font-semibold text-[#1e3a8a] dark:text-[#8CA9FF]">
              Từ khóa: &quot;{filters.searchQuery}&quot;
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => onFilterChange("searchQuery", "")}
              />
            </span>
          )}

          {filters.level !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#8CA9FF]/15 px-2 py-0.5 text-xs font-semibold text-[#1e3a8a] dark:text-[#8CA9FF]">
              Cấp độ: {filters.level}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => onFilterChange("level", "all")}
              />
            </span>
          )}

          {filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#8CA9FF]/15 px-2 py-0.5 text-xs font-semibold text-[#1e3a8a] dark:text-[#8CA9FF]">
              Trạng thái: {filters.status}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => onFilterChange("status", "all")}
              />
            </span>
          )}

          {filters.overdueOnly && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              Đến hạn đánh giá
              <X
                className="h-3 w-3 cursor-pointer hover:text-rose-900"
                onClick={() => onFilterChange("overdueOnly", false)}
              />
            </span>
          )}

          {!hasActiveFilters && (
            <span className="italic text-slate-400">Hiển thị toàn bộ học viên</span>
          )}
        </div>

        <div className="font-medium text-slate-700 dark:text-slate-300">
          Hiển thị: <span className="font-bold text-[#547EFF] dark:text-[#8CA9FF]">{totalResults}</span> hồ sơ
        </div>
      </div>
    </div>
  );
};
