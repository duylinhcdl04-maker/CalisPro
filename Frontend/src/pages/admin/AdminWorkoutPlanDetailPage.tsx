import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Eye,
  Copy,
  Users,
  Award,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  BarChart3,
  Flame,
  Bot,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { workoutPlansService } from "../../services/mock/workoutPlansService";
import { useWorkoutPlanScope } from "../../features/workout-plans/useWorkoutPlanScope";
import { programTemplatesApi } from "../../features/workout-plans/api/programTemplatesApi";
import { WorkoutPlan, WorkoutPlanAnalytics } from "../../types/workoutPlan";
import { AdminStatCard } from "../../components/admin/shared/AdminStatCard";

export default function AdminWorkoutPlanDetailPage() {
  const { base, isCoach } = useWorkoutPlanScope();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  async function changeStatus(status: "PUBLISHED" | "ARCHIVED") {
    if (!plan) return;
    if (status === "ARCHIVED" && !confirm("Lưu trữ giáo án này? Học viên đang tập giữ nguyên phiên bản hiện tại, giáo án không còn được gán cho học viên mới.")) return;
    try {
      setStatusBusy(true);
      if (status === "PUBLISHED") await workoutPlansService.publishWorkoutPlan(plan.id);
      else await programTemplatesApi.setStatus(plan.id, "ARCHIVED");
      setPlan(await workoutPlansService.getWorkoutPlanById(plan.id));
      toast.success(status === "PUBLISHED" ? "Đã xuất bản giáo án" : "Đã lưu trữ giáo án");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đổi được trạng thái giáo án");
    } finally {
      setStatusBusy(false);
    }
  }
  const [analytics, setAnalytics] = useState<WorkoutPlanAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"structure" | "analytics" | "users" | "progression">("structure");
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({ "w-1": true });

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const p = await workoutPlansService.getWorkoutPlanById(id);
        const a = await workoutPlansService.getWorkoutPlanAnalytics(id);
        setPlan(p);
        setAnalytics(a);
      } catch {
        toast.error("Không thể tải thông tin chi tiết giáo án");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-text-secondary">Đang tải dữ liệu giáo án...</div>;
  }

  if (!plan) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-base font-bold text-text-primary">Không tìm thấy giáo án</h2>
        <Link to={base} className="text-xs text-accent-strong hover:underline">
          ← Quay lại danh sách giáo án
        </Link>
      </div>
    );
  }

  const COLORS = ["#4F7F61", "#C28A35", "#547A9A"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link
            to={base}
            className="rounded-xl border border-border bg-surface p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-text-primary">{plan.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  plan.status === "PUBLISHED"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                }`}
              >
                {plan.status === "PUBLISHED" ? "Đang xuất bản" : plan.status === "ARCHIVED" ? "Lưu trữ" : "Bản nháp"}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Tác giả: <span className="font-bold text-text-primary">{plan.createdBy}</span> • Phiên bản: v{plan.version} • Cập nhật: {new Date(plan.updatedAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={`${base}/${plan.id}/preview`}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <Eye size={14} /> Xem trước
          </Link>
          {!isCoach && plan.status !== "PUBLISHED" && plan.status !== "ARCHIVED" && (
            <button
              type="button"
              disabled={statusBusy}
              onClick={() => changeStatus("PUBLISHED")}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
            >
              Duyệt & Xuất bản
            </button>
          )}
          {!isCoach && plan.status !== "ARCHIVED" && (
            <button
              type="button"
              disabled={statusBusy}
              onClick={() => changeStatus("ARCHIVED")}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-60 cursor-pointer"
            >
              Lưu trữ
            </button>
          )}
          <Link
            to={`${base}/${plan.id}/edit`}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong transition-colors shadow-xs"
          >
            <Edit size={14} /> Chỉnh sửa Giáo án
          </Link>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          kpi={{
            id: "enrolled_users",
            label: "Học viên đang học",
            value: (analytics?.totalEnrolled || plan.assignedUsersCount).toLocaleString(),
            change: "+12.4%",
            trend: "up",
            comparisonPeriod: "so với tháng trước",
            iconName: "Users",
            category: "users",
          }}
        />
        <AdminStatCard
          kpi={{
            id: "completion_rate",
            label: "Tỉ lệ hoàn thành",
            value: `${analytics?.avgCompletionRate || plan.completionRate}%`,
            change: "+4.2%",
            trend: "up",
            comparisonPeriod: "toàn khóa",
            iconName: "CheckCircle2",
            category: "workouts",
          }}
        />
        <AdminStatCard
          kpi={{
            id: "duration",
            label: "Thời lượng buổi tập",
            value: `~${plan.sessionDurationMinutes} phút`,
            change: "Tối ưu",
            trend: "neutral",
            comparisonPeriod: `${plan.frequencyDaysPerWeek} buổi / tuần`,
            iconName: "Dumbbell",
            category: "workouts",
          }}
        />
        <AdminStatCard
          kpi={{
            id: "rating",
            label: "Đánh giá từ Học viên",
            value: `${plan.averageRating || 4.9} ★`,
            change: "+0.2",
            trend: "up",
            comparisonPeriod: "từ học viên",
            iconName: "CreditCard",
            category: "business",
          }}
        />
      </div>

      {/* 3. TABS BAR */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("structure")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "structure"
              ? "border-accent text-accent-strong"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Layers size={14} /> Cấu trúc Giáo án ({plan.weeks.length} Tuần)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "border-accent text-accent-strong"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <BarChart3 size={14} /> Phân tích Hiệu suất & Drop-off
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("progression")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "progression"
              ? "border-accent text-accent-strong"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <TrendingUp size={14} /> Quá tải Luỹ tiến (Progressive Overload)
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      {activeTab === "structure" && (
        <div className="space-y-4">
          {plan.weeks.map((week) => {
            const isExpanded = expandedWeeks[week.id] ?? true;
            return (
              <div key={week.id} className="rounded-3xl border border-border bg-surface overflow-hidden shadow-xs">
                {/* Week Header Toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedWeeks({ ...expandedWeeks, [week.id]: !isExpanded })}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-elevated transition-colors cursor-pointer border-b border-border/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-accent px-2.5 py-1 text-xs font-black text-white">
                      Tuần {week.weekNumber}
                    </span>
                    <div>
                      <div className="text-sm font-black text-text-primary">{week.title}</div>
                      <div className="text-xs text-text-secondary">{week.objective}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong">
                      {week.days.length} Buổi tập
                    </span>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                {/* Days inside Week */}
                {isExpanded && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-background/50">
                    {week.days.map((day) => (
                      <div key={day.id} className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-border/70 pb-2">
                          <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-black text-accent-strong">
                            {day.dayOfWeekTitle}
                          </span>
                          <span className="text-[11px] text-text-secondary font-bold">~{day.estimatedDurationMinutes}p</span>
                        </div>

                        <div>
                          <div className="text-xs font-black text-text-primary">{day.name}</div>
                          <div className="text-[11px] text-text-secondary">Tiêu điểm: {day.focus}</div>
                        </div>

                        {/* Sections & Exercises */}
                        <div className="space-y-2 pt-1 border-t border-border/50">
                          {day.sections.map((sec) => (
                            <div key={sec.id} className="space-y-1">
                              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                                {sec.name}
                              </div>
                              <div className="space-y-1">
                                {sec.exercises.map((ex) => (
                                  <div
                                    key={ex.id}
                                    className="flex items-center justify-between rounded-lg bg-surface-elevated px-2 py-1.5 text-[11px]"
                                  >
                                    <span className="font-bold text-text-primary truncate">{ex.exerciseName}</span>
                                    <span className="font-mono text-accent-strong font-bold shrink-0">
                                      {ex.sets} × {ex.reps}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. TAB ANALYTICS */}
      {activeTab === "analytics" && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-4 lg:col-span-2">
            <div>
              <h3 className="text-sm font-black text-text-primary">Tiến độ hoàn thành qua các tuần (Weekly Retention)</h3>
              <p className="text-xs text-text-secondary">Số lượng học viên hoàn thành các tuần tập luyện.</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyProgressData}>
                  <defs>
                    <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F7F61" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4F7F61" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="#929792" fontSize={11} />
                  <YAxis stroke="#929792" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="completedUsers" stroke="#4F7F61" strokeWidth={2} fill="url(#compGrad)" name="Học viên hoàn thành" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-text-primary">Phân bổ Cấp độ Học viên</h3>
              <p className="text-xs text-text-secondary">Tỉ lệ học viên theo trình độ thể lực.</p>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.levelDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {analytics.levelDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB PROGRESSION */}
      {activeTab === "progression" && (
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-text-primary">Mô hình Quá tải Luỹ tiến (Progressive Overload Scheme)</h3>
            <p className="text-xs text-text-secondary">Lộ trình biến thiên thể tích, cường độ và biến thể động tác.</p>
          </div>

          <div className="space-y-3">
            {plan.weeks.map((w) => (
              <div key={w.id} className="flex items-start gap-4 rounded-2xl border border-border bg-background p-4">
                <span className="rounded-xl bg-accent px-2.5 py-1 text-xs font-black text-white shrink-0">
                  Tuần {w.weekNumber}
                </span>
                <div className="space-y-1">
                  <div className="text-xs font-black text-text-primary">{w.title}</div>
                  <div className="text-xs text-accent-strong font-semibold">
                    🎯 Mục tiêu: {w.progressionTarget.targetDescription}
                  </div>
                  <div className="text-[11px] text-text-secondary">💡 Lời khuyên Coach: {w.coachNotes || "Duy trì biên độ chuẩn."}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
