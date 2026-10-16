import { useState } from "react";
import {
  Trash2,
  Edit2,
  CheckCircle2,
  Activity,
  Flame,
  Plus,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  MuscleTarget,
  CalisHealthMuscle,
  MuscleRole,
} from "../../types/exercise";
import { findCatalogMuscle } from "./bodyMusclesAdapter";
import { MuscleDetailsPanel } from "./MuscleDetailsPanel";
import { MusclePickerPanel } from "./MusclePickerPanel";

interface SelectedMuscleListProps {
  targets: MuscleTarget[];
  onUpdateTarget: (target: MuscleTarget) => void;
  onRemoveTarget: (muscleId: string) => void;
  onOpenSelector?: () => void;
}

export function SelectedMuscleList({
  targets,
  onUpdateTarget,
  onRemoveTarget,
  onOpenSelector,
}: SelectedMuscleListProps) {
  const [editingMuscle, setEditingMuscle] = useState<{
    muscle: CalisHealthMuscle;
    target?: MuscleTarget;
  } | null>(null);

  // Nhóm vai trò đang mở bảng chọn cơ ("+ Thêm cơ")
  const [pickerRole, setPickerRole] = useState<MuscleRole | null>(null);

  function handlePickMuscle(muscle: CalisHealthMuscle, role: MuscleRole, existing?: MuscleTarget) {
    if (existing) {
      // Cơ đã chọn ở nhóm khác -> chuyển vai trò, giữ nguyên cấu hình còn lại
      onUpdateTarget({ ...existing, role });
      return;
    }
    onUpdateTarget({
      muscleId: muscle.id,
      role,
      activationLevel: role === "PRIMARY" ? "HIGH" : "MODERATE",
      laterality: "BILATERAL",
      expectedSensations: role === "STABILIZER" ? ["STABILIZATION_EFFORT"] : ["MUSCLE_TENSION"],
      unexpectedSensations: ["SHARP_PAIN", "JOINT_PAIN"],
      userGuidance:
        role === "STABILIZER"
          ? `Giữ ${muscle.nameVi.toLowerCase()} gồng ổn định suốt chuyển động.`
          : `Cảm nhận ${muscle.nameVi.toLowerCase()} co thắt và kiểm soát trong suốt bài tập.`,
    });
  }

  const primaryTargets = targets.filter((t) => t.role === "PRIMARY");
  const secondaryTargets = targets.filter((t) => t.role === "SECONDARY");
  const stabilizerTargets = targets.filter((t) => t.role === "STABILIZER");

  function getMuscleMeta(muscleId: string) {
    return findCatalogMuscle(muscleId);
  }

  function renderGroup(title: string, role: MuscleRole, groupTargets: MuscleTarget[], badgeColor: string) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${badgeColor}`} />
            <span className="text-xs font-black uppercase text-text-primary tracking-wider">
              {title} ({groupTargets.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPickerRole(pickerRole === role ? null : role)}
            aria-expanded={pickerRole === role}
            className={`flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
              pickerRole === role
                ? "border-accent bg-accent text-white"
                : "border-accent/30 bg-accent/5 text-accent hover:bg-accent/10"
            }`}
          >
            <Plus size={12} /> Thêm cơ
          </button>
        </div>

        {pickerRole === role && (
          <MusclePickerPanel
            role={role}
            targets={targets}
            onPick={(muscle, existing) => handlePickMuscle(muscle, role, existing)}
            onClose={() => setPickerRole(null)}
          />
        )}

        {groupTargets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-3 text-center text-xs text-text-secondary italic">
            Chưa có cơ nào. Bấm <span className="font-bold not-italic text-accent">+ Thêm cơ</span> hoặc chọn trực tiếp trên sơ đồ.
          </div>
        ) : (
          <div className="space-y-2">
            {groupTargets.map((target) => {
              const muscle = getMuscleMeta(target.muscleId);
              // Cơ không có trong catalog: vẫn hiển thị để admin thấy & xóa được (trước đây bị ẩn nhưng vẫn được đếm)
              if (!muscle) {
                return (
                  <div
                    key={target.muscleId}
                    className="flex items-center justify-between rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-text-primary">{target.muscleId}</span>
                      <p className="text-[11px] text-amber-600">Không có trong danh mục cơ – hãy xóa và chọn lại trên sơ đồ.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveTarget(target.muscleId)}
                      className="rounded-xl p-1.5 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                      title="Xóa nhóm cơ"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={target.muscleId}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 shadow-xs hover:border-accent/40 transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-text-primary">{muscle.nameVi}</span>
                      <span className="rounded-md bg-surface-elevated px-1.5 py-0.5 text-[9px] font-mono font-bold text-text-secondary border border-border">
                        {target.laterality}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                      <span>{muscle.name}</span>
                      <span>•</span>
                      <span className="font-bold text-accent">{target.activationLevel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingMuscle({ muscle, target })}
                      className="rounded-xl p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-accent cursor-pointer"
                      title="Chỉnh sửa chi tiết & cảm giác cơ"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveTarget(target.muscleId)}
                      className="rounded-xl p-1.5 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                      title="Xóa nhóm cơ"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {renderGroup("Cơ phát lực chính (Primary)", "PRIMARY", primaryTargets, "bg-rose-600")}
      {renderGroup("Cơ bổ trợ lực (Secondary)", "SECONDARY", secondaryTargets, "bg-amber-500")}
      {renderGroup("Cơ ổn định khớp (Stabilizers)", "STABILIZER", stabilizerTargets, "bg-emerald-500")}

      {/* Edit modal */}
      {editingMuscle && (
        <MuscleDetailsPanel
          muscle={editingMuscle.muscle}
          initialTarget={editingMuscle.target}
          onSave={onUpdateTarget}
          onClose={() => setEditingMuscle(null)}
        />
      )}
    </div>
  );
}
