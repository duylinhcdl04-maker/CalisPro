import { useState } from "react";
import {
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import {
  ExerciseFormData,
  MuscleTargetItem,
  MuscleActivationLevel,
  MuscleSensation,
} from "../../../types/exerciseBuilder";

interface MusclesAndAnatomyStepProps {
  formData: ExerciseFormData;
  onChange: (updated: Partial<ExerciseFormData>) => void;
}

const MUSCLE_CATALOG = [
  { id: "m-chest", name: "Pectoralis Major", vietnameseName: "Cơ ngực lớn", region: "chest" as const },
  { id: "m-chest-upper", name: "Upper Pectoralis", vietnameseName: "Cơ ngực trên", region: "chest" as const },
  { id: "m-triceps", name: "Triceps Brachii", vietnameseName: "Cơ tam đầu (tay sau)", region: "arms" as const },
  { id: "m-biceps", name: "Biceps Brachii", vietnameseName: "Cơ nhị đầu (tay trước)", region: "arms" as const },
  { id: "m-deltoid-ant", name: "Anterior Deltoids", vietnameseName: "Cơ vai trước", region: "shoulders" as const },
  { id: "m-deltoid-lat", name: "Lateral Deltoids", vietnameseName: "Cơ vai giữa", region: "shoulders" as const },
  { id: "m-deltoid-post", name: "Posterior Deltoids", vietnameseName: "Cơ vai sau", region: "shoulders" as const },
  { id: "m-lats", name: "Latissimus Dorsi", vietnameseName: "Cơ xô (Lats)", region: "back" as const },
  { id: "m-traps", name: "Trapezius", vietnameseName: "Cơ cầu vai (Traps)", region: "back" as const },
  { id: "m-rhomboids", name: "Rhomboids", vietnameseName: "Cơ quả trám bả vai", region: "back" as const },
  { id: "m-core-rectus", name: "Rectus Abdominis", vietnameseName: "Cơ bụng 6 múi", region: "core" as const },
  { id: "m-core-obliques", name: "Obliques", vietnameseName: "Cơ liên sườn", region: "core" as const },
  { id: "m-serratus", name: "Serratus Anterior", vietnameseName: "Cơ răng cưa", region: "chest" as const },
  { id: "m-glutes", name: "Gluteus Maximus", vietnameseName: "Cơ mông lớn", region: "glutes" as const },
  { id: "m-quads", name: "Quadriceps", vietnameseName: "Cơ đùi trước (Quads)", region: "legs" as const },
  { id: "m-hamstrings", name: "Hamstrings", vietnameseName: "Cơ đùi sau", region: "legs" as const },
  { id: "m-calves", name: "Calves (Gastrocnemius)", vietnameseName: "Cơ bắp chân", region: "legs" as const },
];

const NORMAL_SENSATIONS_PRESETS = [
  "Căng dãn cơ khi hạ (Stretch)",
  "Co bóp cơ cực đại (Peak Contraction)",
  "Bơm máu căng cơ (Muscle Pump)",
  "Mỏi cơ lành mạnh (Fatigue)",
  "Nóng rát do tích tụ acid lactic (Burning)",
  "Gồng cứng ổn định khớp (Stabilization Effort)",
];

const UNEXPECTED_SENSATIONS_PRESETS = [
  "Đau nhói khớp (Sharp joint pain)",
  "Tê bì hoặc châm chích (Numbness / Tingling)",
  "Khớp kêu lạo xạo kèm đau (Crepitus with pain)",
  "Đau nhức cột sống thắt lưng",
  "Cảm giác mất ổn định khớp (Instability)",
];

export function MusclesAndAnatomyStep({ formData, onChange }: MusclesAndAnatomyStepProps) {
  const [viewAngle, setViewAngle] = useState<"front" | "back">("front");
  const [selectedMuscleId, setSelectedMuscleId] = useState<string>(MUSCLE_CATALOG[0].id);
  const [selectedRole, setSelectedRole] = useState<"primary" | "secondary" | "stabilizer">("primary");
  const [selectedLevel, setSelectedLevel] = useState<MuscleActivationLevel>("High");

  function handleAddMuscleTarget() {
    const muscleMeta = MUSCLE_CATALOG.find((m) => m.id === selectedMuscleId);
    if (!muscleMeta) return;

    if (formData.muscles.some((m) => m.id === muscleMeta.id)) {
      // Update existing
      onChange({
        muscles: formData.muscles.map((m) =>
          m.id === muscleMeta.id ? { ...m, role: selectedRole, activationLevel: selectedLevel } : m
        ),
      });
    } else {
      const newItem: MuscleTargetItem = {
        id: muscleMeta.id,
        name: muscleMeta.name,
        vietnameseName: muscleMeta.vietnameseName,
        role: selectedRole,
        activationLevel: selectedLevel,
        bodyRegion: muscleMeta.region,
      };
      onChange({ muscles: [...formData.muscles, newItem] });
    }
  }

  function handleRemoveMuscle(id: string) {
    onChange({ muscles: formData.muscles.filter((m) => m.id !== id) });
  }

  function handleAddSensation() {
    const newSensation: MuscleSensation = {
      muscleName: "Nhóm cơ mới",
      expectedSensation: "Mô tả cảm giác kỳ vọng khi thực hiện...",
      intensity: "Moderate",
      normalSensations: ["Căng cơ lành mạnh", "Bơm máu"],
      unexpectedSensations: ["Đau nhói khớp"],
    };
    onChange({ sensations: [...formData.sensations, newSensation] });
  }

  function handleUpdateSensation(index: number, updated: Partial<MuscleSensation>) {
    const newSensations = [...formData.sensations];
    newSensations[index] = { ...newSensations[index], ...updated };
    onChange({ sensations: newSensations });
  }

  function handleDeleteSensation(index: number) {
    onChange({ sensations: formData.sensations.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-accent">
          <Activity size={18} />
          <span className="text-xs font-black uppercase tracking-wider">Bước 03 / 06</span>
        </div>
        <h2 className="text-xl font-black text-text-primary mt-1">Giải phẫu & Nhóm cơ tác động</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Khai báo nhóm cơ chính (Primary), cơ phụ (Secondary), cơ ổn định (Stabilizer) và chuẩn hóa cảm giác kích hoạt cơ.
        </p>
      </div>

      {/* 1. INTERACTIVE ANATOMY & MUSCLE MATRIX */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              A
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              1. Sơ đồ giải phẫu & Nhóm cơ (Anatomy Targets)
            </h3>
          </div>

          {/* Front / Back Toggle */}
          <div className="flex rounded-2xl border border-border bg-surface-elevated p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewAngle("front")}
              className={`rounded-xl px-3 py-1.5 font-bold transition-all cursor-pointer ${
                viewAngle === "front" ? "bg-surface text-accent shadow-xs" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Mặt trước (Anterior)
            </button>
            <button
              type="button"
              onClick={() => setViewAngle("back")}
              className={`rounded-xl px-3 py-1.5 font-bold transition-all cursor-pointer ${
                viewAngle === "back" ? "bg-surface text-accent shadow-xs" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Mặt sau (Posterior)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive SVG Skeleton Body representation */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center rounded-3xl border border-border bg-background/50 p-6 text-center">
            <div className="relative w-44 h-72 flex items-center justify-center">
              {/* Human Body SVG Shape */}
              <svg viewBox="0 0 100 200" className="h-full w-full drop-shadow-md">
                {/* Head */}
                <circle cx="50" cy="20" r="12" className="fill-surface-elevated stroke-border" strokeWidth="1.5" />
                
                {/* Neck & Torso */}
                <path
                  d="M44 32 L56 32 L62 80 L38 80 Z"
                  className={formData.muscles.some(m => m.bodyRegion === "chest" || m.bodyRegion === "back") ? "fill-accent/40 stroke-accent" : "fill-surface-elevated stroke-border"}
                  strokeWidth="1.5"
                />

                {/* Shoulders */}
                <circle cx="33" cy="40" r="6" className={formData.muscles.some(m => m.bodyRegion === "shoulders") ? "fill-accent stroke-accent" : "fill-surface-elevated stroke-border"} strokeWidth="1.5" />
                <circle cx="67" cy="40" r="6" className={formData.muscles.some(m => m.bodyRegion === "shoulders") ? "fill-accent stroke-accent" : "fill-surface-elevated stroke-border"} strokeWidth="1.5" />

                {/* Arms */}
                <path d="M30 44 L22 80 L18 115" className={formData.muscles.some(m => m.bodyRegion === "arms") ? "stroke-accent" : "stroke-border"} strokeWidth="7" strokeLinecap="round" />
                <path d="M70 44 L78 80 L82 115" className={formData.muscles.some(m => m.bodyRegion === "arms") ? "stroke-accent" : "stroke-border"} strokeWidth="7" strokeLinecap="round" />

                {/* Core / Pelvis */}
                <path
                  d="M38 80 L62 80 L66 105 L34 105 Z"
                  className={formData.muscles.some(m => m.bodyRegion === "core" || m.bodyRegion === "glutes") ? "fill-accent/60 stroke-accent" : "fill-surface-elevated stroke-border"}
                  strokeWidth="1.5"
                />

                {/* Legs */}
                <path d="M42 105 L40 150 L38 190" className={formData.muscles.some(m => m.bodyRegion === "legs") ? "stroke-accent" : "stroke-border"} strokeWidth="9" strokeLinecap="round" />
                <path d="M58 105 L60 150 L62 190" className={formData.muscles.some(m => m.bodyRegion === "legs") ? "stroke-accent" : "stroke-border"} strokeWidth="9" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-text-secondary mt-3">
              {viewAngle === "front" ? "Sơ đồ mặt trước (Anterior Chain)" : "Sơ đồ mặt sau (Posterior Chain)"}
            </span>
          </div>

          {/* Muscle Selector Form */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Chọn nhóm cơ</label>
                <select
                  value={selectedMuscleId}
                  onChange={(e) => setSelectedMuscleId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                >
                  {MUSCLE_CATALOG.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.vietnameseName} ({m.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Vai trò cơ</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="primary">Cơ phát lực chính (Primary)</option>
                  <option value="secondary">Cơ bổ trợ (Secondary)</option>
                  <option value="stabilizer">Cơ ổn định (Stabilizer)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Mức độ kích hoạt</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="Very High">Rất cao (Very High)</option>
                  <option value="High">Cao (High)</option>
                  <option value="Moderate">Trung bình (Moderate)</option>
                  <option value="Low">Nhẹ (Low)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddMuscleTarget}
              className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Gán nhóm cơ vào bài tập</span>
            </button>

            {/* List of mapped muscles */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-text-secondary tracking-wider">
                Nhóm cơ đã chọn ({formData.muscles.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.muscles.map((muscle) => (
                  <div
                    key={muscle.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-background p-3 hover:border-accent/40 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-text-primary">{muscle.vietnameseName}</span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            muscle.role === "primary"
                              ? "bg-accent/15 text-accent-strong"
                              : muscle.role === "secondary"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-surface-elevated text-text-secondary"
                          }`}
                        >
                          {muscle.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                        <span>{muscle.name}</span>
                        <span>•</span>
                        <span className="font-bold text-accent">{muscle.activationLevel}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMuscle(muscle.id)}
                      className="rounded-lg p-1 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {formData.muscles.length === 0 && (
                  <div className="col-span-2 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-text-secondary">
                    Chưa có nhóm cơ nào. Vui lòng chọn ít nhất 1 cơ chính (Primary).
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MUSCLE SENSATION ("WHAT SHOULD USER FEEL?") */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              B
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              2. Chuẩn hóa cảm giác cơ bắp (Muscle Sensation Guidelines)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddSensation}
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer"
          >
            <Plus size={13} />
            <span>Thêm vùng cảm nhận</span>
          </button>
        </div>

        <p className="text-xs text-text-secondary">
          Cung cấp hướng dẫn trực quan để người tập nhận biết cơ nào đang hoạt động đúng và phân biệt cơn đau chấn thương bất thường.
        </p>

        <div className="space-y-4">
          {formData.sensations.map((sens, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-background p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <input
                  type="text"
                  value={sens.muscleName}
                  onChange={(e) => handleUpdateSensation(idx, { muscleName: e.target.value })}
                  placeholder="Tên nhóm cơ (e.g. Cơ ngực, Tay sau)"
                  className="font-bold text-xs text-text-primary bg-transparent focus:outline-none focus:border-b focus:border-accent"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-secondary">Cường độ:</span>
                  <select
                    value={sens.intensity}
                    onChange={(e) => handleUpdateSensation(idx, { intensity: e.target.value as any })}
                    className="rounded-xl border border-border bg-surface p-1 text-xs font-bold text-text-primary focus:outline-none"
                  >
                    <option value="Mild">Nhẹ (Mild)</option>
                    <option value="Moderate">Vừa phải (Moderate)</option>
                    <option value="Strong">Mạnh mẽ (Strong)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteSensation(idx)}
                    className="rounded-lg p-1 text-rose-500 hover:bg-rose-500/10 cursor-pointer ml-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-primary">Mô tả cảm giác chuẩn kỳ vọng</label>
                <textarea
                  rows={2}
                  value={sens.expectedSensation}
                  onChange={(e) => handleUpdateSensation(idx, { expectedSensation: e.target.value })}
                  placeholder="Cảm giác căng dãn và co thắt cơ..."
                  className="w-full rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              {/* Normal vs Unexpected Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 size={13} />
                    <span>Cảm giác bình thường (Bật đèn xanh)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sens.normalSensations.map((n, i) => (
                      <span key={i} className="rounded-lg bg-surface px-2 py-0.5 text-[10px] font-bold text-text-primary border border-border">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                    <AlertTriangle size={13} />
                    <span>Cảm giác bất thường (Cần dừng tập)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sens.unexpectedSensations.map((u, i) => (
                      <span key={i} className="rounded-lg bg-surface px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-border">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
