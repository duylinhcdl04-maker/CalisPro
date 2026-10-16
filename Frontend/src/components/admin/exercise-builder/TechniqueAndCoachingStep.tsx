import { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  Wind,
  Clock,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  ExerciseFormData,
  CoachingCueItem,
  CommonMistakeItem,
  SafetyGuidance,
} from "../../../types/exerciseBuilder";

interface TechniqueAndCoachingStepProps {
  formData: ExerciseFormData;
  onChange: (updated: Partial<ExerciseFormData>) => void;
}

export function TechniqueAndCoachingStep({ formData, onChange }: TechniqueAndCoachingStepProps) {
  const [newCueText, setNewCueText] = useState("");
  const [newCueType, setNewCueType] = useState<"alignment" | "safety" | "positive" | "negative">("alignment");

  function handleAddCue() {
    if (!newCueText.trim()) return;
    const newCue: CoachingCueItem = {
      id: `cue-${Date.now()}`,
      text: newCueText.trim(),
      type: newCueType,
    };
    onChange({ coachingCues: [...formData.coachingCues, newCue] });
    setNewCueText("");
  }

  function handleRemoveCue(id: string) {
    onChange({ coachingCues: formData.coachingCues.filter((c) => c.id !== id) });
  }

  function handleAddMistake() {
    const newMistake: CommonMistakeItem = {
      id: `mistake-${Date.now()}`,
      name: "Tên lỗi sai mới",
      problem: "Mô tả biểu hiện của lỗi...",
      whyItHappens: "Nguyên nhân do yếu nhóm cơ nào hoặc sai kỹ thuật...",
      correction: "Cách sửa và khẩu lệnh khắc phục...",
      severity: "Medium",
    };
    onChange({ commonMistakes: [...formData.commonMistakes, newMistake] });
  }

  function handleUpdateMistake(id: string, updated: Partial<CommonMistakeItem>) {
    onChange({
      commonMistakes: formData.commonMistakes.map((m) => (m.id === id ? { ...m, ...updated } : m)),
    });
  }

  function handleDeleteMistake(id: string) {
    onChange({ commonMistakes: formData.commonMistakes.filter((m) => m.id !== id) });
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Step Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-accent">
          <FileText size={18} />
          <span className="text-xs font-black uppercase tracking-wider">Bước 04 / 06</span>
        </div>
        <h2 className="text-xl font-black text-text-primary mt-1">Kỹ thuật & Khẩu lệnh Huấn luyện</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Quy chuẩn kỹ thuật thực hiện, nhịp thở, nhịp độ (Tempo), khẩu lệnh thực chiến và danh sách lỗi sai phổ biến.
        </p>
      </div>

      {/* 1. SETUP & EXECUTION & BREATHING */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
            A
          </span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            1. Hướng dẫn Kỹ thuật & Nhịp thở (Technique & Breathing)
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Tư thế chuẩn bị (Setup Instructions) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={formData.setupInstruction}
              onChange={(e) => onChange({ setupInstruction: e.target.value })}
              placeholder="Vị trí đặt tay, chân, căn chỉnh cột sống và góc bả vai trước khi bắt đầu..."
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Quy trình thực hiện (Execution Instructions) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={formData.executionInstruction}
              onChange={(e) => onChange({ executionInstruction: e.target.value })}
              placeholder="Chuyển động các khớp, hành trình chuyển động và cách khóa đỉnh động tác..."
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                <Wind size={13} className="text-sky-500" />
                <span>Thời điểm hít vào (Inhale)</span>
              </label>
              <input
                type="text"
                value={formData.inhaleTiming}
                onChange={(e) => onChange({ inhaleTiming: e.target.value })}
                placeholder="e.g. Hít sâu khi hạ người xuống"
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                <Wind size={13} className="text-amber-500" />
                <span>Thời điểm thở ra (Exhale)</span>
              </label>
              <input
                type="text"
                value={formData.exhaleTiming}
                onChange={(e) => onChange({ exhaleTiming: e.target.value })}
                placeholder="e.g. Thở mạnh khi đẩy lên"
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                <Clock size={13} className="text-emerald-500" />
                <span>Nhịp độ chuẩn (Tempo Format)</span>
              </label>
              <input
                type="text"
                value={formData.tempoFormat || "2 - 0 - 1 - 0"}
                onChange={(e) => onChange({ tempoFormat: e.target.value })}
                placeholder="2 - 0 - 1 - 0 (Hạ-Dừng-Đẩy-Khóa)"
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. COACHING CUES */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              B
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              2. Khẩu lệnh Huấn luyện viên (Coaching Cues)
            </h3>
          </div>
          <span className="text-[11px] text-text-secondary">Ngắn gọn ≤ 120 ký tự</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            maxLength={120}
            value={newCueText}
            onChange={(e) => setNewCueText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCue();
              }
            }}
            placeholder="e.g. Siết cơ mông, gồng chặt bụng, kẹp khuỷu tay góc 45 độ..."
            className="flex-1 rounded-2xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
          />
          <select
            value={newCueType}
            onChange={(e) => setNewCueType(e.target.value as any)}
            className="rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:outline-none"
          >
            <option value="alignment">Căn chỉnh (Alignment)</option>
            <option value="safety">An toàn (Safety)</option>
            <option value="positive">Tạo động lực (Positive)</option>
            <option value="negative">Cảnh báo (Negative)</option>
          </select>
          <button
            type="button"
            onClick={handleAddCue}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Thêm Cue</span>
          </button>
        </div>

        <div className="space-y-2">
          {formData.coachingCues.map((cue) => (
            <div
              key={cue.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-background p-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                    cue.type === "safety"
                      ? "bg-rose-500/15 text-rose-600"
                      : cue.type === "alignment"
                      ? "bg-accent/15 text-accent-strong"
                      : "bg-sky-500/15 text-sky-600"
                  }`}
                >
                  {cue.type}
                </span>
                <span className="font-bold text-text-primary">{cue.text}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCue(cue.id)}
                className="rounded-lg p-1 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {formData.coachingCues.length === 0 && (
            <div className="text-center text-xs text-text-secondary py-3 italic">
              Chưa có khẩu lệnh nào được thiết lập.
            </div>
          )}
        </div>
      </div>

      {/* 3. COMMON MISTAKES */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              C
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              3. Lỗi sai phổ biến & Cách khắc phục (Common Mistakes)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddMistake}
            className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Thêm lỗi sai</span>
          </button>
        </div>

        <div className="space-y-4">
          {formData.commonMistakes.map((mistake, idx) => (
            <div
              key={mistake.id}
              className="rounded-2xl border border-border bg-background p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-500/15 text-rose-600 text-[10px] font-black">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={mistake.name}
                    onChange={(e) => handleUpdateMistake(mistake.id, { name: e.target.value })}
                    placeholder="Tên lỗi (e.g. Võng lưng, Cùi chỏ bẹt 90 độ)"
                    className="w-full font-bold text-xs text-text-primary bg-transparent focus:outline-none focus:border-b focus:border-accent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-secondary">Mức độ rủi ro:</span>
                  <select
                    value={mistake.severity}
                    onChange={(e) => handleUpdateMistake(mistake.id, { severity: e.target.value as any })}
                    className="rounded-xl border border-border bg-surface p-1 text-xs font-bold text-text-primary focus:outline-none"
                  >
                    <option value="Low">Nhẹ (Low)</option>
                    <option value="Medium">Vừa (Medium)</option>
                    <option value="High">Nghiêm trọng (High)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteMistake(mistake.id)}
                    className="rounded-lg p-1 text-rose-500 hover:bg-rose-500/10 cursor-pointer ml-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-text-primary">Biểu hiện của lỗi (Problem)</label>
                  <textarea
                    rows={2}
                    value={mistake.problem}
                    onChange={(e) => handleUpdateMistake(mistake.id, { problem: e.target.value })}
                    placeholder="Hông bị chùng xuống thấp hơn trục cơ thể..."
                    className="w-full rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-primary">Nguyên nhân (Why it happens)</label>
                  <textarea
                    rows={2}
                    value={mistake.whyItHappens}
                    onChange={(e) => handleUpdateMistake(mistake.id, { whyItHappens: e.target.value })}
                    placeholder="Cơ core yếu hoặc mất tập trung..."
                    className="w-full rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-primary">Cách sửa (Correction)</label>
                  <textarea
                    rows={2}
                    value={mistake.correction}
                    onChange={(e) => handleUpdateMistake(mistake.id, { correction: e.target.value })}
                    placeholder="Gồng chắc bụng, siết mông..."
                    className="w-full rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SAFETY GUIDANCE */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
            D
          </span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            4. Chỉ định An toàn & Điều kiện dừng bài (Safety Guidance)
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-text-primary flex items-center gap-1">
              <ShieldAlert size={13} className="text-rose-500" />
              <span>Chống chỉ định & Cảnh báo chấn thương (Contraindications)</span>
            </label>
            <textarea
              rows={2}
              value={formData.safetyGuidance.contraindications}
              onChange={(e) =>
                onChange({
                  safetyGuidance: { ...formData.safetyGuidance, contraindications: e.target.value },
                })
              }
              placeholder="Chấn thương vai, khớp cổ tay, thoát vị đĩa đệm..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
