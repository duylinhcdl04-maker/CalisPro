import { AdminNotificationBell } from "./AdminNotificationBell";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  Command,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  User,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../features/auth/AuthContext";
import { useTheme } from "../../../features/theme/ThemeProvider";
import { GlowingAvatar } from "../../ui/GlowingAvatar";

interface AdminTopbarProps {
  onOpenSidebar: () => void;
  onOpenCommandPalette: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminTopbar({
  onOpenSidebar,
  onOpenCommandPalette,
  isCollapsed = false,
  onToggleCollapse,
}: AdminTopbarProps) {
  const { user, logout } = useAuth();
  const { preference, resolved, setPreference, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const notifications = [
    {
      id: "n1",
      title: "Đánh giá thể lực mới",
      desc: "Nguyễn Văn Minh vừa hoàn thành bài test đầu vào.",
      time: "5p trước",
      unread: true,
    },
    {
      id: "n2",
      title: "Gia hạn gói Pro",
      desc: "Trần Bảo Long thanh toán 1.490.000đ gói 12 tháng.",
      time: "25p trước",
      unread: true,
    },
    {
      id: "n3",
      title: "Cảnh báo AI Motion",
      desc: "Đã tự động sửa lỗi form cho 18 học viên hôm nay.",
      time: "1h trước",
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Left: Sidebar Toggle + Global Search Bar */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-xl p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary lg:hidden cursor-pointer"
          aria-label="Mở Menu Admin"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Sidebar Rail Toggle (Expand/Collapse) */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center rounded-xl p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary border border-border/50 hover:border-border transition-colors cursor-pointer"
            title={isCollapsed ? "Mở rộng sidebar (Ctrl + B)" : "Thu gọn sidebar để tối ưu toàn màn hình (Ctrl + B)"}
            aria-label="Thu gọn/Mở rộng Sidebar"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}

        {/* Global Search Button (Opens Command Palette) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-text-primary transition-all shadow-2xs w-48 sm:w-72 justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search size={14} className="text-text-secondary" />
            <span className="truncate">Tìm kiếm dữ liệu...</span>
          </div>

          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-surface border border-border px-1.5 py-0.5 text-[10px] font-mono text-text-secondary shadow-2xs">
            <Command size={10} /> K
          </kbd>
        </button>
      </div>

      {/* Right: AI System Status Pill + Notifications + Profile Menu */}
      <div className="flex items-center gap-3">
        {/* View User App Link */}
        <Link
          to="/home"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <ExternalLink size={13} />
          <span>Xem App Học Viên</span>
        </Link>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all cursor-pointer shadow-2xs group"
          title={resolved === "dark" ? "Chuyển sang giao diện Sáng (Light Mode)" : "Chuyển sang giao diện Tối (Dark Mode)"}
          aria-label="Đổi giao diện Sáng / Tối"
        >
          {resolved === "dark" ? (
            <Sun size={17} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon size={17} className="text-slate-700 dark:text-slate-200 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        <AdminNotificationBell />

        {/* Profile Menu Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <GlowingAvatar
              size="sm"
              fallback="AD"
              src={user?.avatarUrl}
              isEditable={false}
            />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border bg-surface p-2 shadow-xl z-50 space-y-1 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-border/70">
                <div className="text-xs font-bold text-text-primary">{user?.name ?? "Admin Calis"}</div>
                <div className="text-[11px] text-text-secondary truncate">{user?.email ?? "admin@calis.app"}</div>
              </div>

              {/* Quick Theme Selector in Profile Menu */}
              <div className="px-3 py-2 flex items-center justify-between text-xs text-text-secondary border-b border-border/70">
                <span className="font-semibold text-text-primary">Giao diện</span>
                <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setPreference("light")}
                    className={`p-1 rounded-md transition ${preference === "light" ? "bg-surface text-amber-500 font-bold shadow-xs" : "hover:text-text-primary"}`}
                    title="Giao diện Sáng"
                  >
                    <Sun size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreference("dark")}
                    className={`p-1 rounded-md transition ${preference === "dark" ? "bg-surface text-blue-400 font-bold shadow-xs" : "hover:text-text-primary"}`}
                    title="Giao diện Tối"
                  >
                    <Moon size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreference("system")}
                    className={`px-1.5 py-0.5 text-[10px] rounded-md transition font-bold ${preference === "system" ? "bg-surface text-accent shadow-xs" : "hover:text-text-primary"}`}
                    title="Tự động theo hệ thống"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <Link
                to="/admin/settings"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              >
                <Settings size={14} />
                Cài đặt hệ thống
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  logout();
                  navigate("/login");
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
