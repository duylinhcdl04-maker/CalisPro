import { useState } from "react";
import {
  Users,
  Dumbbell,
  Activity,
  Bot,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import {
  ADMIN_KPIS,
  USER_GROWTH_DATA,
  WORKOUT_COMPLETION_STATS,
  FITNESS_DISTRIBUTION_DATA,
  USER_GOALS_DATA,
  AI_SYSTEM_HEALTH,
  RECENT_ACTIVITIES,
} from "../../services/mock/adminMockData";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { AdminStatCard } from "../../components/admin/shared/AdminStatCard";
import { Button } from "../../components/ui/Button";
import { AdminWorkQueue } from "../../components/admin/dashboard/AdminWorkQueue";

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "3M" | "1Y">("30D");

  function handleExportReport() {
    toast.success("Đang xuất báo cáo tổng quan (CSV)", {
      description: "Tệp CalisHealth_Admin_Report_2026.csv đang được tạo...",
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* 🧭 PAGE HEADER */}
      <AdminPageHeader
        title="Bảng điều khiển Tổng quan (Admin Dashboard)"
        description="Trung tâm giám sát vận hành toàn diện CalisHealth: Người dùng, huấn luyện viên, hiệu suất tập luyện và trạng thái động cơ AI."
        badge="Live Metrics"
        actions={
          <>
            <div className="flex items-center gap-1 rounded-xl bg-surface p-1 border border-border">
              {(["7D", "30D", "3M", "1Y"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    timeRange === r
                      ? "bg-accent text-white shadow-2xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              className="text-xs font-bold gap-1.5 border-border hover:border-accent"
            >
              <Download size={14} />
              Xuất báo cáo
            </Button>
          </>
        }
      />

      {/* Việc cần xử lý: đề xuất của Coach đang chờ Admin duyệt */}
      <AdminWorkQueue />

      {/* 📊 LEVEL 1: 6 PRIMARY KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADMIN_KPIS.map((kpi) => (
          <AdminStatCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* 📈 LEVEL 2: CHARTS & ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 8 COLS: User Growth Chart */}
        <div className="lg:col-span-8 rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-elevated space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp size={18} className="text-accent" />
                Tăng trưởng Người dùng & Hội viên Hoạt động
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Theo dõi số lượng đăng ký mới và người dùng duy trì lịch tập luyện đều đặn.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                <span className="text-text-secondary">Tổng người dùng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-text-secondary">Người dùng hoạt động (MAU)</span>
              </div>
            </div>
          </div>

          {/* Recharts Line Chart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={USER_GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e1" vertical={false} />
                <XAxis dataKey="date" stroke="#6b716b" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b716b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e5e1",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  name="Tổng người dùng"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "hsl(var(--accent))" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  name="Người dùng hoạt động"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#f59e0b" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT 4 COLS: Workout Analytics Donut Chart */}
        <div className="lg:col-span-4 rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-elevated space-y-4">
          <div className="border-b border-border/70 pb-3">
            <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
              <Dumbbell size={18} className="text-accent" />
              Tỉ lệ hoàn thành Phiên tập
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Phân bổ kết quả 8,291 buổi tập trong tháng.</p>
          </div>

          {/* Donut Chart */}
          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Hoàn thành 100%", value: WORKOUT_COMPLETION_STATS.completed, color: "#4F7F61" },
                    { name: "Tập một phần", value: WORKOUT_COMPLETION_STATS.partial, color: "#C28A35" },
                    { name: "Bỏ dở", value: WORKOUT_COMPLETION_STATS.abandoned, color: "#B85C5C" },
                  ]}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#4F7F61" />
                  <Cell fill="#C28A35" />
                  <Cell fill="#B85C5C" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute text-center">
              <div className="text-xl font-black text-text-primary">{WORKOUT_COMPLETION_STATS.completed}%</div>
              <div className="text-[10px] font-bold text-text-secondary uppercase">Hoàn thành</div>
            </div>
          </div>

          {/* Stat Micro Cards */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60 text-center">
            <div className="rounded-xl bg-background/50 p-2 border border-border/60">
              <div className="text-[10px] text-text-secondary font-medium">Thời lượng TB</div>
              <div className="text-xs font-black text-text-primary mt-0.5">{WORKOUT_COMPLETION_STATS.avgDurationMinutes} phút</div>
            </div>
            <div className="rounded-xl bg-background/50 p-2 border border-border/60">
              <div className="text-[10px] text-text-secondary font-medium">Tỉ lệ hoàn tất</div>
              <div className="text-xs font-black text-accent-strong mt-0.5">{WORKOUT_COMPLETION_STATS.avgCompletionRate}%</div>
            </div>
            <div className="rounded-xl bg-background/50 p-2 border border-border/60">
              <div className="text-[10px] text-text-secondary font-medium">Bài tập/buổi</div>
              <div className="text-xs font-black text-text-primary mt-0.5">{WORKOUT_COMPLETION_STATS.avgExercisesPerSession} bài</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 USER GOALS & FITNESS LEVEL DISTRIBUTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Goals Breakdown */}
        <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-elevated space-y-4">
          <div className="border-b border-border/70 pb-3">
            <h3 className="font-display text-base font-bold text-text-primary">
              Mục tiêu luyện tập của Học viên (Goals Distribution)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Dữ liệu từ khảo sát đầu vào và thiết lập hồ sơ.</p>
          </div>

          <div className="space-y-3">
            {USER_GOALS_DATA.map((item) => (
              <div key={item.goal} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-primary">{item.goal}</span>
                  <span className="text-text-secondary">{item.count.toLocaleString()} học viên ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-background overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Fitness Level Breakdown */}
        <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-elevated space-y-4">
          <div className="border-b border-border/70 pb-3">
            <h3 className="font-display text-base font-bold text-text-primary">
              Phân bổ Trình độ Thể lực (Fitness Levels)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Xếp hạng từ thuật toán tính điểm bài kiểm tra đầu vào.</p>
          </div>

          <div className="space-y-3">
            {FITNESS_DISTRIBUTION_DATA.map((item) => (
              <div key={item.name} className="rounded-2xl border border-border/60 bg-background/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">{item.name}</span>
                  <span className="text-xs font-black text-text-primary">{item.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface border border-border/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🤖 LEVEL 3: AI SYSTEM HEALTH MONITOR & RECENT ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: AI System Status Monitor */}
        <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-elevated space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <Bot size={18} className="text-accent" />
                Trạng thái Động cơ AI (AI System Health)
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">Giám sát hiệu năng Pose Detection và phân tích chuyển động.</p>
            </div>

            <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold">
              100% Operational
            </span>
          </div>

          <div className="space-y-3">
            {AI_SYSTEM_HEALTH.map((ai) => (
              <div
                key={ai.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/50 p-3.5 hover:border-border transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-text-primary">{ai.name}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">{ai.description}</p>
                </div>

                <div className="flex items-center gap-3 text-xs shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] text-text-secondary uppercase font-semibold">Độ chính xác</div>
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">{ai.accuracyRate}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-secondary uppercase font-semibold">Độ trễ</div>
                    <div className="text-xs font-black text-text-primary">{ai.latencyMs}ms</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-secondary uppercase font-semibold">Yêu cầu/ngày</div>
                    <div className="text-xs font-black text-accent-strong">{ai.dailyRequests.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT 5 COLS: Recent Activity Feed */}
        <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-elevated space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              Nhật ký Hoạt động Gần đây
            </h3>
            <span className="text-[11px] font-semibold text-text-secondary">Thời gian thực</span>
          </div>

          <div className="space-y-3.5">
            {RECENT_ACTIVITIES.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent font-bold text-xs shadow-2xs mt-0.5">
                  {act.actor.avatarUrl ? (
                    <img src={act.actor.avatarUrl} alt={act.actor.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-text-primary truncate">{act.title}</span>
                    <span className="text-[10px] text-text-secondary shrink-0">{act.relativeTime}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                  {act.badge && (
                    <span className="inline-block rounded bg-surface-elevated border border-border px-1.5 py-0.2 text-[10px] font-bold text-text-secondary mt-1">
                      {act.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
