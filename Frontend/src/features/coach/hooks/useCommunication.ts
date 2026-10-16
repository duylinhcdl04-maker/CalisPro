import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarService, messageService, notificationService, performanceService } from "../services";
import type { NotificationListParams } from "../services/notificationService";
import type { CalendarEventInput, CalendarRangeParams, PerformanceParams, SendMessageInput } from "../types";
import { coachKeys } from "./queryKeys";

/* ------------------------------ Performance ------------------------------ */

export function usePerformance(params: PerformanceParams) {
  return useQuery({ queryKey: coachKeys.performance(params), queryFn: () => performanceService.getReport(params), placeholderData: keepPreviousData });
}

/* ----------------------------- Notifications ----------------------------- */

export function useNotifications(params: NotificationListParams = {}) {
  return useQuery({ queryKey: coachKeys.notificationList(params), queryFn: () => notificationService.getNotifications(params) });
}

/** Unread count for the sidebar badge / topbar bell. */
export function useUnreadNotificationCount() {
  const { data } = useNotifications({ unreadOnly: true });
  return data?.length ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: coachKeys.notifications() }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: coachKeys.notifications() }),
  });
}

/* -------------------------------- Messages -------------------------------- */

export function useConversations() {
  return useQuery({ queryKey: coachKeys.conversations(), queryFn: messageService.getConversations });
}

export function useUnreadMessageCount() {
  const { data } = useConversations();
  return data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({ queryKey: coachKeys.messages(conversationId ?? ""), queryFn: () => messageService.getMessages(conversationId!), enabled: !!conversationId });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => messageService.sendMessage(input),
    onSuccess: (_msg, input) => {
      qc.invalidateQueries({ queryKey: coachKeys.messages(input.conversationId) });
      qc.invalidateQueries({ queryKey: coachKeys.conversations(), exact: true });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => messageService.markConversationRead(conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: coachKeys.conversations(), exact: true }),
  });
}

/* -------------------------------- Calendar -------------------------------- */

export function useCalendarEvents(range: CalendarRangeParams) {
  return useQuery({ queryKey: coachKeys.calendarRange(range), queryFn: () => calendarService.getEvents(range), placeholderData: keepPreviousData });
}

function useCalendarMutation<TVars>(fn: (vars: TVars) => ReturnType<typeof calendarService.createEvent>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coachKeys.calendar() });
      qc.invalidateQueries({ queryKey: coachKeys.dashboard() });
    },
  });
}

export const useCreateEvent = () => useCalendarMutation((input: CalendarEventInput) => calendarService.createEvent(input));
export const useUpdateEvent = () =>
  useCalendarMutation(({ id, input }: { id: string; input: CalendarEventInput }) => calendarService.updateEvent(id, input));
export const useCancelEvent = () => useCalendarMutation((id: string) => calendarService.cancelEvent(id));
