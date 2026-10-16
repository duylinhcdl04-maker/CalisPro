import type { CoachNotification, CoachNotificationType } from "../types";
import { notificationHref, notificationsApi, type ServerNotification } from "../../notifications/api";

export interface NotificationListParams {
  type?: CoachNotificationType;
  unreadOnly?: boolean;
}

function toCoachNotification(n: ServerNotification): CoachNotification {
  const returned = n.type.endsWith("CHANGES_REQUESTED");
  return {
    id: String(n.id),
    type: "SYSTEM",
    severity: returned ? "warning" : n.type.endsWith("ACTIVATED") ? "success" : "info",
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    read: n.read,
    href: notificationHref(n, "coach"),
  };
}

/** Thông báo thật từ backend (/me/notifications); tin mới đến realtime qua WebSocket (NotificationLive) rồi làm mới các truy vấn này. */
export const notificationService = {
  async getNotifications(params: NotificationListParams = {}): Promise<CoachNotification[]> {
    const list = (await notificationsApi.list({ unreadOnly: params.unreadOnly, limit: 50 })).map(toCoachNotification);
    return params.type ? list.filter((n) => n.type === params.type) : list;
  },

  async markRead(id: string): Promise<CoachNotification> {
    await notificationsApi.markRead(Number(id));
    const found = (await notificationsApi.list({ limit: 50 })).find((n) => String(n.id) === id);
    return toCoachNotification(found ?? { id: Number(id), type: "", title: "", message: "", referenceType: null, referenceId: null, read: true, createdAt: new Date().toISOString() });
  },

  async markAllRead(): Promise<{ updated: number }> {
    const r = await notificationsApi.markAllRead();
    return { updated: r.changed };
  },
};
