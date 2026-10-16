import { CopyPlus, Layers3 } from "lucide-react";
import { Button3D, Segmented, type SegmentOption } from "../../ui";
import type { PlanWeek } from "../../../types";
import { weekStats } from "./planModel";

interface WeekToolbarProps {
  weeks: PlanWeek[];
  weekIndex: number;
  onSelect: (index: number) => void;
  onCopyToNext: () => void;
  onApplyToAll: () => void;
}

/** Week selector (tabs with session counts) plus week-level copy actions. */
export function WeekToolbar({ weeks, weekIndex, onSelect, onCopyToNext, onApplyToAll }: WeekToolbarProps) {
  const options: SegmentOption<string>[] = weeks.map((w, i) => ({ value: String(i), label: `Tuần ${w.weekNumber}`, count: weekStats(w).trainingDays }));
  const isLast = weekIndex >= weeks.length - 1;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Segmented ariaLabel="Chọn tuần" options={options} value={String(weekIndex)} onChange={(v) => onSelect(Number(v))} size="sm" className="self-start" />
      <div className="flex flex-wrap items-center gap-2">
        <Button3D size="sm" leftIcon={<CopyPlus size={14} />} onClick={onCopyToNext} disabled={isLast} title={isLast ? "Đây là tuần cuối của giáo án" : undefined}>
          Nhân bản tuần này sang tuần sau
        </Button3D>
        <Button3D size="sm" leftIcon={<Layers3 size={14} />} onClick={onApplyToAll} disabled={weeks.length < 2}>
          Áp dụng cho mọi tuần
        </Button3D>
      </div>
    </div>
  );
}
