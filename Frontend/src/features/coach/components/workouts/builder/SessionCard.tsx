import { forwardRef, type HTMLAttributes } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Clock, Dumbbell, GripVertical } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { StatusBadge } from "../../ui";
import { PATTERN_LABEL } from "../../../constants/labels";
import type { PlanSession } from "../../../types";
import { FOCUS_TONE } from "../workoutUi";

interface SessionCardFaceProps extends HTMLAttributes<HTMLDivElement> {
  session: PlanSession;
  selected?: boolean;
  lifted?: boolean;
  /** Drag handle element (rendered on the left of the title). */
  handle?: React.ReactNode;
  onSelect?: () => void;
}

/** Visual session summary; used both in the day column and inside the DragOverlay. */
export const SessionCardFace = forwardRef<HTMLDivElement, SessionCardFaceProps>(
  ({ session, selected, lifted, handle, onSelect, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "panel-3d relative flex flex-col gap-2 p-3 transition-[box-shadow,transform,border-color]",
        selected && "border-accent ring-2 ring-accent/30",
        lifted && "rotate-1 scale-[1.02] shadow-[0_22px_40px_-12px_hsl(214_45%_20%/0.45)] ring-2 ring-accent/40",
        className
      )}
      {...rest}
    >
      <div className="flex items-start gap-1.5">
        {handle}
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="line-clamp-2 text-[13px] font-extrabold leading-snug text-text-primary">{session.title || "Chưa đặt tên"}</span>
        </button>
      </div>
      <StatusBadge tone={FOCUS_TONE[session.focus]} className="self-start">{PATTERN_LABEL[session.focus]}</StatusBadge>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-text-secondary">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Clock size={12} aria-hidden />
          {session.durationMinutes} phút
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Dumbbell size={12} aria-hidden />
          {session.exercises.length} bài
        </span>
      </div>
    </div>
  )
);
SessionCardFace.displayName = "SessionCardFace";

interface DraggableSessionCardProps {
  dayId: string;
  dayLabel: string;
  session: PlanSession;
  selected: boolean;
  onSelect: () => void;
}

/** Session card that can be dragged to another day through its grip handle (pointer or keyboard). */
export function DraggableSessionCard({ dayId, dayLabel, session, selected, onSelect }: DraggableSessionCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: dayId });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Kéo buổi "${session.title}" (${dayLabel}) sang ngày khác`}
      className="-ml-1 mt-px grid h-6 w-5 shrink-0 cursor-grab touch-none place-items-center rounded-md text-text-secondary hover:bg-surface-sunken hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
    >
      <GripVertical size={14} aria-hidden />
    </button>
  );
  return (
    <SessionCardFace
      ref={setNodeRef}
      session={session}
      selected={selected}
      handle={handle}
      onSelect={onSelect}
      className={cn(isDragging && "opacity-40")}
    />
  );
}
