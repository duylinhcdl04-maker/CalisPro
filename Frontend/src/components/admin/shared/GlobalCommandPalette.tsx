import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  UserCheck,
  Dumbbell,
  BookOpen,
  Settings,
  Bot,
  ArrowRight,
  X,
  CreditCard,
  BarChart3,
} from "lucide-react";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "USERS" | "COACHES" | "EXERCISES" | "PLANS" | "SETTINGS";
  href: string;
}

const SEARCH_DATABASE: SearchResultItem[] = [
  { id: "1", title: "Nguyễn Văn Minh", subtitle: "Intermediate • minh.nguyen@calis.app", category: "USERS", href: "/admin/users" },
  { id: "2", title: "Lê Minh Thảo", subtitle: "Beginner • thao.le@gmail.com", category: "USERS", href: "/admin/users" },
  { id: "3", title: "Coach Hoàng Nam (Nam Calis)", subtitle: "Master Calisthenics Trainer • 42 học viên", category: "COACHES", href: "/admin/coaches" },
  { id: "4", title: "Coach Trần Bảo Long", subtitle: "Street Workout Athlete • 35 học viên", category: "COACHES", href: "/admin/coaches" },
  { id: "5", title: "Knee Push Up", subtitle: "Beginner • Nhóm cơ Ngực, Tay sau", category: "EXERCISES", href: "/admin/exercises" },
  { id: "6", title: "Push Up (Hít đất chuẩn)", subtitle: "Beginner • Nhóm cơ Ngực, Core", category: "EXERCISES", href: "/admin/exercises" },
  { id: "7", title: "Muscle Up", subtitle: "Advanced • Nhóm cơ Lưng, Ngực, Vai", category: "EXERCISES", href: "/admin/exercises" },
  { id: "8", title: "Lộ trình Calisthenics 12 Tuần Cơ Bản", subtitle: "Beginner Strength & Foundation", category: "PLANS", href: "/admin/workout-plans" },
  { id: "9", title: "Hệ thống AI Motion Tracking & Pose Rules", subtitle: "Quản lý 33 khớp xương và chẩn đoán form", category: "SETTINGS", href: "/admin/ai" },
  { id: "10", title: "Phân quyền quản trị viên (RBAC Matrix)", subtitle: "Super Admin, Coach, Content Manager", category: "SETTINGS", href: "/admin/settings" },
];

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalCommandPalette({ isOpen, onClose }: GlobalCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredResults = SEARCH_DATABASE.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelectItem(href: string) {
    onClose();
    navigate(href);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3.5 bg-surface">
          <Search size={18} className="text-text-secondary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm người dùng, coach, động tác, giáo án, cài đặt..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary">
              Không tìm thấy kết quả phù hợp cho "{query}".
            </div>
          ) : (
            filteredResults.map((item) => {
              const iconMap = {
                USERS: Users,
                COACHES: UserCheck,
                EXERCISES: Dumbbell,
                PLANS: BookOpen,
                SETTINGS: Settings,
              };
              const Icon = iconMap[item.category];

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item.href)}
                  className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-colors hover:bg-accent-soft/40 cursor-pointer border border-transparent hover:border-accent/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-text-secondary border border-border group-hover:bg-accent group-hover:text-white transition-colors">
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-text-primary group-hover:text-accent-strong truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-text-secondary truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded bg-background px-2 py-0.5 text-[10px] font-bold text-text-secondary border border-border/70">
                      {item.category}
                    </span>
                    <ArrowRight size={14} className="text-text-secondary group-hover:text-accent-strong opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Quick Keys Help */}
        <div className="border-t border-border/70 bg-background/50 px-4 py-2 flex items-center justify-between text-[11px] text-text-secondary">
          <span>Dùng phím mũi tên để chọn • Enter để mở</span>
          <kbd className="rounded bg-surface px-1.5 py-0.5 border border-border text-[10px] font-mono">ESC để đóng</kbd>
        </div>
      </div>
    </div>
  );
}
