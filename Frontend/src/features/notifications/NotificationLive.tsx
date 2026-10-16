import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { REVIEW_REFERENCE_TYPES, notificationHref, type NotificationFrame } from "./api";
import { installAudioUnlock, playNotificationSound } from "./sound";

/** Mọi truy vấn có phần tử "notifications" trong khoá (Coach dùng khoá riêng của mình, Admin dùng khoá chung). */
const refreshAll = (qc: QueryClient) => qc.invalidateQueries({ predicate: (q) => q.queryKey.includes("notifications") });

const TOKEN_KEY = "calis_token";
const PING_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

/** Địa chỉ WebSocket: VITE_WS_URL nếu có, ngược lại cùng host với trang (Vite proxy /ws sang backend khi chạy dev). */
function socketUrl(token: string): string {
  const base = import.meta.env.VITE_WS_URL ?? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/notifications`;
  return `${base}?token=${encodeURIComponent(token)}`;
}

/**
 * Giữ MỘT kết nối WebSocket cho cả phiên làm việc của Coach/Admin: có tin mới thì làm mới danh sách thông báo ngay và hiện toast.
 * Tự nối lại với thời gian chờ tăng dần khi mất mạng hoặc backend khởi động lại; khi mất kết nối vẫn không mất tin vì tin đã lưu ở server
 * và danh sách được tải lại ngay khi nối lại được. Không hiển thị gì nếu chưa đăng nhập.
 */
export function NotificationLive({ area }: { area: "admin" | "coach" }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  // Giữ tham chiếu mới nhất để không phải mở lại kết nối mỗi lần render
  const handlers = useRef({ qc, navigate, area });
  handlers.current = { qc, navigate, area };

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closedByUs = false;
    let attempt = 0;
    let retryTimer: number | undefined;
    let pingTimer: number | undefined;

    const connect = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;
      ws = new WebSocket(socketUrl(token));

      ws.onopen = () => {
        const wasRetry = attempt > 0;
        attempt = 0;
        // Sau khi nối lại, tải bù những tin đến lúc đang mất kết nối
        if (wasRetry) void refreshAll(handlers.current.qc);
        pingTimer = window.setInterval(() => { if (ws?.readyState === WebSocket.OPEN) ws.send("ping"); }, PING_MS);
      };

      ws.onmessage = (ev) => {
        let frame: NotificationFrame;
        try { frame = JSON.parse(String(ev.data)) as NotificationFrame; } catch { return; }
        if (frame.event !== "notification" || !frame.notification) return;
        const n = frame.notification;
        void refreshAll(handlers.current.qc);
        if (n.referenceType && REVIEW_REFERENCE_TYPES.has(n.referenceType)) {
          // Trạng thái duyệt vừa đổi: làm mới mọi truy vấn đang hiển thị (danh sách, chi tiết, số liệu)
          void handlers.current.qc.invalidateQueries();
        }
        playNotificationSound();
        const href = notificationHref(n, handlers.current.area);
        toast.info(n.title, {
          description: n.message,
          duration: 8000,
          action: href ? { label: "Xem", onClick: () => handlers.current.navigate(href) } : undefined,
        });
      };

      ws.onclose = () => {
        window.clearInterval(pingTimer);
        if (closedByUs) return;
        attempt += 1;
        retryTimer = window.setTimeout(connect, Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS));
      };
      ws.onerror = () => ws?.close();
    };

    installAudioUnlock();
    connect();
    return () => {
      closedByUs = true;
      window.clearTimeout(retryTimer);
      window.clearInterval(pingTimer);
      ws?.close();
    };
  }, []);

  return null;
}
