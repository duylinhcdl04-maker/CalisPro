import { format, isToday, setHours, startOfHour } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "../../../../lib/utils";
import type { CalendarEvent } from "../../types";
import { EVENT_TYPE } from "../../constants/labels";
import { formatTime } from "../../lib/format";
import { HOUR_END, HOUR_HEIGHT, HOUR_START, eventChipClass, eventsOnDay, layoutDayEvents } from "./calendarUtils";

const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
  onCreate: (slot: Date) => void;
}

/** Hour-row timeline (07:00 to 21:00) with absolutely positioned events. Used by Week (7 days) and Day (1 day). */
export function TimeGrid({ days, events, onSelectEvent, onCreate }: TimeGridProps) {
  const multi = days.length > 1;
  const cols = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };
  return (
    <div className={cn("overflow-x-auto scrollbar-thin", multi && "-mx-1 px-1")}>
      <div className={cn("overflow-hidden rounded-[18px] border border-border/70", multi && "min-w-[680px]")}>
        {multi && (
          <div className="grid border-b border-border/70 bg-surface-sunken" style={cols}>
            <span />
            {days.map((d) => (
              <div key={d.toISOString()} className="border-l border-border/60 py-2 text-center">
                <span className="block text-[10px] font-bold uppercase text-text-secondary">{format(d, "EEEEEE", { locale: vi })}</span>
                <span className={cn("mx-auto mt-0.5 grid h-7 w-7 place-items-center rounded-full text-sm font-extrabold tabular-nums", isToday(d) ? "bg-accent text-white" : "text-text-primary")}>
                  {format(d, "d")}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="grid bg-surface" style={cols}>
          <div aria-hidden>
            {HOURS.map((h) => (
              <div key={h} className="relative pr-2 text-right text-[10px] font-bold tabular-nums text-text-secondary" style={{ height: HOUR_HEIGHT }}>
                <span className="relative -top-1.5">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>
          {days.map((day) => {
            const positioned = layoutDayEvents(eventsOnDay(events, day));
            const dayLabel = format(day, "EEEE dd/MM", { locale: vi });
            return (
              <div key={day.toISOString()} className={cn("relative border-l border-border/60", isToday(day) && "bg-accent-soft/20")}>
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onCreate(startOfHour(setHours(day, h)))}
                    aria-label={`Tạo lịch ${String(h).padStart(2, "0")}:00 ${dayLabel}`}
                    className="block w-full border-b border-border/50 hover:bg-accent-soft/30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {positioned.map(({ event: ev, top, height, lane, lanes }) => {
                  const cancelled = ev.status === "CANCELLED";
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      aria-label={`${ev.title}, ${formatTime(ev.start)} đến ${formatTime(ev.end)}, ${EVENT_TYPE[ev.type].label}${cancelled ? ", đã huỷ" : ""}`}
                      className={cn(
                        "absolute overflow-hidden rounded-[10px] bg-surface text-left shadow-sm transition-transform hover:z-10 hover:-translate-y-px focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent",
                        cancelled && "opacity-50"
                      )}
                      style={{ top: top + 1, height: height - 2, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
                    >
                      <span className={cn("flex h-full flex-col rounded-[10px] border px-1.5 py-1", eventChipClass(ev.type))}>
                        <span className={cn("block truncate text-[11px] font-extrabold", cancelled && "line-through")}>{ev.title}</span>
                        {height > 34 && (
                          <span className="block truncate text-[10px] font-semibold tabular-nums opacity-80">
                            {formatTime(ev.start)} - {formatTime(ev.end)}
                            {!multi && ev.studentName ? `, ${ev.studentName}` : ""}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
