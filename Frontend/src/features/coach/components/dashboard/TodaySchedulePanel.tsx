import { Link } from "react-router-dom";
import { CalendarClock, CalendarPlus, MapPin } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { Button3D, EmptyState, Panel, StatusBadge } from "../ui";
import { EVENT_STATUS, EVENT_TYPE } from "../../constants/labels";
import { formatTime } from "../../lib/format";
import type { CalendarEvent } from "../../types";

function EventItem({ event, last }: { event: CalendarEvent; last: boolean }) {
  const live = event.status === "IN_PROGRESS";
  const done = event.status === "COMPLETED" || event.status === "CANCELLED";
  return (
    <li className="relative flex gap-3">
      <div className="w-12 shrink-0 pt-2.5 text-right">
        <time dateTime={event.start} className={cn("text-sm font-black tabular-nums", done ? "text-text-secondary" : "text-text-primary")}>
          {formatTime(event.start)}
        </time>
        <div className="text-[10px] tabular-nums text-text-secondary">{formatTime(event.end)}</div>
      </div>
      <div className="relative flex flex-col items-center" aria-hidden>
        <span className={cn("mt-3.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-surface", live ? "bg-accent" : done ? "bg-text-secondary/40" : "bg-blue-500")}>
          {live && <span className="block h-3 w-3 animate-ping rounded-full bg-accent/70 motion-reduce:animate-none" />}
        </span>
        {!last && <span className="w-px flex-1 bg-border" />}
      </div>
      <div
        className={cn(
          "mb-3 min-w-0 flex-1 rounded-[16px] border p-3",
          live ? "border-accent/40 bg-accent-soft/60 shadow-[0_3px_0_0_hsl(var(--accent)/0.25)]" : "border-border/70 bg-surface-elevated/60",
          event.status === "CANCELLED" && "opacity-70"
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={EVENT_TYPE[event.type]} />
          <StatusBadge status={EVENT_STATUS[event.status]} />
        </div>
        <p className={cn("mt-1.5 text-sm font-bold text-text-primary", event.status === "CANCELLED" && "line-through")}>{event.title}</p>
        {event.studentId && event.studentName && (
          <Link
            to={`/coach/students/${event.studentId}`}
            className="mt-0.5 inline-block rounded text-xs font-semibold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent dark:text-accent"
          >
            {event.studentName}
          </Link>
        )}
        {event.location && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-text-secondary">
            <MapPin size={11} aria-hidden />
            <span className="truncate">{event.location}</span>
          </p>
        )}
      </div>
    </li>
  );
}

export function TodaySchedulePanel({ events }: { events: CalendarEvent[] }) {
  const remaining = events.filter((e) => e.status === "UPCOMING" || e.status === "IN_PROGRESS").length;
  return (
    <Panel
      title="Lịch hôm nay"
      description={events.length ? `${events.length} lịch hẹn, còn ${remaining} chưa diễn ra` : undefined}
      icon={CalendarClock}
      actions={
        <Link to="/coach/calendar" className="rounded-lg text-xs font-bold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent dark:text-accent">
          Mở lịch
        </Link>
      }
    >
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="Hôm nay chưa có lịch hẹn"
          description="Lên lịch đánh giá hoặc review tiến độ cho học viên."
          className="py-8"
          action={
            <Button3D asChild size="sm">
              <Link to="/coach/calendar">Tạo lịch hẹn</Link>
            </Button3D>
          }
        />
      ) : (
        <ol aria-label="Lịch hẹn hôm nay">
          {events.map((e, i) => (
            <EventItem key={e.id} event={e} last={i === events.length - 1} />
          ))}
        </ol>
      )}
    </Panel>
  );
}
