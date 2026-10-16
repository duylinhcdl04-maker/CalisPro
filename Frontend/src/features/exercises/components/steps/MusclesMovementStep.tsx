import { useEffect, useState } from "react";
import { Activity, Plus, Sparkles, Layers, Info, Image as ImageIcon, User } from "lucide-react";
import {
  ExerciseFormData,
  MuscleTarget,
  CalisHealthMuscle,
} from "../../types/exercise";
import { AnatomySelector } from "../anatomy/AnatomySelector";
import { SelectedMuscleList } from "../anatomy/SelectedMuscleList";
import { MuscleDetailsPanel } from "../anatomy/MuscleDetailsPanel";
import { MuscleImpactImageUploader } from "../anatomy/MuscleImpactImageUploader";
import { CALISHEALTH_MUSCLE_CATALOG, normalizeMuscleTargets } from "../anatomy/bodyMusclesAdapter";

interface MusclesMovementStepProps {
  formData: ExerciseFormData;
  onChange: (updated: Partial<ExerciseFormData>) => void;
}

export function MusclesMovementStep({ formData, onChange }: MusclesMovementStepProps) {
  const [activeConfigureMuscle, setActiveConfigureMuscle] = useState<CalisHealthMuscle | null>(null);
  const [displayMode, setDisplayMode] = useState<"SPLIT" | "ANATOMY" | "IMAGE">("SPLIT");

  const targets = formData.muscles.targets;

  // Dữ liệu cũ / do AI sinh có thể dùng mã cơ dạng "pectoralis_major" thay vì id catalog
  // "muscle_pectoralis_major" -> cơ bị ẩn khỏi sơ đồ & danh sách và có thể bị chọn trùng. Chuẩn hóa 1 lần.
  useEffect(() => {
    const normalized = normalizeMuscleTargets(targets);
    const changed = normalized.length !== targets.length || normalized.some((t, i) => t.muscleId !== targets[i].muscleId);
    if (changed) {
      onChange({ muscles: { targets: normalized } as ExerciseFormData["muscles"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets]);
  const anatomyImages = formData.muscles.anatomyImages;
  const anatomyImageUrl = formData.muscles.anatomyImageUrl;
  const anatomyImageCaption = formData.muscles.anatomyImageCaption;

  function handleSelectMuscleFromAnatomy(muscle: CalisHealthMuscle) {
    const existing = targets.find((t) => t.muscleId === muscle.id);
    if (existing) {
      // Open configure dialog for existing
      setActiveConfigureMuscle(muscle);
    } else {
      // Add default target and open configure
      const newTarget: MuscleTarget = {
        muscleId: muscle.id,
        role: targets.length === 0 ? "PRIMARY" : "SECONDARY",
        activationLevel: "HIGH",
        laterality: "BILATERAL",
        expectedSensations: ["MUSCLE_TENSION", "STRETCH"],
        unexpectedSensations: ["SHARP_PAIN", "JOINT_PAIN"],
        userGuidance: `Cảm nhận ${muscle.nameVi.toLowerCase()} co thắt và kiểm soát trong suốt bài tập.`,
      };
      onChange({
        muscles: { targets: [...targets, newTarget] } as ExerciseFormData["muscles"],
      });
      setActiveConfigureMuscle(muscle);
    }
  }

  function handleUpdateTarget(updatedTarget: MuscleTarget) {
    const exists = targets.some((t) => t.muscleId === updatedTarget.muscleId);
    let newTargets: MuscleTarget[];
    if (exists) {
      newTargets = targets.map((t) => (t.muscleId === updatedTarget.muscleId ? updatedTarget : t));
    } else {
      newTargets = [...targets, updatedTarget];
    }
    onChange({
      muscles: { targets: newTargets } as ExerciseFormData["muscles"],
    });
  }

  function handleRemoveTarget(muscleId: string) {
    onChange({
      muscles: { targets: targets.filter((t) => t.muscleId !== muscleId) } as ExerciseFormData["muscles"],
    });
  }

  function handleImageChange(data: {
    anatomyImages: import("../../types/exercise").MuscleImpactImage[];
    anatomyImageUrl: string;
    anatomyImageCaption: string;
  }) {
    // Chỉ gửi phần thay đổi: upload ảnh là bất đồng bộ, formData lúc này có thể đã cũ
    onChange({
      muscles: {
        anatomyImages: data.anatomyImages,
        anatomyImageUrl: data.anatomyImageUrl,
        anatomyImageCaption: data.anatomyImageCaption,
      } as ExerciseFormData["muscles"],
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <Activity size={18} />
              <span className="text-xs font-black uppercase tracking-wider">Bước 03 / 06</span>
            </div>
            <h2 className="text-xl font-black text-text-primary mt-1">Giải phẫu & Nhóm cơ (Muscles & Anatomy)</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Tương tác trực tiếp trên sơ đồ cơ bắp 3D, phân tầng Cơ chính (Primary), Cơ phụ (Secondary), Cơ ổn định (Stabilizer) và tải ảnh minh họa cơ tác động chuẩn y khoa.
            </p>
          </div>

          {/* Display Mode Switcher */}
          <div className="flex rounded-2xl border border-border bg-surface p-1 text-xs">
            <button
              type="button"
              onClick={() => setDisplayMode("SPLIT")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all cursor-pointer ${
                displayMode === "SPLIT"
                  ? "bg-accent text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Layers size={13} />
              <span>Cả 2 (Sơ đồ + Ảnh)</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("ANATOMY")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all cursor-pointer ${
                displayMode === "ANATOMY"
                  ? "bg-accent text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <User size={13} />
              <span>Chỉ Sơ đồ Cơ bắp</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("IMAGE")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all cursor-pointer ${
                displayMode === "IMAGE"
                  ? "bg-accent text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <ImageIcon size={13} />
              <span>Chỉ Ảnh Minh họa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Column: Anatomy Visualizers */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Sơ đồ Vector tương tác */}
          {(displayMode === "SPLIT" || displayMode === "ANATOMY") && (
            <div className="space-y-4">
              <AnatomySelector
                targets={targets}
                onSelectMuscle={handleSelectMuscleFromAnatomy}
              />
              <div className="flex items-start gap-2 rounded-2xl bg-accent/5 p-3 border border-accent/20 text-xs text-text-secondary">
                <Info size={16} className="text-accent flex-shrink-0 mt-0.5" />
                <span>
                  💡 <strong>Hướng dẫn:</strong> Bấm lần lượt vào <strong>nhiều nhóm cơ</strong> trên sơ đồ (Mặt trước / Mặt sau) để thêm từng cơ, rồi chỉnh vai trò (Chính / Phụ trợ / Ổn định), mức độ co rút và cảm giác cơ. Cơ đầu tiên mặc định là Cơ chính, các cơ sau là Cơ phụ trợ.
                </span>
              </div>
            </div>
          )}

          {/* 2. Ảnh Minh Họa Cơ Tác Động Thực Tế (Upload Component) */}
          {(displayMode === "SPLIT" || displayMode === "IMAGE") && (
            <MuscleImpactImageUploader
              images={anatomyImages}
              imageUrl={anatomyImageUrl}
              caption={anatomyImageCaption}
              onChange={handleImageChange}
            />
          )}
        </div>

        {/* Right Column: Selected Muscle List (Col 5) */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-5 sticky top-20">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wide">
              Nhóm cơ đã cấu hình ({targets.length})
            </h3>
            <span className="text-[11px] font-bold text-accent">
              {targets.filter((t) => t.role === "PRIMARY").length} Cơ chính
            </span>
          </div>

          <SelectedMuscleList
            targets={targets}
            onUpdateTarget={handleUpdateTarget}
            onRemoveTarget={handleRemoveTarget}
          />
        </div>
      </div>

      {/* Edit modal when active */}
      {activeConfigureMuscle && (
        <MuscleDetailsPanel
          muscle={activeConfigureMuscle}
          initialTarget={targets.find((t) => t.muscleId === activeConfigureMuscle.id)}
          onSave={handleUpdateTarget}
          onClose={() => setActiveConfigureMuscle(null)}
        />
      )}
    </div>
  );
}

