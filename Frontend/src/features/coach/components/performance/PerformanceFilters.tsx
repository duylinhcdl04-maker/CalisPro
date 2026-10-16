import { Loader2 } from "lucide-react";
import { useStudentOptions } from "../../hooks";
import type { PerformanceMetric, PerformanceRange } from "../../types";
import { Panel, Segmented, SelectField } from "../ui";
import { METRIC_OPTIONS, RANGE_OPTIONS } from "./performanceUtils";

interface PerformanceFiltersProps {
  studentId: string;
  range: PerformanceRange;
  metric: PerformanceMetric;
  fetching: boolean;
  onStudentChange: (id: string) => void;
  onRangeChange: (r: PerformanceRange) => void;
  onMetricChange: (m: PerformanceMetric) => void;
}

export function PerformanceFilters({ studentId, range, metric, fetching, onStudentChange, onRangeChange, onMetricChange }: PerformanceFiltersProps) {
  const students = useStudentOptions();
  return (
    <Panel className="mb-6 animate-rise" bodyClassName="p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="flex flex-col gap-1.5 xl:w-64">
          <label htmlFor="perf-student" className="text-xs font-bold text-text-secondary">
            Học viên
          </label>
          <SelectField id="perf-student" value={studentId} onChange={(e) => onStudentChange(e.target.value)} disabled={students.isLoading}>
            <option value="ALL">Tất cả học viên</option>
            {students.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">
            Khoảng thời gian
          </span>
          <Segmented options={RANGE_OPTIONS} value={range} onChange={onRangeChange} ariaLabel="Khoảng thời gian" />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">Chỉ số</span>
          <Segmented options={METRIC_OPTIONS} value={metric} onChange={onMetricChange} ariaLabel="Chỉ số thể lực" />
        </div>
        <div className="flex h-10 items-center xl:ml-auto" aria-live="polite">
          {fetching && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              Đang cập nhật
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}
