import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Eye,
  Edit,
  Copy,
  Archive,
  Trash2,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  Flame,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { AdminStatCard } from "../../components/admin/shared/AdminStatCard";
import { workoutPlansService } from "../../services/mock/workoutPlansService";
import { useWorkoutPlanScope } from "../../features/workout-plans/useWorkoutPlanScope";
import { WorkoutPlan, FitnessGoal, FitnessLevel, ProgramStatus } from "../../types/workoutPlan";
import { AIWorkoutPlanGeneratorModal } from "../../features/workout-plans/components/AIWorkoutPlanGeneratorModal";

export default function AdminWorkoutPlansListPage() {
  const { base, isCoach } = useWorkoutPlanScope();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<FitnessGoal | "ALL">("ALL");
  const [levelFilter, setLevelFilter] = useState<FitnessLevel | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "ALL">("ALL");

  async function loadPlans() {
    setIsLoading(true);
    try {
      const data = await workoutPlansService.getWorkoutPlans({
        searchQuery: search,
        goal: goalFilter,
        fitnessLevel: levelFilter,
        status: statusFilter,
      });
      setPlans(data);
    } catch {
      toast.error("Không thể tải danh sách giáo án");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, [search, goalFilter, levelFilter, statusFilter]);

  async function handleDuplicate(id: string, name: string) {
    try {
      const copy = await workoutPlansService.duplicateWorkoutPlan(id);
      toast.success(`Đã nhân bản giáo án "${name}"`);
      loadPlans();
    } catch {
      toast.error("Không thể nhân bản giáo án");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa giáo án "${name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await workoutPlansService.deleteWorkoutPlan(id);
      toast.success(`Đã xóa giáo án "${name}"`);
      loadPlans();
    } catch {
      toast.error("Không thể xóa giáo án");
    }
  }

  // Summary Metrics
  const totalAssignedUsers = plans.reduce((acc, p) => acc + p.assignedUsersCount, 0);
  const avgCompletion = plans.length > 0 ? (plans.reduce((acc, p) => acc + p.completionRate, 0) / plans.length).toFixed(1) : "0";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Quản lý Giáo án & Lộ trình Tập luyện"
        description="Thiết kế, tinh chỉnh và xuất bản các chương trình tập Calisthenics đa tuần từ cơ bản đến kỹ năng đỉnh cao."
        badge={`${plans.length} Giáo án`}
        actions={
          <div className="flex items-center gap-2">
            {!isCoach && (
<button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles size={14} />
              <span>✨ AI Thiết Kế Giáo Án</span>
            </button>
)}
            {isCoach && (
<button
              type="button"
              onClick={() => navigate(`${base}/new`)}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Tạo Giáo án mới
            </button>
)}
          </div>
        }
      />

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          kpi={{
            id: "total_plans",
            label: "Tổng số Giáo án",
            value: plans.length.toString(),
            change: "+2 giáo án mới",
            trend: "up",
            comparisonPeriod: "tháng này",
            iconName: "Dumbbell",
            category: "workouts",
          }}
        />
        <AdminStatCard
          kpi={{
            id: "active_trainees",
            label: "Học viên đang theo học",
            value: totalAssignedUsers.toLocaleString(),
            change: "+14.2%",
            trend: "up",
            comparisonPeriod: "so với tháng trước",
            iconName: "Users",
            category: "users",
          }}
        />
        <AdminStatCard
          kpi={{
            id: "completion_rate",
            label: "Tỉ lệ hoàn thành trung bình",
            value: `${avgCompletion}%`,
            change: "+5.1%",
            trend: "up",
            comparisonPeriod: "toàn khóa",
            iconName: "CheckCircle2",
            category: "workouts",
          }}
        />
        <AdminStatCard
          kpi={{
            id: "ai_plans",
            label: "AI Adaptive Engine",
            value: "100%",
            change: "Live",
            trend: "up",
            comparisonPeriod: "Tự động cân bằng thể lực",
            iconName: "Bot",
            category: "ai",
          }}
        />
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên giáo án, tác giả, mô tả..."
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Quick Clear */}
          {(goalFilter !== "ALL" || levelFilter !== "ALL" || statusFilter !== "ALL" || search) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setGoalFilter("ALL");
                setLevelFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs font-bold text-accent-strong hover:underline self-end md:self-auto cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Dropdowns Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
          {/* Goal Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-text-secondary">Mục tiêu:</span>
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value as any)}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">Tất cả mục tiêu</option>
              <option value="Strength">Sức mạnh (Strength)</option>
              <option value="Muscle Gain">Tăng cơ (Hypertrophy)</option>
              <option value="Calisthenics Skills">Kỹ năng Calisthenics</option>
              <option value="Weight Management">Giảm mỡ & Thể lực</option>
              <option value="General Fitness">Thể chất chung</option>
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-text-secondary">Cấp độ:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">Mọi cấp độ</option>
              <option value="Foundation">L0 · Foundation (Nền tảng)</option>
              <option value="Beginner">L1 · Beginner (Cơ bản)</option>
              <option value="Intermediate">L2 · Intermediate (Trung cấp)</option>
              <option value="Advanced">L3 · Advanced (Nâng cao)</option>
              <option value="Elite">L4 · Elite</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-text-secondary">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đã xuất bản (Published)</option>
              <option value="DRAFT">Bản nháp (Draft)</option>
              <option value="ARCHIVED">Lưu trữ (Archived)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Workout Plans Data Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-text-secondary">Đang tải danh sách giáo án...</div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen size={40} className="mx-auto text-text-secondary/50" />
            <h3 className="text-base font-bold text-text-primary">Chưa có giáo án nào</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Bắt đầu tạo giáo án luyện tập nhiều tuần đầu tiên để phân phối cho học viên.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              {!isCoach && (
<button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold text-accent hover:bg-accent/20 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>✨ AI Thiết Kế Giáo Án</span>
              </button>
)}
              {isCoach && (
<button
                type="button"
                onClick={() => navigate(`${base}/new`)}
                className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs transition-all"
              >
                Tạo Thủ Công
              </button>
)}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-elevated text-text-secondary font-bold">
                <tr>
                  <th className="p-3.5">Tên Giáo án & Lộ trình</th>
                  <th className="p-3.5">Mục tiêu & Cấp độ</th>
                  <th className="p-3.5">Thời lượng</th>
                  <th className="p-3.5">Học viên</th>
                  <th className="p-3.5">Tỉ lệ hoàn thành</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-elevated/50 transition-colors">
                    {/* Name + Thumbnail */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.thumbnailUrl || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80"}
                          alt={p.name}
                          className="h-11 w-16 rounded-xl object-cover border border-border"
                        />
                        <div className="space-y-0.5">
                          <Link
                            to={`${base}/${p.id}`}
                            className="font-bold text-text-primary hover:text-accent-strong transition-colors line-clamp-1"
                          >
                            {p.name}
                          </Link>
                          <div className="text-[11px] text-text-secondary flex items-center gap-2">
                            <span>Tác giả: {p.createdBy}</span>
                            <span>•</span>
                            <span className="font-mono">v{p.version}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Goal & Level */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <span className="inline-block rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong border border-accent/20">
                          {p.primaryGoal}
                        </span>
                        <div className="text-[11px] text-text-secondary font-medium">
                          Cấp độ: <span className="text-text-primary font-bold">{p.fitnessLevel}</span>
                        </div>
                      </div>
                    </td>

                    {/* Duration & Frequency */}
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="font-bold text-text-primary">{p.durationWeeks} Tuần</div>
                        <div className="text-[11px] text-text-secondary">{p.frequencyDaysPerWeek} buổi / tuần</div>
                      </div>
                    </td>

                    {/* Assigned Users */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-bold text-text-primary">
                        <Users size={13} className="text-accent-strong" />
                        <span>{p.assignedUsersCount.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Completion Rate */}
                    <td className="p-3.5">
                      <div className="space-y-1 w-24">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>{p.completionRate}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden border border-border">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${p.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-2xs ${
                          p.status === "PUBLISHED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                            : p.status === "DRAFT"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                            : "bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30"
                        }`}
                      >
                        {p.status === "PUBLISHED" ? "Đã Xuất Bản" : p.status === "DRAFT" ? "Bản Nháp" : "Lưu Trữ"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`${base}/${p.id}`}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                          title="Xem chi tiết & Thống kê"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          to={`${base}/${p.id}/edit`}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-accent-strong transition-colors"
                          title="Trình dựng Giáo án (Visual Builder)"
                        >
                          <Edit size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(p.id, p.name)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors cursor-pointer"
                          title="Nhân bản giáo án"
                        >
                          <Copy size={15} />
                        </button>
                        {!isCoach && (
<button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Xóa giáo án"
                        >
                          <Trash2 size={15} />
                        </button>
)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Workout Plan Generator Modal */}
      <AIWorkoutPlanGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        existingPlanNames={plans.map((p) => p.name)}
        onApplyPlan={async (generatedPlan) => {
          await workoutPlansService.createWorkoutPlan({
            name: generatedPlan.planTitle,
            description: generatedPlan.description,
            primaryGoal: "Strength",
            fitnessLevel: "Intermediate",
            durationWeeks: 8,
            frequencyDaysPerWeek: 4,
            sessionDurationMinutes: 45,
            equipmentRequired: ["Xà đơn", "Xà kép", "Bodyweight"],
            programType: "Structured Program",
            status: "PUBLISHED",
            version: "1.0",
            assignedUsersCount: 0,
            completionRate: 0,
            averageRating: 5.0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "AI Gemini Coach",
            weeks: [],
          });
          loadPlans();
        }}
      />
    </div>
  );
}
