import { useDroppable } from "@dnd-kit/core";
import { Moon, Plus } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Button3D } from "../../ui";
import { WEEKDAY_LABEL } from "../../../constants/labels";
import type { PlanDay } from "../../../types";
import { DraggableSessionCard } from "./SessionCard";

interface DayColumnProps {
  day: PlanDay;
  selected: boolean;
  onSelect: () => void;
  onAddSession: () => void;
}

/** One weekday: a drop target that holds either a session card or the rest state. */
export function DayColumn({ day, selected, onSelect, onAddSession }: DayColumnProps) {
  const { setNodeRef, isOver, active } = useDroppable({ id: day.id });
  const label = WEEKDAY_LABEL[day.dayOfWeek];
  const isSource = active?.id === day.id;
  const highlight = isOver && !isSource;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[132px] flex-col gap-2 rounded-2xl border-2 border-dashed p-2 transition-colors md:min-h-[196px]",
        highlight ? "border-accent bg-accent-soft/60" : active ? "border-border bg-surface-sunken/40" : "border-transparent bg-surface-sunken/60",
        selected && !active && "border-accent/50"
      )}
    >
      <div className="flex items-baseline justify-between px-1">
        <span className="text-xs font-black text-text-primary">{label.short}</span>
        <span className="text-[11px] font-semibold text-text-secondary">{label.long}</span>
      </div>

      {day.session ? (
        <DraggableSessionCard dayId={day.id} dayLabel={label.long} session={day.session} selected={selected} onSelect={onSelect} />
      ) : (
        <div className={cn("flex flex-1 flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center", selected && "ring-2 ring-accent/30")}>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-text-secondary">
            <Moon size={12} aria-hidden />
            Nghỉ
          </span>
          <Button3D size="sm" variant="ghost" leftIcon={<Plus size={13} />} onClick={onAddSession} aria-label={`Thêm buổi tập vào ${label.long}`}>
            Thêm buổi tập
          </Button3D>
        </div>
      )}
    </div>
  );
}
