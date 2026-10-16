import { useMemo } from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import { FITNESS_METRIC_LABEL } from "../../constants/labels";
import type { FitnessScorePoint, PerformanceMetric, PerformanceRange } from "../../types";
import { ProgressLineChart, type LineSeries } from "../charts/ProgressLineChart";
import { EmptyState, Panel, Toggle } from "../ui";
import { FITNESS_KEYS, RANGE_LABEL, toChartRows } from "./performanceUtils";

interface MetricTrendPanelProps {
  series: FitnessScorePoint[];
  metric: PerformanceMetric;
  range: PerformanceRange;
  compareAll: boolean;
  onCompareAllChange: (v: boolean) => void;
  cohort: boolean;
}

/** Selected metric as an area over time, or the five fitness metrics as lines for comparison. */
export function MetricTrendPanel({ series, metric, range, compareAll, onCompareAllChange, cohort }: MetricTrendPanelProps) {
  const rows = useMemo(() => toChartRows(series), [series]);
  const lines: LineSeries<PerformanceMetric>[] = compareAll
    ? FITNESS_KEYS.map((k) => ({ key: k, label: FITNESS_METRIC_LABEL[k] }))
    : [{ key: metric, label: FITNESS_METRIC_LABEL[metric] }];
  const title = compareAll ? "So sánh 5 chỉ số thể lực" : `${FITNESS_METRIC_LABEL[metric]} theo thời gian`;

  return (
    <Panel
      title={title}
      description={`${cohort ? "Trung bình nhóm học viên" : "Điểm theo tuần"} · ${RANGE_LABEL[range]} gần nhất`}
      icon={LineChartIcon}
      className="animate-rise"
      actions={
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-text-secondary">
          <span className="hidden sm:inline">So sánh tất cả</span>
          <Toggle checked={compareAll} onChange={onCompareAllChange} label="So sánh tất cả 5 chỉ số" />
        </label>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu trong khoảng thời gian này" description="Chọn khoảng thời gian dài hơn hoặc học viên khác." />
      ) : (
        <div role="img" aria-label={`${title}, ${rows.length} điểm dữ liệu`}>
          <ProgressLineChart data={rows} series={lines} area={!compareAll} height={300} />
        </div>
      )}
    </Panel>
  );
}
