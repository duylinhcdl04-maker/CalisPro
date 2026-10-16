import React from "react";
import { Search, RotateCcw, Download, X, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { PerformanceFilterState } from "../types/performance.types";

interface PerformanceFiltersProps {
  filters: PerformanceFilterState;
  onFilterChange: <K extends keyof PerformanceFilterState>(
    key: K,
    value: PerformanceFilterState[K]
  ) => void;
  onResetFilters: () => void;
  onExportClick?: () => void;
  totalResults: number;
}

export const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onExportClick,
  totalResults,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.fitnessLevel !== "all" ||
    filters.status !== "all" ||
    filters.exercise !== "all" ||
    filters.timeframe !== "8w" ||
    filters.riskOnly;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
            placeholder="Tìm kiếm theo tên học viên, mã HV hoặc HLV phụ trách..."
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cấp độ */}
          <select
            value={filters.fitnessLevel}
            onChange={(e) => onFilterChange("fitnessLevel", e.target.value)}
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
            <option value="Active">Đang hoạt động</option>
            <option value="Improving">Tiến bộ nhanh</option>
            <option value="Stable">Duy trì ổn định</option>
            <option value="At Risk">Nguy cơ giảm sút</option>
            <option value="Inactive">Không tập luyện</option>
          </select>

          {/* Bài tập */}
          <select
            value={filters.exercise}
            onChange={(e) => onFilterChange("exercise", e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tất cả bài tập</option>
            <option value="Pull Up">Pull Up</option>
            <option value="Push Up">Push Up</option>
            <option value="Dips">Dips</option>
            <option value="Plank">Plank</option>
            <option value="Muscle Up">Muscle Up</option>
          </select>

          {/* Risk Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange("riskOnly", !filters.riskOnly)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
              filters.riskOnly
                ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${filters.riskOnly ? "text-rose-500" : "text-slate-400"}`} />
            Có dấu hiệu giảm sút
          </button>

          {/* Date range display */}
          <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span>{filters.dateRange}</span>
          </div>

          {/* Reset */}
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

      {/* Active Filter Chips & Total */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
            Bộ lọc:
          </span>

          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#8CA9FF]/15 px-2 py-0.5 text-xs font-semibold text-[#1e3a8a] dark:text-[#8CA9FF]">
              &quot;{filters.searchQuery}&quot;
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onFilterChange("searchQuery", "")} />
            </span>
          )}

          {filters.fitnessLevel !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#8CA9FF]/15 px-2 py-0.5 text-xs font-semibold text-[#1e3a8a] dark:text-[#8CA9FF]">
              Cấp độ: {filters.fitnessLevel}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onFilterChange("fitnessLevel", "all")} />
            </span>
          )}

          {filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#8CA9FF]/15 px-2 py-0.5 text-xs font-semibold text-[#1e3a8a] dark:text-[#8CA9FF]">
              Trạng thái: {filters.status}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onFilterChange("status", "all")} />
            </span>
          )}

          {filters.riskOnly && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              Cần can thiệp
              <X className="h-3 w-3 cursor-pointer hover:text-rose-900" onClick={() => onFilterChange("riskOnly", false)} />
            </span>
          )}

          {!hasActiveFilters && <span className="italic text-slate-400">Hiển thị toàn bộ dữ liệu</span>}
        </div>

        <div className="font-medium text-slate-700 dark:text-slate-300">
          Tổng số: <span className="font-bold text-[#547EFF] dark:text-[#8CA9FF]">{totalResults}</span> học viên
        </div>
      </div>
    </div>
  );
};
