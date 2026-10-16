import type { ProgressMetricKey } from "../../types";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/Tabs";

export const METRIC_META: Record<ProgressMetricKey, { label: string; unit: string }> = {
  strength: { label: "Sức mạnh", unit: "điểm" },
  endurance: { label: "Sức bền", unit: "điểm" },
  mobility: { label: "Linh hoạt", unit: "điểm" },
  pushUp: { label: "Push Up", unit: "lần" },
  pullUp: { label: "Pull Up", unit: "lần" },
  plank: { label: "Plank", unit: "giây" },
};

export const METRIC_ORDER: ProgressMetricKey[] = ["strength", "endurance", "mobility", "pushUp", "pullUp", "plank"];

export type RangeKey = "7D" | "30D" | "3M" | "6M" | "1Y";

/** Mock data is only 12 weekly points, so ranges are approximated by slicing the tail. */
export const RANGE_META: Record<RangeKey, { label: string; points: number }> = {
  "7D": { label: "7N", points: 1 },
  "30D": { label: "30N", points: 4 },
  "3M": { label: "3T", points: 8 },
  "6M": { label: "6T", points: 12 },
  "1Y": { label: "1N", points: 12 },
};

export const RANGE_ORDER: RangeKey[] = ["7D", "30D", "3M", "6M", "1Y"];

interface MetricSwitcherProps {
  metric: ProgressMetricKey;
  onMetricChange: (metric: ProgressMetricKey) => void;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}

export function MetricSwitcher({ metric, onMetricChange, range, onRangeChange }: MetricSwitcherProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={metric} onValueChange={(value) => onMetricChange(value as ProgressMetricKey)}>
        <TabsList className="flex-wrap">
          {METRIC_ORDER.map((key) => (
            <TabsTrigger key={key} value={key}>
              {METRIC_META[key].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Tabs value={range} onValueChange={(value) => onRangeChange(value as RangeKey)}>
        <TabsList>
          {RANGE_ORDER.map((key) => (
            <TabsTrigger key={key} value={key}>
              {RANGE_META[key].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
