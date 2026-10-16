import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { SoundToggle } from "../../../features/notifications/SoundToggle";
import { NOTIFICATIONS_KEY, notificationHref, notificationsApi, waitingText, type ServerNotification } from "../../../features/notifications/api";
import { useAdminWorkQueue } from "../dashboard/AdminWorkQueue";

function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return `${Math.floor(s / 86400)} ngày trước`;
}

/** Chuông thông báo của Admin: dữ liệu thật từ backend, làm mới tức thì khi có tin qua WebSocket (NotificationLive). */
export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: [...NOTIFICATIONS_KEY, "admin", "list"], queryFn: () => notificationsApi.list({ limit: 20 }), retry: false });
  const items = list.data ?? [];
  const unreadNotifications = items.filter((n) => !n.read).length;
  const queue = useAdminWorkQueue();
  const pending = queue.data?.total ?? 0;
  // Số trên chuông = việc đang chờ hoặc thông báo chưa đọc, lấy số lớn hơn (một mục chờ duyệt thường đi kèm một thông báo nên cộng lại sẽ đếm đôi)
  const unread = Math.max(unreadNotifications, pending);
  const refresh = () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
  const read = useMutation({ mutationFn: (id: number) => notificationsApi.markRead(id), onSuccess: refresh });
  const readAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh });

  function openItem(n: ServerNotification) {
    setOpen(false);
    if (!n.read) read.mutate(n.id);
    const href = notificationHref(n, "admin");
    if (href) navigate(href);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
        aria-label={`Thông báo hệ thống, ${unread} chưa đọc`}
        aria-expanded={open}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-surface">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-80 space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
              <span className="text-xs font-bold text-text-primary">Thông báo Quản trị</span>
              <SoundToggle />
              <button
                type="button"
                onClick={() => readAll.mutate()}
                disabled={!unreadNotifications || readAll.isPending}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-accent-strong hover:bg-accent-soft disabled:opacity-40"
              >
                <CheckCheck size={13} /> Đọc tất cả
              </button>
            </div>

            {pending > 0 && queue.data && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-black text-amber-800 dark:text-amber-200">
                  <span>Cần bạn xử lý ({pending})</span>
                  {queue.data.urgent > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">{queue.data.urgent} gấp</span>}
                </div>
                <ul className="mt-1.5 space-y-0.5">
                  {queue.data.groups.slice(0, 5).map((g) => (
                    <li key={g.key}>
                      <Link to={g.items[0].href} onClick={() => setOpen(false)} className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-[11px] hover:bg-amber-500/15">
                        <span className="truncate font-semibold text-text-primary">{g.label}</span>
                        <span className="shrink-0 text-text-secondary">{g.count} · {waitingText(g.oldest)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="mt-1.5 block text-center text-[11px] font-bold text-accent-strong hover:underline">Xem tất cả việc cần xử lý</Link>
              </div>
            )}

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {list.isError && <p className="p-2 text-xs text-text-secondary">Không tải được thông báo.</p>}
              {!list.isError && items.length === 0 && <p className="p-2 text-xs text-text-secondary">Chưa có thông báo nào.</p>}
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={`block w-full rounded-xl p-2.5 text-left text-xs transition-colors ${n.read ? "hover:bg-surface-elevated" : "border border-accent/20 bg-accent-soft/30"}`}
                >
                  <div className="flex items-center justify-between gap-2 font-bold text-text-primary">
                    <span className="truncate">{n.title}</span>
                    <span className="shrink-0 text-[10px] font-normal text-text-secondary">{ago(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-text-secondary">{n.message}</p>
                </button>
              ))}
            </div>

            <div className="border-t border-border/70 pt-2 text-center">
              <Link to="/admin/level-engine" onClick={() => setOpen(false)} className="text-xs font-bold text-accent-strong hover:underline">
                Mở Level Engine →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
