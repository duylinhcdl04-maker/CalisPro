import type { ReactNode } from "react";
import { AlertTriangle, FilterX } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Button3D, SearchInput, SelectField, Toggle } from "../../ui";
import type { StudentListParams } from "../../../types";
import {
  FREQUENCY_OPTIONS,
  GOAL_OPTIONS,
  LAST_ACTIVE_OPTIONS,
  LEVEL_OPTIONS,
  PERFORMANCE_OPTIONS,
  STATUS_OPTIONS,
  type Option,
} from "./filterOptions";
import type { FilterKey } from "./useStudentListState";

interface FilterSelectProps<T extends string> {
  label: string;
  allLabel: string;
  value: T | undefined;
  options: Option<T>[];
  onChange: (v: T | undefined) => void;
}

function FilterSelect<T extends string>({ label, allLabel, value, options, onChange }: FilterSelectProps<T>) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-bold text-text-secondary">{label}</span>
      <SelectField
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value || undefined) as T | undefined)}
        className={cn(value && "[&_select]:border-accent/50 [&_select]:text-accent-strong dark:[&_select]:text-accent")}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>
    </label>
  );
}

interface StudentFilterBarProps {
  params: StudentListParams;
  searchInput: string;
  onSearchChange: (v: string) => void;
  onFilterChange: (key: FilterKey, value: string | boolean | undefined) => void;
  onClear: () => void;
  activeCount: number;
  trailing?: ReactNode;
}

export function StudentFilterBar({ params, searchInput, onSearchChange, onFilterChange, onClear, activeCount, trailing }: StudentFilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={onSearchChange}
          label="Tìm học viên"
          placeholder="Tìm theo tên, email hoặc mã học viên"
          className="min-w-0 flex-1"
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="well-3d flex h-10 items-center gap-2.5 rounded-[14px] px-3">
            <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" aria-hidden />
            <span className="text-xs font-bold text-text-primary">
              Cần chú ý
            </span>
            <Toggle checked={!!params.needsAttention} onChange={(v) => onFilterChange("needsAttention", v)} label="Chỉ hiện học viên cần chú ý" />
          </div>
          {trailing}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <FilterSelect label="Cấp độ" allLabel="Tất cả cấp độ" value={params.level} options={LEVEL_OPTIONS} onChange={(v) => onFilterChange("level", v)} />
        <FilterSelect label="Mục tiêu" allLabel="Tất cả mục tiêu" value={params.goal} options={GOAL_OPTIONS} onChange={(v) => onFilterChange("goal", v)} />
        <FilterSelect label="Trạng thái" allLabel="Tất cả trạng thái" value={params.status} options={STATUS_OPTIONS} onChange={(v) => onFilterChange("status", v)} />
        <FilterSelect label="Tần suất tập" allLabel="Mọi tần suất" value={params.frequency} options={FREQUENCY_OPTIONS} onChange={(v) => onFilterChange("frequency", v)} />
        <FilterSelect label="Hiệu suất" allLabel="Mọi xu hướng" value={params.performance} options={PERFORMANCE_OPTIONS} onChange={(v) => onFilterChange("performance", v)} />
        <FilterSelect label="Hoạt động gần nhất" allLabel="Bất kỳ lúc nào" value={params.lastActive} options={LAST_ACTIVE_OPTIONS} onChange={(v) => onFilterChange("lastActive", v)} />
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
          <span>
            Đang áp dụng <strong className="tabular-nums text-text-primary">{activeCount}</strong> bộ lọc
          </span>
          <Button3D size="sm" variant="ghost" leftIcon={<FilterX size={14} aria-hidden />} onClick={onClear}>
            Xoá bộ lọc
          </Button3D>
        </div>
      )}
    </div>
  );
}
