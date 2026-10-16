import { MockApiError } from "../../../services/mock/latency";
import type { CalendarEvent, CalendarEventInput, CalendarRangeParams } from "../types";
import { CALENDAR_EVENTS } from "../mock/communication.mock";
import { studentRef } from "../mock/students.mock";
import { newId } from "../mock/helpers";
import { COACH_ENDPOINTS, USE_MOCK_API, api, mockResponse } from "./http";

function findEvent(id: string) {
  const e = CALENDAR_EVENTS.find((x) => x.id === id);
  if (!e) throw new MockApiError("Không tìm thấy lịch hẹn.", 404);
  return e;
}

function assertValid(input: CalendarEventInput) {
  if (new Date(input.end) <= new Date(input.start)) throw new MockApiError("Thời gian kết thúc phải sau thời gian bắt đầu.", 422);
}

function applyInput(target: CalendarEvent, input: CalendarEventInput) {
  const ref = input.studentId ? studentRef(input.studentId) : null;
  Object.assign(target, input, { studentName: ref?.studentName ?? null, studentAvatar: ref?.studentAvatar ?? null });
}

export const calendarService = {
  async getEvents(range: CalendarRangeParams): Promise<CalendarEvent[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.calendar, range);
    const list = CALENDAR_EVENTS.filter((e) => e.end >= range.from && e.start <= range.to).sort((a, b) => a.start.localeCompare(b.start));
    return mockResponse(list, 350);
  },

  async createEvent(input: CalendarEventInput): Promise<CalendarEvent> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.calendar, input);
    assertValid(input);
    const event = { id: newId("evt"), status: "UPCOMING" } as CalendarEvent;
    applyInput(event, input);
    CALENDAR_EVENTS.push(event);
    return mockResponse(event, 450);
  },

  async updateEvent(id: string, input: CalendarEventInput): Promise<CalendarEvent> {
    if (!USE_MOCK_API) return api.put(COACH_ENDPOINTS.calendarEvent(id), input);
    assertValid(input);
    const event = findEvent(id);
    applyInput(event, input);
    return mockResponse(event, 450);
  },

  async cancelEvent(id: string): Promise<CalendarEvent> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.calendarCancel(id));
    const event = findEvent(id);
    event.status = "CANCELLED";
    return mockResponse(event, 350);
  },
};
