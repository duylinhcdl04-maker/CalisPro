import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ChevronRight,
  LayoutGrid,
  X,
  ShieldCheck,
  ArrowRight,
  Settings,
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  Activity,
  Award,
  Crown,
  User,
  Sparkles,
  Flame,
  HeartPulse,
  Route,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { GlowingAvatar } from "../ui/GlowingAvatar";
import { ThemeToggleButton } from "../ui/ThemeToggleButton";
import { useAssessmentJourney } from "../../features/assessment-v2/journey";
import { UserCoachChatWidget } from "../../features/chat/components/UserCoachChatWidget";

interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Tiền tố đường dẫn dùng để xác định trạng thái active (mặc định = to). */
  match?: string;
  /** Nhãn ngắn cho thanh tab mobile. */
  shortLabel?: string;
  /** Mô tả ngắn hiển thị trong menu "Thêm" trên mobile. */
  hint?: string;
  /** Vị trí trên mobile: tab chính ở thanh dưới, hoặc nằm trong menu "Thêm" theo nhóm. */
  mobile: "tab" | "training" | "account";
  badge?: { text: string; variant: "live" | "vip" | "info" };
}

const SIDEBAR_ITEMS: NavItemConfig[] = [
  { to: "/home", label: "Tổng quan", icon: LayoutDashboard, mobile: "tab" },
  { to: "/workout/12", match: "/workout", label: "Luyện tập", icon: Dumbbell, mobile: "tab", badge: { text: "LIVE", variant: "live" } },
  { to: "/fitness-profile", label: "Hồ sơ thể chất", icon: HeartPulse, mobile: "training", hint: "Chỉ số & thể trạng" },
  { to: "/roadmap", label: "Lộ trình của tôi", shortLabel: "Lộ trình", icon: Route, mobile: "tab" },
  { to: "/progress", label: "Tiến độ", icon: TrendingUp, mobile: "tab" },
  { to: "/exercises", label: "Bài tập", icon: Activity, mobile: "training", hint: "Thư viện động tác" },
  { to: "/assessment", label: "Đánh giá", icon: Award, mobile: "training", hint: "Lịch sử kiểm tra trình độ" },
  { to: "/subscription", label: "Gói hội viên", icon: Crown, mobile: "account", hint: "Nâng cấp & quyền lợi", badge: { text: "VIP", variant: "vip" } },
  { to: "/profile", label: "Hồ sơ", icon: User, mobile: "account", hint: "Thông tin & cài đặt" },
];

const TAB_ITEMS = SIDEBAR_ITEMS.filter((i) => i.mobile === "tab");
const MORE_GROUPS: { title: string; items: NavItemConfig[] }[] = [
  { title: "Tập luyện", items: SIDEBAR_ITEMS.filter((i) => i.mobile === "training") },
  { title: "Tài khoản", items: SIDEBAR_ITEMS.filter((i) => i.mobile === "account") },
];

const isItemActive = (item: NavItemConfig, pathname: string) => pathname.startsWith(item.match ?? item.to);

export default function AuthenticatedLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Mục "Đánh giá" có nhãn nhắc khi hành trình đánh giá V2 còn bước cần làm (chỉ nhắc, không chặn)
  const journey = useAssessmentJourney().data;
  const navItems = SIDEBAR_ITEMS.map((i) => (i.to === "/assessment" && journey?.nextKey ? { ...i, badge: { text: "Cần làm", variant: "info" as const } } : i));

  const currentItem = SIDEBAR_ITEMS.find((i) => isItemActive(i, location.pathname));
  const moreActive = !!currentItem && currentItem.mobile !== "tab";

  // Đóng menu "Thêm" khi chuyển trang
  useEffect(() => setMoreOpen(false), [location.pathname]);

  // Khoá cuộn nền + đóng bằng Esc khi menu đang mở
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] bg-surface/90 px-4 backdrop-blur-xl md:hidden">
        <NavLink to="/home" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-gradient-to-br from-[#AAC4F5] via-[#8CA9FF] to-[#547EFF] text-white shadow-[0_4px_10px_rgba(140,169,255,0.4)]">
            <Dumbbell size={16} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="font-display text-sm font-black tracking-tight text-text-primary">
              CALIS<span className="text-sky-500">.</span>
            </div>
            <div className="truncate text-[11px] font-semibold text-text-secondary">{currentItem?.label ?? "Calisthenics"}</div>
          </div>
        </NavLink>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggleButton size="sm" variant="clay" />
          <NavLink to="/profile" aria-label="Hồ sơ"
            className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#AAC4F5] to-[#547EFF] text-sm font-black text-white ring-2 ring-sky-400/40">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.name?.[0] ?? "U")}
          </NavLink>
        </div>
      </header>

      {/* Enhanced Desktop Claymorphic Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-black/[0.04] dark:border-white/[0.06] bg-surface/90 backdrop-blur-xl p-5 md:flex shadow-[4px_0_30px_rgba(0,0,0,0.02)]">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between pb-2">
          <NavLink to="/home" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#AAC4F5] via-[#8CA9FF] to-[#547EFF] text-white shadow-[0_4px_14px_rgba(140,169,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3">
              <Dumbbell size={20} strokeWidth={2.4} />
            </span>
            <div>
              <div className="font-display text-xl font-black tracking-tight text-text-primary flex items-center gap-1.5">
                CALIS<span className="text-sky-500">.</span>
                <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-extrabold text-sky-700 dark:text-sky-400 uppercase tracking-wider shadow-2xs">
                  PRO
                </span>
              </div>
            </div>
          </NavLink>

          <ThemeToggleButton size="sm" variant="clay" />
        </div>

        {/* Admin Switcher Banner if role is ADMIN */}
        {user?.role === "ADMIN" && (
          <NavLink
            to="/admin/dashboard"
            className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/15 to-blue-500/15 p-2.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:from-sky-500/25 hover:to-blue-500/25 transition-all shadow-[0_4px_14px_rgba(14,165,233,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)]"
          >
            <div className="flex items-center gap-2.5 truncate">
              <ShieldCheck size={16} className="text-palette-skyDeep dark:text-palette-sky" />
              <span className="truncate">Về Trang Quản trị</span>
            </div>
            <ArrowRight size={14} className="shrink-0" />
          </NavLink>
        )}

        {/* Navigation Menu Links with System Design & Tactile Hover */}
        <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
          <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-text-secondary/70">
            Menu chính
          </div>
          {navItems.map((item) => {
            const isActive = isItemActive(item, location.pathname);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`group relative flex items-center justify-between rounded-[18px] px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 select-none ${
                  isActive
                    ? "bg-white dark:bg-white/[0.08] text-[#1d3d9e] dark:text-[#8CA9FF] font-extrabold border border-[#8CA9FF]/40 dark:border-[#8CA9FF]/30 shadow-[0_6px_18px_-4px_rgba(140,169,255,0.25),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(140,169,255,0.15)]"
                    : "text-text-secondary hover:bg-white/80 dark:hover:bg-white/[0.05] hover:text-text-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-black/[0.04] dark:hover:border-white/[0.05] border border-transparent"
                }`}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-r-full bg-gradient-to-b from-[#8CA9FF] to-[#547EFF] shadow-[0_0_10px_rgba(140,169,255,0.8)]" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-[12px] transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-br from-[#AAC4F5] via-[#8CA9FF] to-[#6384FF] text-white shadow-[0_4px_12px_rgba(140,169,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.8)] scale-105"
                        : "bg-black/[0.03] dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 group-hover:bg-[#8CA9FF]/15 group-hover:text-[#456eff] dark:group-hover:text-[#8CA9FF] group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-xs"
                    }`}
                  >
                    <Icon size={17} strokeWidth={2.4} />
                  </span>
                  <span className="truncate tracking-[-0.01em]">{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs ${
                      item.badge.variant === "live"
                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_2px_6px_rgba(244,63,94,0.35)] animate-pulse"
                        : item.badge.variant === "vip"
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_2px_6px_rgba(245,158,11,0.3)]"
                        : "bg-palette-skyDeep text-white"
                    }`}
                  >
                    {item.badge.text}
                  </span>
                ) : (
                  <ChevronRight
                    size={14}
                    className={`opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 ${
                      isActive ? "opacity-90 translate-x-0 text-[#547EFF] dark:text-[#8CA9FF]" : "text-text-secondary"
                    }`}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Mini Profile Card at Footer */}
        <div className="mt-auto border-t border-black/[0.04] dark:border-white/[0.06] pt-3.5">
          <div className="group relative flex items-center gap-3 rounded-2xl p-2 bg-surface hover:bg-surface-elevated transition-all border border-white/80 dark:border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.9)]">
            <NavLink to="/profile" className="relative shrink-0" title="Chỉnh sửa hồ sơ">
              <GlowingAvatar
                size="sm"
                fallback={user?.name?.[0] ?? "U"}
                src={user?.avatarUrl}
                isEditable={false}
              />
            </NavLink>

            <NavLink to="/profile" className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-bold text-text-primary group-hover:text-sky-600 transition-colors">
                  {user?.name ?? "Người dùng"}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0 animate-pulse" title="Đang trực tuyến" />
              </div>
              <div className="truncate text-[10px] text-text-secondary">{user?.email ?? "demo@calis.app"}</div>
            </NavLink>

            <NavLink
              to="/profile"
              aria-label="Cài đặt hồ sơ"
              className="rounded-xl p-1.5 text-text-secondary transition-colors hover:bg-sky-500/10 hover:text-sky-600"
            >
              <Settings size={16} />
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:ml-72 md:pb-10">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar: 4 tab chính + "Thêm" */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-black/[0.04] dark:border-white/[0.06] bg-surface/95 backdrop-blur-xl px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
      >
        {TAB_ITEMS.map((item) => (
          <TabButton key={item.label} to={item.to} label={item.shortLabel ?? item.label} icon={item.icon} active={!moreOpen && isItemActive(item, location.pathname)} />
        ))}
        <TabButton label="Thêm" icon={LayoutGrid} active={moreOpen || moreActive} onClick={() => setMoreOpen((v) => !v)} expanded={moreOpen} />
      </nav>

      {/* Mobile "Thêm" bottom sheet: toàn bộ trang còn lại */}
      <div className={`fixed inset-0 z-[35] md:hidden ${moreOpen ? "" : "pointer-events-none"}`} aria-hidden={!moreOpen}>
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 ${moreOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMoreOpen(false)}
        />
        <div
          id="mobile-more-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Tất cả mục"
          className={`absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-surface px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))] shadow-[0_-20px_50px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out ${
            moreOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/10 dark:bg-white/15" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-black text-text-primary">Tất cả mục</h2>
            <button type="button" onClick={() => setMoreOpen(false)} aria-label="Đóng"
              className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-text-secondary hover:text-text-primary">
              <X size={16} />
            </button>
          </div>

          {/* Thẻ người dùng */}
          <NavLink to="/profile" className="mb-4 flex items-center gap-3 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-background/60 p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#AAC4F5] to-[#547EFF] text-base font-black text-white">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.name?.[0] ?? "U")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-text-primary">{user?.name ?? "Người dùng"}</div>
              <div className="truncate text-xs text-text-secondary">{user?.email ?? ""}</div>
            </div>
            <Settings size={16} className="shrink-0 text-text-secondary" />
          </NavLink>

          {user?.role === "ADMIN" && (
            <NavLink to="/admin/dashboard"
              className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/15 to-blue-500/15 p-3 text-sm font-bold text-sky-700 dark:text-sky-300">
              <span className="flex items-center gap-2.5"><ShieldCheck size={17} /> Về Trang Quản trị</span>
              <ArrowRight size={15} />
            </NavLink>
          )}

          {MORE_GROUPS.map((group) => (
            <section key={group.title} className="mb-4">
              <h3 className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-wider text-text-secondary/70">{group.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const active = isItemActive(item, location.pathname);
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.label} to={item.to}
                      className={`relative flex flex-col gap-2 rounded-2xl border p-3 transition-colors ${
                        active
                          ? "border-[#8CA9FF]/50 bg-[#8CA9FF]/10"
                          : "border-black/[0.04] dark:border-white/[0.06] bg-background/60 active:bg-black/[0.04] dark:active:bg-white/[0.06]"
                      }`}>
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${
                        active
                          ? "bg-gradient-to-br from-[#AAC4F5] via-[#8CA9FF] to-[#6384FF] text-white shadow-[0_4px_10px_rgba(140,169,255,0.4)]"
                          : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-500 dark:text-slate-300"
                      }`}>
                        <Icon size={17} strokeWidth={2.4} />
                      </span>
                      <div className="min-w-0">
                        <div className={`truncate text-sm font-bold ${active ? "text-[#1d3d9e] dark:text-[#8CA9FF]" : "text-text-primary"}`}>{item.label}</div>
                        {item.hint && <div className="truncate text-[11px] text-text-secondary">{item.hint}</div>}
                      </div>
                      {item.badge && (
                        <span className={`absolute right-2.5 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          item.badge.variant === "vip" ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950" : "bg-rose-500 text-white"
                        }`}>
                          {item.badge.text}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Floating User Coach Chatbox */}
      {/* Ẩn khi menu "Thêm" mở để không đè lên sheet */}
      <div className={moreOpen ? "hidden md:block" : undefined}>
        <UserCoachChatWidget />
      </div>
    </div>
  );
}

function TabButton({ to, label, icon: Icon, active, onClick, expanded }: {
  to?: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick?: () => void;
  expanded?: boolean;
}) {
  const className = `relative flex min-w-0 flex-col items-center gap-1 rounded-2xl py-1 text-[10px] font-bold transition-colors ${
    active ? "text-[#547EFF] dark:text-[#8CA9FF] font-black" : "text-text-secondary active:text-text-primary"
  }`;
  const content = (
    <>
      <span
        className={`grid h-8 w-8 place-items-center rounded-xl transition-all ${
          active
            ? "bg-gradient-to-br from-[#AAC4F5] via-[#8CA9FF] to-[#6384FF] text-white shadow-[0_4px_10px_rgba(140,169,255,0.4)] scale-105"
            : "bg-black/[0.03] dark:bg-white/[0.05] text-slate-500 dark:text-slate-400"
        }`}
      >
        <Icon size={16} strokeWidth={2.4} />
      </span>
      <span className="max-w-full truncate px-0.5">{label}</span>
      {active && <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] shadow-[0_0_8px_rgba(140,169,255,0.8)]" />}
    </>
  );
  return to ? (
    <NavLink to={to} className={className} aria-current={active ? "page" : undefined}>{content}</NavLink>
  ) : (
    <button type="button" onClick={onClick} className={className} aria-expanded={expanded} aria-controls="mobile-more-sheet">{content}</button>
  );
}

