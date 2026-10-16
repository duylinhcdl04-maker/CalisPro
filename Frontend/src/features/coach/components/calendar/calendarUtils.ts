import {
  addDays,
  addMonths,
  addWeeks,
  differenceInMinutes,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { vi } from "date-fns/locale";
import type { CalendarEvent, CalendarEventType } from "../../types";
import { EVENT_TYPE } from "../../constants/labels";
import { TONE_BG_SOLID, TONE_CLASSES } from "../ui";

export type CalendarView = "month" | "week" | "day";

export const WEEK_OPTS = { weekStartsOn: 1 as const, locale: vi };
export const HOUR_START = 7;
export const HOUR_END = 21;
/** Pixel height of one hour row in the week/day timeline. */
export const HOUR_HEIGHT = 56;

export const EVENT_TYPES = Object.keys(EVENT_TYPE) as CalendarEventType[];
export const eventChipClass = (type: CalendarEventType) => TONE_CLASSES[EVENT_TYPE[type].tone];
export const eventDotClass = (type: CalendarEventType) => TONE_BG_SOLID[EVENT_TYPE[type].tone];

/** Visible period for a view. Month is always a 6 x 7 grid starting on Monday. */
export function getVisibleRange(view: CalendarView, cursor: Date): { start: Date; end: Date } {
  if (view === "day") return { start: startOfDay(cursor), end: endOfDay(cursor) };
  if (view === "week") return { start: startOfWeek(cursor, WEEK_OPTS), end: endOfWeek(cursor, WEEK_OPTS) };
  const start = startOfWeek(startOfMonth(cursor), WEEK_OPTS);
  return { start, end: endOfDay(addDays(start, 41)) };
}

export function daysBetween(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export function shiftCursor(view: CalendarView, cursor: Date, dir: 1 | -1): Date {
  if (view === "month") return addMonths(cursor, dir);
  if (view === "week") return addWeeks(cursor, dir);
  return addDays(cursor, dir);
}

export function periodTitle(view: CalendarView, cursor: Date): string {
  if (view === "month") return `Tháng ${format(cursor, "M, yyyy")}`;
  if (view === "day") return format(cursor, "EEEE, dd/MM/yyyy", { locale: vi });
  const s = startOfWeek(cursor, WEEK_OPTS);
  const e = endOfWeek(cursor, WEEK_OPTS);
  return `${format(s, "dd/MM")} - ${format(e, "dd/MM/yyyy")}`;
}

export function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), day)).sort((a, b) => a.start.localeCompare(b.start));
}

export interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  lane: number;
  lanes: number;
}

/** Places a day's events on the hour grid; overlapping events share the width in lanes. */
export function layoutDayEvents(events: CalendarEvent[]): PositionedEvent[] {
  const items = [...events].sort((a, b) => a.start.localeCompare(b.start));
  const result: PositionedEvent[] = [];
  let cluster: PositionedEvent[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    cluster.forEach((p) => (p.lanes = laneEnds.length));
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const event of items) {
    const s = new Date(event.start);
    const startMin = s.getHours() * 60 + s.getMinutes();
    const endMin = startMin + Math.max(differenceInMinutes(new Date(event.end), s), 15);
    if (startMin >= clusterEnd && cluster.length) flush();
    let lane = laneEnds.findIndex((end) => end <= startMin);
    if (lane === -1) lane = laneEnds.push(endMin) - 1;
    else laneEnds[lane] = endMin;
    clusterEnd = cluster.length ? Math.max(clusterEnd, endMin) : endMin;

    const gridStart = HOUR_START * 60;
    const gridEnd = HOUR_END * 60;
    const top = ((Math.max(startMin, gridStart) - gridStart) / 60) * HOUR_HEIGHT;
    const bottom = ((Math.min(Math.max(endMin, gridStart + 15), gridEnd) - gridStart) / 60) * HOUR_HEIGHT;
    cluster.push({ event, top, height: Math.max(bottom - top, 22), lane, lanes: 1 });
  }
  if (cluster.length) flush();
  return result;
}

/* ------------------------------- Form helpers ------------------------------- */

export const toDateInput = (d: Date) => format(d, "yyyy-MM-dd");
export const toTimeInput = (d: Date) => format(d, "HH:mm");
export const combineDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();
