import { apiClient } from "../../lib/api/client";

/** Thông báo trong ứng dụng (backend /me/notifications). Tin mới đến realtime qua WebSocket, xem useNotificationSocket. */
export interface ServerNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
}

/** Khung JSON backend đẩy qua WebSocket. */
export interface NotificationFrame {
  event: "notification" | "pong";
  notification?: ServerNotification;
  unreadCount?: number;
}

export const NOTIFICATIONS_KEY = ["notifications"] as const;

/** Hàng chờ việc của Admin (backend /admin/work-queue): mục đang chờ duyệt hoặc xử lý, tính từ trạng thái hiện tại. */
export interface WorkQueueItem { id: string; title: string; subtitle: string; since: string | null; urgent: boolean; href: string }
export interface WorkQueueGroup { key: string; label: string; hint: string; count: number; urgentCount: number; oldest: string | null; items: WorkQueueItem[] }
export interface WorkQueue { total: number; urgent: number; groups: WorkQueueGroup[] }

/** Khoá nằm dưới "notifications" nên mỗi thông báo realtime tới là hàng chờ được tải lại ngay. */
export const WORK_QUEUE_KEY = [...NOTIFICATIONS_KEY, "work-queue"] as const;

export const workQueueApi = {
  get: () => apiClient.get<WorkQueue>("/admin/work-queue").then((r) => r.data),
};

/** "chờ 3 ngày", "chờ 5 giờ", "vừa gửi" từ thời điểm bắt đầu chờ. */
export function waitingText(since: string | null): string {
  if (!since) return "";
  const ms = Date.now() - new Date(since).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "vừa gửi";
  if (hours < 24) return `chờ ${hours} giờ`;
  return `chờ ${Math.floor(hours / 24)} ngày`;
}

export const notificationsApi = {
  list: (params: { unreadOnly?: boolean; limit?: number } = {}) =>
    apiClient.get<ServerNotification[]>("/me/notifications", { params }).then((r) => r.data),
  unreadCount: () => apiClient.get<{ count: number }>("/me/notifications/unread-count").then((r) => r.data.count),
  markRead: (id: number) => apiClient.post<{ changed: boolean; unreadCount: number }>(`/me/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.post<{ changed: number; unreadCount: number }>("/me/notifications/read-all").then((r) => r.data),
};

/** Trang đích của một thông báo theo vai trò người nhận (admin | coach). */
export function notificationHref(n: Pick<ServerNotification, "referenceType" | "referenceId">, area: "admin" | "coach"): string | null {
  const id = n.referenceId;
  switch (n.referenceType) {
    case "LEVEL_ENGINE_RULE_SET":
      return `/${area}/level-engine`;
    case "RULESET_V2":
      return id != null ? (area === "admin" ? `/admin/assessment-rule-sets/${id}` : `/coach/rule-sets/${id}`) : null;
    case "MOTION_RULE":
      return area === "admin" ? "/admin/ai" : "/coach/motion-rules";
    case "PROGRAM_TEMPLATE":
      return id != null ? (area === "admin" ? `/admin/workout-plans/${id}` : `/coach/plans/${id}`) : null;
    case "EXERCISE":
      return id != null ? (area === "admin" ? `/admin/exercises/${id}/edit` : `/coach/exercises/${id}/edit`) : null;
    case "EXERCISE_REVISION":
      return id != null ? (area === "admin" ? `/admin/exercises?revision=${id}` : "/coach/exercises") : null;
    case "ASSESSMENT_TEMPLATE":
      return id != null ? (area === "admin" ? `/admin/assessments/${id}/edit` : `/coach/assessment-tests/${id}/edit`) : null;
    default:
      return null;
  }
}

/** Các loại thông báo thuộc quy trình Coach soạn, Admin duyệt: khi nhận được, dữ liệu các trang liên quan cần được làm mới. */
export const REVIEW_REFERENCE_TYPES = new Set(["LEVEL_ENGINE_RULE_SET", "RULESET_V2", "MOTION_RULE", "PROGRAM_TEMPLATE", "ASSESSMENT_TEMPLATE", "EXERCISE", "EXERCISE_REVISION"]);
