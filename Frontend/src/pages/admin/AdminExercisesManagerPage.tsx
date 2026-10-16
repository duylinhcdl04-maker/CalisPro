import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useExerciseBasePath } from "../../features/exercises/useExerciseBasePath";
import {
  Dumbbell,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Play,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { workoutPlansService } from "../../services/mock/workoutPlansService";
import { ExerciseItem, FitnessLevel } from "../../types/workoutPlan";
import { ExerciseDetailModal } from "../../components/admin/exercise-builder/ExerciseDetailModal";
import { ExerciseRevisionPanel } from "../../components/admin/exercise-builder/ExerciseRevisionPanel";

export default function AdminExercisesManagerPage() {
  const { base, isCoach } = useExerciseBasePath();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Partial<ExerciseItem> | null>(null);

  async function loadExercises() {
    setIsLoading(true);
    try {
      const data = await workoutPlansService.getExerciseLibrary({
        category: categoryFilter,
        difficulty: difficultyFilter,
        search,
      });
      setExercises(data);
    } catch (err) {
      toast.error("Không thể tải thư viện bài tập");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadExercises();
  }, [categoryFilter, difficultyFilter, search]);

  function handleOpenCreate() {
    navigate(`${base}/new`);
  }

  function handleOpenEdit(ex: ExerciseItem) {
    navigate(`${base}/${ex.id}/edit`);
  }

  async function handleSaveExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExercise?.name?.trim()) {
      toast.error("Vui lòng nhập tên động tác");
      return;
    }

    try {
      if (editingExercise.id) {
        await workoutPlansService.updateExercise(editingExercise.id, editingExercise);
        toast.success(`Đã cập nhật bài tập "${editingExercise.name}"`);
      } else {
        await workoutPlansService.createExercise(editingExercise);
        toast.success(`Đã thêm mới bài tập "${editingExercise.name}"`);
      }
      setIsEditModalOpen(false);
      loadExercises();
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu bài tập");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài tập "${name}"?`)) return;
    try {
      await workoutPlansService.deleteExercise(id);
      toast.success(`Đã xóa bài tập "${name}"`);
      loadExercises();
    } catch {
      toast.error("Không thể xóa bài tập");
    }
  }

  const CATEGORIES = ["ALL", "Push", "Pull", "Core", "Legs", "Skill"];
  const DIFFICULTIES = ["ALL", "Beginner", "Intermediate", "Advanced"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <AdminPageHeader
        title="Thư viện Động tác Calisthenics"
        description="Quản lý toàn bộ ngân hàng động tác, quy chuẩn giải phẫu cơ bắp, chuỗi tiến trình và AI Landmark rules."
        badge={`${exercises.length} Động tác`}
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} /> Thêm Động tác mới
          </button>
        }
      />

      <ExerciseRevisionPanel admin={!isCoach} />

      {/* 2. Filter & Controls Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên động tác, tên tiếng Việt, nhóm cơ..."
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex rounded-xl border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-surface shadow-xs text-accent-strong font-bold" : "text-text-secondary hover:text-text-primary"
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-surface shadow-xs text-accent-strong font-bold" : "text-text-secondary hover:text-text-primary"
                }`}
                title="Dạng bảng"
              >
                <TableIcon size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Category & Difficulty Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-text-secondary mr-1">Nhóm bài:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-accent text-white shadow-xs font-bold"
                    : "bg-background text-text-secondary hover:bg-surface-elevated hover:text-text-primary border border-border/60"
                }`}
              >
                {cat === "ALL" ? "Tất cả" : cat}
              </button>
            ))}
          </div>

          {/* Difficulty */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-text-secondary mr-1">Cấp độ:</span>
            {DIFFICULTIES.map((dif) => (
              <button
                key={dif}
                type="button"
                onClick={() => setDifficultyFilter(dif)}
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  difficultyFilter === dif
                    ? "bg-text-primary text-background font-bold shadow-xs"
                    : "bg-background text-text-secondary hover:bg-surface-elevated hover:text-text-primary border border-border/60"
                }`}
              >
                {dif === "ALL" ? "Mọi cấp độ" : dif}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Exercises View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-surface animate-pulse border border-border" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center space-y-3">
          <Dumbbell size={40} className="mx-auto text-text-secondary/50" />
          <h3 className="text-base font-bold text-text-primary">Chưa có bài tập nào trong thư viện</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {search || categoryFilter !== "ALL" || difficultyFilter !== "ALL"
              ? "Không tìm thấy bài tập phù hợp với bộ lọc hiện tại."
              : "Bắt đầu tạo bài tập mới với video/hình ảnh hoặc sử dụng công cụ AI để sinh tự động."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs transition-all"
            >
              <Plus size={14} />
              <span>Tạo Bài Tập Ngay</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="group rounded-2xl border border-border bg-surface overflow-hidden shadow-xs hover:border-accent/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Media Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-surface-elevated">
                <img
                  src={ex.imageUrl}
                  alt={ex.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="rounded-lg bg-surface/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-extrabold text-text-primary border border-border shadow-xs">
                    {ex.category}
                  </span>

                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold shadow-xs ${
                      ex.difficulty === "Beginner"
                        ? "bg-emerald-500 text-white"
                        : ex.difficulty === "Intermediate"
                        ? "bg-amber-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {ex.difficulty}
                  </span>
                </div>

                {/* Bottom Title on Thumbnail */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <div className="text-sm font-black text-white leading-tight">{ex.name}</div>
                  <div className="text-[11px] text-white/80 font-medium">{ex.vietnameseName}</div>
                </div>
              </div>

              {/* Body details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                    <Layers size={12} className="text-accent-strong shrink-0" />
                    <span className="font-semibold text-text-primary">{ex.movementPattern}</span>
                  </div>

                  {/* Muscle Badges */}
                  <div className="flex flex-wrap gap-1">
                    {ex.primaryMuscles.map((m, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-accent-soft/40 px-1.5 py-0.5 text-[10px] font-bold text-accent-strong border border-accent/20"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2">{ex.description || "Chưa có mô tả kỹ thuật chi tiết."}</p>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExercise(ex);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-accent-strong hover:underline cursor-pointer"
                  >
                    <Eye size={13} />
                    Xem chi tiết & AI
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ex)}
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ex.id, ex.name)}
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-elevated text-text-secondary font-bold">
                <tr>
                  <th className="p-3.5">Động tác</th>
                  <th className="p-3.5">Phân loại</th>
                  <th className="p-3.5">Cấp độ</th>
                  <th className="p-3.5">Cơ chính</th>
                  <th className="p-3.5">Dụng cụ</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exercises.map((ex) => (
                  <tr key={ex.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img src={ex.imageUrl} alt={ex.name} className="h-10 w-14 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold text-text-primary">{ex.name}</div>
                          <div className="text-[11px] text-text-secondary">{ex.vietnameseName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="rounded-lg bg-surface-elevated border border-border px-2 py-0.5 font-bold text-text-primary">
                        {ex.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                          ex.difficulty === "Beginner"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : ex.difficulty === "Intermediate"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {ex.difficulty}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {ex.primaryMuscles.map((m, idx) => (
                          <span key={idx} className="rounded bg-accent-soft px-1.5 py-0.2 text-[10px] font-semibold text-accent-strong">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-text-secondary">{ex.equipment}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExercise(ex);
                            setIsDetailModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-accent-strong hover:bg-accent-soft transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ex)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ex.id, ex.name)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL: XEM CHI TIẾT & AI POSE LANDMARK PREVIEW */}
      {isDetailModalOpen && selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          allExercises={exercises}
          onClose={() => setIsDetailModalOpen(false)}
          onEdit={(ex) => {
            setIsDetailModalOpen(false);
            handleOpenEdit(ex);
          }}
          onSelectExercise={setSelectedExercise}
        />
      )}

      {/* 5. MODAL: THÊM MỚI / CHỈNH SỬA ĐỘNG TÁC */}
      {isEditModalOpen && editingExercise && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-6 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-black text-text-primary">
                {editingExercise.id ? `Chỉnh sửa: ${editingExercise.name}` : "Thêm mới Động tác Calisthenics"}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-primary">Tên động tác (Tiếng Anh) *</label>
                  <input
                    type="text"
                    required
                    value={editingExercise.name || ""}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                    placeholder="e.g. Archer Push Up"
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-primary">Tên tiếng Việt *</label>
                  <input
                    type="text"
                    required
                    value={editingExercise.vietnameseName || ""}
                    onChange={(e) => setEditingExercise({ ...editingExercise, vietnameseName: e.target.value })}
                    placeholder="e.g. Hít đất cung thủ"
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-primary">Nhóm bài</label>
                  <select
                    value={editingExercise.category}
                    onChange={(e) => setEditingExercise({ ...editingExercise, category: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="Push">Push (Đẩy)</option>
                    <option value="Pull">Pull (Kéo)</option>
                    <option value="Core">Core (Cơ bụng)</option>
                    <option value="Legs">Legs (Chân mông)</option>
                    <option value="Skill">Skill (Kỹ năng)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-primary">Cấp độ</label>
                  <select
                    value={editingExercise.difficulty}
                    onChange={(e) => setEditingExercise({ ...editingExercise, difficulty: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="Beginner">Beginner (Cơ bản)</option>
                    <option value="Intermediate">Intermediate (Trung cấp)</option>
                    <option value="Advanced">Advanced (Nâng cao)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-primary">Dụng cụ</label>
                  <input
                    type="text"
                    value={editingExercise.equipment || ""}
                    onChange={(e) => setEditingExercise({ ...editingExercise, equipment: e.target.value })}
                    placeholder="e.g. Không dụng cụ"
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">URL Hình ảnh / Demo</label>
                <input
                  type="url"
                  value={editingExercise.imageUrl || ""}
                  onChange={(e) => setEditingExercise({ ...editingExercise, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Mô tả kỹ thuật</label>
                <textarea
                  rows={3}
                  value={editingExercise.description || ""}
                  onChange={(e) => setEditingExercise({ ...editingExercise, description: e.target.value })}
                  placeholder="Mô tả tác dụng của bài tập và cách thức thực hiện..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
                >
                  Lưu bài tập
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
