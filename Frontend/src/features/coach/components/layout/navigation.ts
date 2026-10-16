import type { ComponentType } from "react";
import {
  Activity,
  Bell,
  BrainCircuit,
  CalendarDays,
  ClipboardCheck,
  ScrollText,
  Layers,
  SlidersHorizontal,
  ShieldCheck,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  NotebookPen,
  TrendingUp,
  Users,
} from "lucide-react";

export type NavBadgeKey = "attention" | "assessmentsDue" | "aiReview" | "messages" | "notifications";

export interface CoachNavItem {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badge?: NavBadgeKey;
}

export interface CoachNavGroup {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  items: CoachNavItem[];
}

/** Đầu mục theo quy trình làm việc của Coach: theo dõi học viên → đánh giá & xác nhận → soạn quy tắc → AI → liên lạc. */
export const COACH_NAV_GROUPS: CoachNavGroup[] = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    items: [{ id: "dashboard", label: "Tổng quan", href: "/coach/dashboard", icon: LayoutDashboard }],
  },
  {
    id: "students",
    label: "Học viên & Tiến độ",
    icon: Users,
    items: [
      { id: "students", label: "Học viên", href: "/coach/students", icon: Users, badge: "attention" },
      { id: "fitness", label: "Hồ sơ thể chất", href: "/coach/fitness-profiles", icon: Activity },
      { id: "performance", label: "Tiến độ & Thành tích", href: "/coach/performance", icon: TrendingUp },
      { id: "sessions", label: "Phiên tập luyện", href: "/coach/sessions", icon: Dumbbell },
    ],
  },
  {
    id: "assessment",
    label: "Đánh giá & Xác nhận",
    icon: ClipboardCheck,
    items: [
      { id: "assessments", label: "Kết quả đánh giá", href: "/coach/assessments", icon: ClipboardCheck, badge: "assessmentsDue" },
      { id: "l4", label: "Xác nhận L4", href: "/coach/l4-reviews", icon: ShieldCheck },
      { id: "safety", label: "Xác minh an toàn", href: "/coach/safety-clearances", icon: HeartPulse },
    ],
  },
  {
    id: "authoring",
    label: "Soạn thảo & Quy tắc",
    icon: ScrollText,
    items: [
      { id: "assessment-tests", label: "Soạn bài test đánh giá", href: "/coach/assessment-tests", icon: ClipboardCheck },
      { id: "rule-sets", label: "Quy tắc bài đánh giá", href: "/coach/rule-sets", icon: ScrollText },
      { id: "level-engine", label: "Quy tắc Level & Lộ trình", href: "/coach/level-engine", icon: Layers },
      { id: "motion-rules", label: "Rule chấm form", href: "/coach/motion-rules", icon: SlidersHorizontal },
      { id: "exercises", label: "Thư viện động tác", href: "/coach/exercises", icon: Dumbbell },
      { id: "plans", label: "Giáo án mẫu", href: "/coach/plans", icon: NotebookPen },
    ],
  },
  {
    id: "ai",
    label: "AI & Motion",
    icon: BrainCircuit,
    items: [{ id: "ai", label: "AI Coaching & Motion", href: "/coach/ai-analysis", icon: BrainCircuit, badge: "aiReview" }],
  },
  {
    id: "communication",
    label: "Liên lạc & Lịch",
    icon: MessageSquare,
    items: [
      { id: "messages", label: "Tin nhắn", href: "/coach/messages", icon: MessageSquare, badge: "messages" },
      { id: "notifications", label: "Thông báo", href: "/coach/notifications", icon: Bell, badge: "notifications" },
      { id: "calendar", label: "Lịch làm việc", href: "/coach/calendar", icon: CalendarDays },
    ],
  },
];

export const COACH_NAV: CoachNavItem[] = COACH_NAV_GROUPS.flatMap((g) => g.items);

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
