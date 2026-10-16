import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CalendarPlus, Menu, MessageSquarePlus, NotebookPen, Plus, Search, Settings, UserRound, LogOut, CheckCheck } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useAuth } from "../../../auth/AuthContext";
import { SoundToggle } from "../../../notifications/SoundToggle";
import { useAISystemStatus, useMarkAllNotificationsRead, useNotifications } from "../../hooks";
import { formatRelative } from "../../lib/format";
import { Button3D, StudentAvatar, Tooltip, TONE_BG_SOLID } from "../ui";
import { Popover } from "../ui/Popover";
import { ThemeToggleButton } from "../../../../components/ui/ThemeToggleButton";

function AIStatusPill() {
  const { data } = useAISystemStatus();
  const ok = data?.status === "OPERATIONAL";
  return (
    <Link
      to="/coach/ai-analysis"
      className="well-3d group hidden items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold text-text-secondary transition-all hover:scale-105 hover:text-text-primary md:inline-flex"
      aria-label={`Trạng thái AI Motion: ${data?.label ?? "đang kiểm tra"}. ${data?.queuedAnalyses ?? 0} phân tích chờ review`}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        {ok && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden" />}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
      </span>
      <span>{data?.label ?? "AI Motion"}</span>
      {!!data?.queuedAnalyses && (
        <span className="rounded-full bg-palette-skyDeep px-1.5 text-[10px] tabular-nums font-extrabold text-white shadow-xs">
          {data.queuedAnalyses}
        </span>
      )}
    </Link>
  );
}

function NotificationBell() {
  const { data = [] } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const navigate = useNavigate();
  const unread = data.filter((n) => !n.read).length;
  return (
    <Popover
      width="w-[340px]"
      kind="dialog"
      trigger={(p) => (
        <Tooltip label="Thông báo" side="bottom">
          <button
            type="button"
            onClick={p.toggle}
            aria-expanded={p["aria-expanded"]}
            aria-haspopup={p["aria-haspopup"]}
            aria-label={`Thông báo, ${unread} chưa đọc`}
            className="btn-3d btn-3d-secondary group relative h-10 w-10 p-0"
          >
            <Bell size={17} className="transition-transform duration-200 group-hover:rotate-12" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-surface shadow-[0_2px_4px_rgba(244,63,94,0.4)] animate-pulse">
                {unread}
              </span>
            )}
          </button>
        </Tooltip>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <span className="text-sm font-extrabold text-text-primary">Thông báo</span>
            <SoundToggle className="ml-auto" />
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={!unread || markAll.isPending}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-accent-strong hover:bg-accent-soft disabled:opacity-40 dark:text-accent transition-colors"
            >
              <CheckCheck size={13} /> Đọc tất cả
            </button>
          </div>
          <ul className="max-h-80 space-y-1 overflow-y-auto scrollbar-thin">
            {data.slice(0, 6).map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    navigate(n.href ?? "/coach/notifications");
                  }}
                  className={cn("flex w-full gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface-elevated", !n.read && "bg-accent-soft/40")}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : TONE_BG_SOLID[n.severity])} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-text-primary">{n.title}</span>
                    <span className="block line-clamp-2 text-[11px] text-text-secondary">{n.message}</span>
                    <span className="mt-0.5 block text-[10px] text-text-secondary/80">{formatRelative(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/coach/notifications" onClick={close} className="mt-1 block rounded-xl py-2 text-center text-xs font-bold text-accent-strong hover:bg-accent-soft dark:text-accent transition-colors">
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </Popover>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: "Tạo giáo án", icon: NotebookPen, to: "/coach/plans/new" },
    { label: "Tạo lịch hẹn", icon: CalendarPlus, to: "/coach/calendar?new=1" },
    { label: "Gửi tin nhắn", icon: MessageSquarePlus, to: "/coach/messages" },
  ];
  return (
    <Popover
      width="w-56"
      trigger={(p) => (
        <Button3D
          variant="primary"
          size="md"
          onClick={p.toggle}
          aria-expanded={p["aria-expanded"]}
          aria-haspopup={p["aria-haspopup"]}
          leftIcon={<Plus size={16} className="transition-transform group-hover:rotate-90 duration-200" />}
          className="hidden sm:inline-flex group"
        >
          Tạo mới
        </Button3D>
      )}
    >
      {(close) => (
        <ul>
          {actions.map((a) => (
            <li key={a.to}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  navigate(a.to);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-text-primary hover:bg-surface-elevated transition-colors group"
              >
                <a.icon size={16} className="text-accent-strong dark:text-accent transition-transform group-hover:scale-110" />
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.name ?? "Coach";
  return (
    <Popover
      width="w-60"
      trigger={(p) => (
        <button
          type="button"
          onClick={p.toggle}
          aria-expanded={p["aria-expanded"]}
          aria-haspopup={p["aria-haspopup"]}
          aria-label="Menu tài khoản"
          className="btn-3d btn-3d-secondary group flex items-center gap-2 rounded-2xl p-1 pr-2.5 transition-all hover:border-[#8CA9FF]"
        >
          <StudentAvatar name={name} src={user?.avatarUrl} size="sm" />
          <span className="hidden text-left leading-tight xl:block">
            <span className="block text-xs font-bold text-text-primary group-hover:text-sky-600 transition-colors">{name}</span>
            <span className="block text-[10px] font-semibold text-text-secondary">Head Coach</span>
          </span>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="border-b border-border/70 px-3 pb-2.5 pt-1.5">
            <div className="text-sm font-bold text-text-primary">{name}</div>
            <div className="truncate text-[11px] text-text-secondary">{user?.email}</div>
          </div>
          <ul className="pt-1.5 space-y-0.5">
            {[
              { label: "Hồ sơ Coach", icon: UserRound, to: "/coach/profile" },
              { label: "Cài đặt", icon: Settings, to: "/coach/profile?tab=settings" },
            ].map((i) => (
              <li key={i.to}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { close(); navigate(i.to); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <i.icon size={16} className="text-text-secondary" /> {i.label}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={async () => { close(); await logout(); navigate("/login"); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 transition-colors"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </li>
          </ul>
        </div>
      )}
    </Popover>
  );
}

export function CoachTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/coach/students?search=${encodeURIComponent(q)}` : "/coach/students");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <button type="button" onClick={onOpenMobile} className="btn-3d btn-3d-secondary h-10 w-10 p-0 lg:hidden" aria-label="Mở menu">
        <Menu size={18} />
      </button>

      <form onSubmit={onSearch} role="search" className="relative min-w-0 flex-1 sm:max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm học viên theo tên, email, mã..."
          aria-label="Tìm kiếm học viên"
          className="well-3d h-10 w-full rounded-[14px] pl-10 pr-3 text-sm font-medium text-text-primary placeholder:text-text-secondary/70 focus:outline-none"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
        <AIStatusPill />
        <QuickActions />
        <ThemeToggleButton size="md" variant="clay" />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}

