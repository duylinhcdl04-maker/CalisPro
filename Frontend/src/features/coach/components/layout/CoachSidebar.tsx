import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronDown, Dumbbell, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { Tooltip } from "../ui";
import { COACH_NAV_GROUPS, isNavActive, type CoachNavGroup, type CoachNavItem } from "./navigation";
import { useNavBadges } from "./useNavBadges";

interface CoachSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function NavRow({ item, collapsed, count, onNavigate }: { item: CoachNavItem; collapsed: boolean; count?: number; onNavigate: () => void }) {
  const { pathname } = useLocation();
  const active = isNavActive(pathname, item.href);
  const Icon = item.icon;
  const showCount = !!count && count > 0;
  return (
    <li>
      <Tooltip label={showCount ? `${item.label} (${count})` : item.label} side="right" disabled={!collapsed} className="w-full">
        <NavLink
          to={item.href}
          onClick={onNavigate}
          aria-label={collapsed ? item.label : undefined}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-[16px] text-[13px] font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent select-none",
            collapsed ? "h-11 justify-center lg:px-0 px-3" : "h-11 px-3.5",
            active
              ? "bg-gradient-to-r from-palette-sky/20 via-palette-periwinkle/10 to-transparent dark:from-palette-sky/25 dark:via-palette-sky/10 dark:to-transparent text-sky-900 dark:text-sky-200 font-bold border border-palette-sky/35 dark:border-palette-sky/30 shadow-[0_2px_12px_rgba(140,169,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-xs"
              : "text-text-secondary hover:bg-black/[0.03] dark:hover:bg-white/[0.06] hover:text-text-primary hover:translate-x-0.5 border border-transparent"
          )}
        >
          {/* Active Glowing Left Accent Bar */}
          {active && (
            <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-r-full bg-gradient-to-b from-[#AAC4F5] to-[#8CA9FF] shadow-[0_0_8px_rgba(140,169,255,0.8)]" />
          )}

          {/* Squircle Icon Wrapper with Micro-interaction */}
          <span
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-xl transition-all duration-200",
              active
                ? "bg-palette-sky/30 dark:bg-palette-sky/35 text-palette-skyDeep dark:text-palette-sky shadow-xs scale-105"
                : "text-text-secondary group-hover:text-palette-skyDeep dark:group-hover:text-palette-sky group-hover:bg-palette-sky/10 group-hover:scale-110"
            )}
          >
            <Icon size={17} />
          </span>

          <span className={cn("flex-1 truncate tracking-[-0.01em]", collapsed && "lg:sr-only")}>
            {item.label}
          </span>

          {showCount && (
            <span
              className={cn(
                "grid min-w-[20px] place-items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums transition-transform duration-200 group-hover:scale-105",
                active
                  ? "bg-palette-sky/30 text-palette-skyDeep dark:text-sky-200 border border-palette-sky/40"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 shadow-2xs",
                collapsed && "lg:absolute lg:-right-1 lg:-top-1 lg:min-w-[18px] lg:px-1"
              )}
              aria-label={`${count} mục`}
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </NavLink>
      </Tooltip>
    </li>
  );
}

const OPEN_KEY = "coach.nav.openGroups";

function loadOpen(): string[] | null {
  try {
    const raw = window.localStorage.getItem(OPEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function NavGroup({ group, collapsed, open, onToggle, badges, onNavigate }: {
  group: CoachNavGroup; collapsed: boolean; open: boolean; onToggle: () => void;
  badges: Record<string, number | undefined>; onNavigate: () => void;
}) {
  const { pathname } = useLocation();
  const GroupIcon = group.icon;
  const hasActive = group.items.some((i) => isNavActive(pathname, i.href));
  const total = group.items.reduce((sum, i) => sum + (i.badge ? badges[i.badge] ?? 0 : 0), 0);

  // Nhóm chỉ có một mục: hiện thẳng mục đó, không cần tiêu đề nhóm.
  if (group.items.length === 1 || collapsed) {
    return (
      <>
        {group.items.map((item) => (
          <NavRow key={item.id} item={item} collapsed={collapsed} count={item.badge ? badges[item.badge] : undefined} onNavigate={onNavigate} />
        ))}
      </>
    );
  }

  return (
    <li className={cn("rounded-[18px] border transition-colors", hasActive ? "border-accent/30 bg-accent/[0.04]" : "border-border/70")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`nav-group-${group.id}`}
        className="flex h-11 w-full items-center gap-3 rounded-[18px] px-3 text-left text-[13px] font-extrabold text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-xl", hasActive ? "bg-accent/20 text-accent" : "bg-black/[0.04] text-text-secondary dark:bg-white/[0.06]")}>
          <GroupIcon size={16} />
        </span>
        <span className={cn("flex-1 truncate", hasActive && "text-accent-strong dark:text-accent")}>{group.label}</span>
        {total > 0 && !open ? (
          <span className="grid min-w-[20px] place-items-center rounded-full border border-rose-500/25 bg-rose-500/15 px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-rose-600 dark:text-rose-400" aria-label={`${total} mục cần xử lý`}>
            {total > 99 ? "99+" : total}
          </span>
        ) : (
          <span className="grid min-w-[20px] place-items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-text-secondary">{group.items.length}</span>
        )}
        <ChevronDown size={15} className={cn("shrink-0 text-text-secondary transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <ul id={`nav-group-${group.id}`} className="space-y-1 border-t border-border/70 px-2 pb-2 pt-2">
          {group.items.map((item) => (
            <NavRow key={item.id} item={item} collapsed={false} count={item.badge ? badges[item.badge] : undefined} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CoachSidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapsed }: CoachSidebarProps) {
  const badges = useNavBadges() as Record<string, number | undefined>;
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(() => loadOpen() ?? COACH_NAV_GROUPS.map((g) => g.id));
  // Điều hướng tới trang thuộc nhóm đang đóng thì tự mở nhóm đó
  useEffect(() => {
    const g = COACH_NAV_GROUPS.find((x) => x.items.some((i) => isNavActive(pathname, i.href)));
    if (g) setOpenGroups((cur) => (cur.includes(g.id) ? cur : [...cur, g.id]));
  }, [pathname]);
  const toggleGroup = (id: string) => setOpenGroups((cur) => {
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try { window.localStorage.setItem(OPEN_KEY, JSON.stringify(next)); } catch { /* không lưu được thì thôi */ }
    return next;
  });
  const closeOnMobile = () => {
    if (window.innerWidth < 1024) onCloseMobile();
  };

  const bottomItem = "flex w-full items-center gap-3 rounded-[14px] h-10 px-3 text-[13px] font-semibold text-text-secondary transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.06] hover:text-text-primary hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden" onClick={onCloseMobile} aria-hidden />}
      <aside
        aria-label="Điều hướng Coach"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-border bg-surface transition-[transform,width] duration-300 ease-out lg:sticky lg:top-0 lg:h-[100dvh] lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          collapsed && "lg:w-[84px]"
        )}
      >
        {/* Brand */}
        <div className={cn("flex h-16 shrink-0 items-center gap-2 border-b border-border px-4", collapsed && "lg:justify-center lg:px-0")}>
          <Link to="/coach/dashboard" className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-accent" aria-label="CalisHealth Coach - Tổng quan">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#8CA9FF] to-[#547EFF] text-white shadow-[0_4px_14px_rgba(140,169,255,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)] transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3">
              <Dumbbell size={19} />
            </span>
            <span className={cn("min-w-0", collapsed && "lg:hidden")}>
              <span className="block text-sm font-black tracking-tight text-text-primary">CALISHEALTH</span>
              <span className="block text-[10px] font-extrabold tracking-[0.2em] text-accent-strong dark:text-accent">COACH</span>
            </span>
          </Link>
          <button type="button" onClick={onCloseMobile} className="btn-3d btn-3d-ghost ml-auto h-8 w-8 p-0 lg:hidden" aria-label="Đóng menu">
            <X size={17} />
          </button>
        </div>

        {/* Primary navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin">
          <ul className="space-y-1.5">
            {COACH_NAV_GROUPS.map((g) => (
              <NavGroup key={g.id} group={g} collapsed={collapsed} open={openGroups.includes(g.id)} onToggle={() => toggleGroup(g.id)} badges={badges} onNavigate={closeOnMobile} />
            ))}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="shrink-0 space-y-1 border-t border-border px-3 py-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(bottomItem, "hidden border border-border/70 lg:flex", collapsed && "justify-center px-0")}
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            title="Ctrl + B"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
