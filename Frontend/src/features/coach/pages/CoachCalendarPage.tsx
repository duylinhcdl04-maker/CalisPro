import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addHours, isSameDay, setHours, startOfHour } from "date-fns";
import { CalendarPlus } from "lucide-react";
import type { CalendarEvent } from "../types";
import { useCalendarEvents } from "../hooks";
import { Button3D, ErrorState, PageHeader, Panel, Skeleton } from "../components/ui";
import { CalendarToolbar } from "../components/calendar/CalendarToolbar";
import { MonthView } from "../components/calendar/MonthView";
import { TimeGrid } from "../components/calendar/TimeGrid";
import { DayAgenda } from "../components/calendar/DayAgenda";
import { EventFormModal, type EventFormTarget } from "../components/calendar/EventFormModal";
import { EventDetailModal } from "../components/calendar/EventDetailModal";
import { daysBetween, eventsOnDay, getVisibleRange, periodTitle, shiftCursor, type CalendarView } from "../components/calendar/calendarUtils";

const isMobile = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
const nextHour = () => startOfHour(addHours(new Date(), 1));

export default function CoachCalendarPage() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<CalendarView>(() => (isMobile() ? "day" : "month"));
  const [cursor, setCursor] = useState(() => new Date());
  const [formTarget, setFormTarget] = useState<EventFormTarget | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const range = useMemo(() => getVisibleRange(view, cursor), [view, cursor]);
  const rangeParams = useMemo(() => ({ from: range.start.toISOString(), to: range.end.toISOString() }), [range]);
  const query = useCalendarEvents(rangeParams);
  const events = useMemo(() => query.data ?? [], [query.data]);

  useEffect(() => {
    if (params.get("new") !== "1") return;
    setFormTarget({ mode: "create", slot: nextHour() });
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("new");
        return next;
      },
      { replace: true }
    );
  }, [params, setParams]);

  // Keep the detail modal in sync after edits/cancellation refetch the range.
  const selectedLive = selected ? (events.find((e) => e.id === selected.id) ?? selected) : null;

  const createAt = (slot: Date) => setFormTarget({ mode: "create", slot });
  const createOnDay = (day: Date) => createAt(isSameDay(day, new Date()) ? nextHour() : setHours(startOfHour(day), 9));
  const showDay = (day: Date) => {
    setCursor(day);
    setView("day");
  };

  function renderView() {
    if (query.isLoading) return <Skeleton className="h-[520px] w-full" />;
    if (query.isError) return <ErrorState onRetry={() => query.refetch()} retrying={query.isRefetching} />;
    if (view === "month")
      return <MonthView start={range.start} cursor={cursor} events={events} onSelectEvent={setSelected} onCreate={createOnDay} onShowDay={showDay} />;
    if (view === "week") return <TimeGrid days={daysBetween(range.start, 7)} events={events} onSelectEvent={setSelected} onCreate={createAt} />;
    const dayEvents = eventsOnDay(events, cursor);
    return (
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="hidden md:block">
          <TimeGrid days={[cursor]} events={events} onSelectEvent={setSelected} onCreate={createAt} />
        </div>
        <div>
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">
            Lịch trong ngày <span className="tabular-nums">({dayEvents.length})</span>
          </h3>
          <DayAgenda events={dayEvents} onSelectEvent={setSelected} onCreate={() => createOnDay(cursor)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Lịch làm việc"
        description="Quản lý lịch đánh giá, review buổi tập, review tiến độ và buổi huấn luyện."
        actions={
          <Button3D variant="primary" onClick={() => createAt(nextHour())} leftIcon={<CalendarPlus size={16} />}>
            Tạo lịch
          </Button3D>
        }
      />
      <Panel className="animate-rise" bodyClassName="space-y-4 p-3 sm:p-5">
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          title={periodTitle(view, cursor)}
          onPrev={() => setCursor((c) => shiftCursor(view, c, -1))}
          onNext={() => setCursor((c) => shiftCursor(view, c, 1))}
          onToday={() => setCursor(new Date())}
          fetching={query.isFetching}
        />
        <div className={query.isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>{renderView()}</div>
      </Panel>

      <EventDetailModal
        event={formTarget ? null : selectedLive}
        onClose={() => setSelected(null)}
        onEdit={(ev) => {
          setSelected(null);
          setFormTarget({ mode: "edit", event: ev });
        }}
      />
      <EventFormModal target={formTarget} onClose={() => setFormTarget(null)} />
    </div>
  );
}
