import { format, isSameMonth, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "../../../../lib/utils";
import type { CalendarEvent } from "../../types";
import { EVENT_TYPE } from "../../constants/labels";
import { formatTime } from "../../lib/format";
import { daysBetween, eventChipClass, eventsOnDay } from "./calendarUtils";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MAX_VISIBLE = 2;

interface MonthViewProps {
  start: Date;
  cursor: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
  onCreate: (day: Date) => void;
  onShowDay: (day: Date) => void;
}

export function MonthView({ start, cursor, events, onSelectEvent, onCreate, onShowDay }: MonthViewProps) {
  const days = daysBetween(start, 42);
  return (
    <div aria-label={`Lịch tháng ${format(cursor, "M/yyyy")}`} role="region" className="overflow-hidden rounded-[18px] border border-border/70">
      <div className="grid grid-cols-7 border-b border-border/70 bg-surface-sunken">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-extrabold uppercase tracking-wide text-text-secondary">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const dayEvents = eventsOnDay(events, day);
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          const hidden = dayEvents.length - MAX_VISIBLE;
          const label = format(day, "EEEE dd/MM", { locale: vi });
          return (
            <div
              key={day.toISOString()}
             
              className={cn(
                "group relative min-h-[76px] border-border/60 p-1 sm:min-h-[108px] sm:p-1.5",
                i % 7 !== 6 && "border-r",
                i < 35 && "border-b",
                inMonth ? "bg-surface" : "bg-surface-sunken/60"
              )}
            >
              <button
                type="button"
                onClick={() => onCreate(day)}
                aria-label={`Tạo lịch vào ${label}`}
                className="absolute inset-0 rounded-none hover:bg-accent-soft/30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              />
              <div className="relative flex justify-end">
                <span
                  className={cn(
                    "pointer-events-none grid h-6 min-w-6 place-items-center rounded-full px-1 text-[11px] font-extrabold tabular-nums",
                    today ? "bg-accent text-white" : inMonth ? "text-text-primary" : "text-text-secondary/60"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="relative mt-0.5 space-y-1">
                {dayEvents.slice(0, MAX_VISIBLE).map((ev) => {
                  const cancelled = ev.status === "CANCELLED";
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      aria-label={`${ev.title}, ${formatTime(ev.start)}, ${EVENT_TYPE[ev.type].label}${cancelled ? ", đã huỷ" : ""}`}
                      className={cn(
                        "flex w-full items-center gap-1 truncate rounded-md border px-1 py-0.5 text-left text-[10px] font-bold focus-visible:outline-2 focus-visible:outline-accent sm:px-1.5 sm:text-[11px]",
                        eventChipClass(ev.type),
                        cancelled && "line-through opacity-50"
                      )}
                    >
                      <span className="hidden tabular-nums sm:inline">{formatTime(ev.start)}</span>
                      <span className="truncate">{ev.title}</span>
                    </button>
                  );
                })}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => onShowDay(day)}
                    aria-label={`Xem thêm ${hidden} lịch ngày ${label}`}
                    className="w-full rounded-md px-1 text-left text-[10px] font-extrabold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent dark:text-accent sm:text-[11px]"
                  >
                    +{hidden}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
