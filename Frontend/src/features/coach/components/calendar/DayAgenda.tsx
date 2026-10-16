import { CalendarPlus, CalendarX2, MapPin } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { CalendarEvent } from "../../types";
import { EVENT_STATUS, EVENT_TYPE } from "../../constants/labels";
import { formatTime } from "../../lib/format";
import { Button3D, EmptyState, StatusBadge } from "../ui";
import { eventDotClass } from "./calendarUtils";

interface DayAgendaProps {
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
  onCreate: () => void;
  className?: string;
}

/** Chronological list of one day's events: the side list in Day view and the primary view on mobile. */
export function DayAgenda({ events, onSelectEvent, onCreate, className }: DayAgendaProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        className={className}
        icon={CalendarX2}
        title="Không có lịch trong ngày"
        description="Tạo lịch đánh giá, review hoặc buổi huấn luyện mới."
        action={
          <Button3D size="sm" variant="primary" onClick={onCreate} leftIcon={<CalendarPlus size={14} />}>
            Tạo lịch
          </Button3D>
        }
      />
    );
  }
  return (
    <ul className={cn("space-y-2", className)}>
      {events.map((ev, i) => {
        const cancelled = ev.status === "CANCELLED";
        return (
          <li key={ev.id} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
            <button
              type="button"
              onClick={() => onSelectEvent(ev)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[14px] border border-border/70 bg-surface p-3 text-left transition-colors hover:border-accent/30 hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent",
                cancelled && "opacity-60"
              )}
            >
              <span className="w-12 shrink-0 pt-0.5 text-right tabular-nums">
                <span className="block text-sm font-extrabold text-text-primary">{formatTime(ev.start)}</span>
                <span className="block text-[11px] text-text-secondary">{formatTime(ev.end)}</span>
              </span>
              <span className={cn("mt-1 w-1 self-stretch rounded-full", eventDotClass(ev.type))} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm font-bold text-text-primary", cancelled && "line-through")}>{ev.title}</span>
                <span className="mt-0.5 block truncate text-xs text-text-secondary">
                  {EVENT_TYPE[ev.type].label}
                  {ev.studentName ? `, ${ev.studentName}` : ""}
                </span>
                {ev.location && (
                  <span className="mt-1 flex items-center gap-1 truncate text-[11px] text-text-secondary">
                    <MapPin size={12} aria-hidden />
                    {ev.location}
                  </span>
                )}
              </span>
              <StatusBadge status={EVENT_STATUS[ev.status]} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
