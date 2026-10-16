import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { PersonalRecord } from "../../types";
import { Card } from "../../components/ui/Card";
import { cn } from "../../lib/utils";

const TREND_STYLES: Record<PersonalRecord["trend"], { icon: typeof TrendingUp; className: string }> = {
  up: { icon: TrendingUp, className: "text-success" },
  down: { icon: TrendingDown, className: "text-danger" },
  flat: { icon: Minus, className: "text-text-secondary" },
};

export function PersonalRecordCard({ record }: { record: PersonalRecord }) {
  const trend = TREND_STYLES[record.trend];
  const Icon = trend.icon;

  return (
    <Card>
      <div className="text-xs text-text-secondary">{record.exercise}</div>
      <div className="mt-2 text-xl font-bold text-text-primary">
        {record.value}
        {record.unit ? <span className="ml-1 text-sm font-medium text-text-secondary">{record.unit}</span> : null}
      </div>
      <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trend.className)}>
        <Icon size={14} aria-hidden="true" />
        <span>{record.changeLabel}</span>
      </div>
    </Card>
  );
}
