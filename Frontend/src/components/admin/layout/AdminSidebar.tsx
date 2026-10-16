import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Dumbbell,
  BookOpen,
  Layers,
  ScrollText,
  CalendarCheck,
  ClipboardCheck,
  Activity,
  TrendingUp,
  Bot,
  CreditCard,
  BarChart3,
  Bell,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

interface NavGroup {
  id: string;
  groupName: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: NavItem[];
}

const ADMIN_NAVIGATION: NavGroup[] = [
  {
    id: "overview",
    groupName: "Tổng quan & Dashboard",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Bảng điều khiển (Dashboard)", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "users_coaches",
    groupName: "Người dùng & Huấn luyện viên",
    icon: Users,
    items: [
      { id: "users", label: "Quản lý Người dùng", href: "/admin/users", icon: Users, badge: "12.4k" },
      { id: "coaches", label: "Huấn luyện viên (Coach)", href: "/admin/coaches", icon: UserCheck, badge: "3 online" },
    ],
  },
  {
    id: "training_system",
    groupName: "Hệ thống Tập luyện",
    icon: Dumbbell,
    items: [
      { id: "exercises", label: "Thư viện Động tác", href: "/admin/exercises", icon: Dumbbell },
      { id: "plans", label: "Giáo án & Lộ trình", href: "/admin/workout-plans", icon: BookOpen },
      { id: "level-engine", label: "Quy tắc Level & Lộ trình", href: "/admin/level-engine", icon: Layers },
      { id: "assessment-rule-sets", label: "Quy tắc bài đánh giá", href: "/admin/assessment-rule-sets", icon: ScrollText },
      { id: "sessions", label: "Phiên tập luyện", href: "/admin/workout-sessions", icon: CalendarCheck },
    ],
  },
  {
    id: "assessment_fitness",
    groupName: "Hệ thống Đánh giá",
    icon: ClipboardCheck,
    items: [
      { id: "assessments", label: "Bài test Đánh giá", href: "/admin/assessments", icon: ClipboardCheck },
    ],
  },
  {
    id: "ai_intelligence",
    groupName: "Công nghệ AI & Motion",
    icon: Bot,
    items: [
      { id: "ai", label: "AI Coaching & Vision", href: "/admin/ai", icon: Bot, badge: "Live" },
    ],
  },
  {
    id: "business_reports",
    groupName: "Kinh doanh & Báo cáo",
    icon: CreditCard,
    items: [
      { id: "subscriptions", label: "Gói Hội viên & Doanh thu", href: "/admin/subscriptions", icon: CreditCard },
      { id: "analytics", label: "Phân tích & Báo cáo", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "content_comm",
    groupName: "Nội dung & Truyền thông",
    icon: FileText,
    items: [
      { id: "content", label: "Quản lý Nội dung", href: "/admin/content", icon: FileText },
      { id: "notifications", label: "Thông báo & Email", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    id: "system_security",
    groupName: "Hệ thống & Bảo mật",
    icon: ShieldCheck,
    items: [
      { id: "settings", label: "Cài đặt & Phân quyền RBAC", href: "/admin/settings", icon: ShieldCheck },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const location = useLocation();
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find which group contains current active route
  const activeGroupId = ADMIN_NAVIGATION.find((group) =>
    group.items.some(
      (item) =>
        location.pathname === item.href ||
        (item.href !== "/admin/dashboard" && location.pathname.startsWith(item.href))
    )
  )?.id || "overview";

  // State to track expanded accordion groups in full mode
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overview: true,
    [activeGroupId]: true,
  });

  // Auto-expand group when route changes
  useEffect(() => {
    if (activeGroupId) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId]);

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }

  function handleMouseEnterGroup(groupId: string) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredGroupId(groupId);
  }

  function handleMouseLeaveGroup() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredGroupId(null);
    }, 150);
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20 w-72" : "w-72"}`}
      >
        {/* Brand Header */}
        <div className={`flex h-16 shrink-0 items-center border-b border-border transition-all ${
          isCollapsed ? "lg:justify-center px-3 justify-between" : "justify-between px-4"
        }`}>
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-2.5 overflow-hidden ${
              isCollapsed ? "lg:justify-center" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-xs">
              <Dumbbell size={20} />
            </div>

            {/* Brand Text (Hidden when collapsed on desktop) */}
            <div className={`${isCollapsed ? "lg:hidden" : "block"} transition-opacity duration-200`}>
              <div className="font-display text-sm font-black tracking-tight text-text-primary flex items-center gap-1.5">
                CALISHEALTH
                <span className="rounded bg-accent/15 px-1.5 py-0.2 text-[10px] font-black uppercase text-accent-strong border border-accent/20">
                  ADMIN
                </span>
              </div>
              <div className="text-[10px] font-semibold text-text-secondary truncate">Health-Tech & AI Platform</div>
            </div>
          </Link>

          {/* Desktop Toggle Button in Header when expanded */}
          {!isCollapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Thu gọn sidebar (Tối ưu toàn màn hình)"
              className="hidden lg:flex rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors cursor-pointer"
            >
              <PanelLeftClose size={17} />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-2 scrollbar-thin">
          {!isCollapsed && (
            <div className="px-2 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-text-secondary/70">
              <span>Danh mục Quản trị</span>
              <span>{ADMIN_NAVIGATION.length} Phân hệ</span>
            </div>
          )}

          {ADMIN_NAVIGATION.map((group) => {
            const isExpanded = !!expandedGroups[group.id];
            const GroupIcon = group.icon;
            const hasActiveChild = group.items.some(
              (item) =>
                location.pathname === item.href ||
                (item.href !== "/admin/dashboard" && location.pathname.startsWith(item.href))
            );

            /* =========================================================================
             * 1. COLLAPSED MODE (ICON RAIL + FLOATING FLYOUT POPOVER ON HOVER/CLICK)
             * ========================================================================= */
            if (isCollapsed) {
              const isHovered = hoveredGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className="relative flex justify-center"
                  onMouseEnter={() => handleMouseEnterGroup(group.id)}
                  onMouseLeave={handleMouseLeaveGroup}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (group.items.length === 1) {
                        // Direct navigation for single-item groups (like Dashboard)
                        window.location.href = group.items[0].href;
                      } else {
                        setHoveredGroupId(isHovered ? null : group.id);
                      }
                    }}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all cursor-pointer ${
                      hasActiveChild
                        ? "bg-accent text-white shadow-md ring-2 ring-accent/30 font-bold"
                        : "bg-background/80 text-text-secondary hover:bg-surface-elevated hover:text-text-primary border border-border/60"
                    }`}
                  >
                    <GroupIcon size={18} />
                  </button>

                  {/* 🚀 FLOATING FLYOUT POPOVER FOR COLLAPSED RAIL */}
                  {isHovered && (
                    <div
                      className="absolute left-[70px] top-0 z-50 w-64 rounded-2xl border border-border bg-surface p-3 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 space-y-2"
                      onMouseEnter={() => handleMouseEnterGroup(group.id)}
                      onMouseLeave={handleMouseLeaveGroup}
                    >
                      <div className="flex items-center justify-between border-b border-border/70 pb-2 px-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <GroupIcon size={15} className="text-accent-strong shrink-0" />
                          <span className="text-xs font-black text-text-primary truncate">
                            {group.groupName}
                          </span>
                        </div>
                        <span className="rounded-full bg-surface-elevated px-1.5 py-0.2 text-[10px] font-bold text-text-secondary border border-border">
                          {group.items.length}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const isActive =
                            location.pathname === item.href ||
                            (item.href !== "/admin/dashboard" && location.pathname.startsWith(item.href));
                          const Icon = item.icon;

                          return (
                            <Link
                              key={item.id}
                              to={item.href}
                              onClick={() => setHoveredGroupId(null)}
                              className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all ${
                                isActive
                                  ? "bg-accent text-white font-bold shadow-xs"
                                  : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon size={14} className={isActive ? "text-white" : "text-text-secondary"} />
                                <span className="truncate">{item.label}</span>
                              </div>

                              {item.badge && (
                                <span
                                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold shrink-0 ${
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : "bg-accent-soft text-accent-strong border border-accent/20"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            /* =========================================================================
             * 2. EXPANDED MODE (ACCORDION CATEGORY TREE)
             * ========================================================================= */
            return (
              <div
                key={group.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  hasActiveChild
                    ? "border-accent/40 bg-accent-soft/10 shadow-2xs"
                    : "border-border/60 bg-background/40 hover:border-border"
                }`}
              >
                {/* 📂 ACCORDION HEADER BUTTON */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer text-left ${
                    hasActiveChild
                      ? "text-accent-strong"
                      : "text-text-primary hover:bg-surface-elevated"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        hasActiveChild
                          ? "bg-accent text-white"
                          : "bg-surface text-text-secondary border border-border"
                      }`}
                    >
                      <GroupIcon size={13} />
                    </div>
                    <span className="truncate text-xs">{group.groupName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="rounded-full bg-surface px-1.5 py-0.2 text-[10px] font-semibold text-text-secondary border border-border/60">
                      {group.items.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-text-secondary" />
                    ) : (
                      <ChevronRight size={14} className="text-text-secondary" />
                    )}
                  </div>
                </button>

                {/* 📋 EXPANDABLE CHILD ITEMS */}
                {isExpanded && (
                  <div className="px-2 pb-2 pt-1 space-y-1 bg-surface/60 border-t border-border/40 animate-in fade-in-50 duration-150">
                    {group.items.map((item) => {
                      const isActive =
                        location.pathname === item.href ||
                        (item.href !== "/admin/dashboard" && location.pathname.startsWith(item.href));
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.id}
                          to={item.href}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-accent text-white font-bold shadow-xs"
                              : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pl-1">
                            <Icon
                              size={14}
                              className={isActive ? "text-white" : "text-text-secondary group-hover:text-accent-strong"}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold shrink-0 ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-accent-soft text-accent-strong border border-accent/20"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM COLLAPSE / EXPAND TOGGLE BAR (DESKTOP) */}
        {onToggleCollapse && (
          <div className="hidden lg:flex shrink-0 p-2.5 border-t border-border/70 bg-surface">
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar (Tối ưu toàn màn hình)"}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-2 text-xs font-bold text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all cursor-pointer border border-border/50 ${
                isCollapsed ? "h-10 px-0" : ""
              }`}
            >
              {isCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <>
                  <PanelLeftClose size={16} />
                  <span className="truncate">Thu gọn sidebar</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
