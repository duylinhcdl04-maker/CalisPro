import { useState } from "react";
import { Plus, X, Tag as TagIcon, Sparkles, Layers, ShieldCheck, Dumbbell } from "lucide-react";
import {
  ExerciseFormData,
  ExerciseCategory,
  ExerciseDifficulty,
  MovementPattern,
  EquipmentType,
} from "../../../types/exerciseBuilder";

interface BasicInformationStepProps {
  formData: ExerciseFormData;
  onChange: (updated: Partial<ExerciseFormData>) => void;
}

const CATEGORIES: ExerciseCategory[] = [
  "Strength",
  "Skill",
  "Mobility",
  "Flexibility",
  "Endurance",
  "Conditioning",
  "Recovery",
];

const DIFFICULTIES: ExerciseDifficulty[] = ["Beginner", "Intermediate", "Advanced", "Expert"];

const MOVEMENT_PATTERNS: MovementPattern[] = [
  "Horizontal Push",
  "Vertical Push",
  "Horizontal Pull",
  "Vertical Pull",
  "Squat",
  "Hinge",
  "Lunge",
  "Core Flexion",
  "Core Extension",
  "Rotation",
  "Anti-Rotation",
  "Static Hold",
  "Locomotion",
];

const EQUIPMENT_OPTIONS: EquipmentType[] = [
  "No Equipment",
  "Pull-up Bar",
  "Parallel Bars",
  "Gymnastic Rings",
  "Resistance Band",
  "Parallettes",
  "Weight Vest / Dip Belt",
  "Dumbbell",
  "Kettlebell",
  "Bench",
  "Other",
];

export function BasicInformationStep({ formData, onChange }: BasicInformationStepProps) {
  const [newTagInput, setNewTagInput] = useState("");

  function handleAddTag() {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    if (!formData.tags.includes(tag)) {
      onChange({ tags: [...formData.tags, tag] });
    }
    setNewTagInput("");
  }

  function handleRemoveTag(tagToRemove: string) {
    onChange({ tags: formData.tags.filter((t) => t !== tagToRemove) });
  }

  function handleToggleEquipment(eq: EquipmentType) {
    if (formData.equipment.includes(eq)) {
      onChange({ equipment: formData.equipment.filter((item) => item !== eq) });
    } else {
      onChange({ equipment: [...formData.equipment, eq] });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header Info */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-accent">
          <Layers size={18} />
          <span className="text-xs font-black uppercase tracking-wider">Bước 01 / 06</span>
        </div>
        <h2 className="text-xl font-black text-text-primary mt-1">Thông tin cơ bản Động tác</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Khai báo thông tin định danh, phân loại động lực học và mục tiêu tập luyện hiển thị tới học viên & HLV.
        </p>
      </div>

      {/* 1. GENERAL GROUP */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
            A
          </span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            1. Định danh bài tập (General Identification)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary flex items-center justify-between">
              <span>Tên động tác quốc tế (Tiếng Anh) <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-text-secondary">Min 2 - Max 100 ký tự</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Standard Push Up, Muscle Up, Planche Lean"
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-text-primary focus:border-accent focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-text-secondary">
              Tên tiêu chuẩn Calisthenics thế giới giúp đồng bộ thư viện và thuật toán AI.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Tên hiển thị tiếng Việt (Localized Name)
            </label>
            <input
              type="text"
              value={formData.vietnameseName}
              onChange={(e) => onChange({ vietnameseName: e.target.value })}
              placeholder="e.g. Hít đất chuẩn Calisthenics, Kéo xà đơn cơ bản"
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-text-primary focus:border-accent focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-text-secondary">
              Tên tiếng Việt thân thiện hiển thị trực tiếp trên App Học viên.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary">
              Mô tả ngắn & Mục tiêu chính (Short Description)
            </label>
            <span
              className={`text-[10px] font-mono ${
                formData.shortDescription.length > 280 ? "text-amber-500 font-bold" : "text-text-secondary"
              }`}
            >
              {formData.shortDescription.length} / 300 ký tự
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={300}
            value={formData.shortDescription}
            onChange={(e) => onChange({ shortDescription: e.target.value })}
            placeholder="Tóm tắt tác dụng của bài tập, nhóm cơ tham gia và đối tượng phù hợp..."
            className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-text-primary focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* 2. CLASSIFICATION GROUP */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
            B
          </span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            2. Phân loại & Chuyển động (Classification & Movement Pattern)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Phân nhóm (Category) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => onChange({ category: e.target.value as ExerciseCategory })}
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Cấp độ (Difficulty Level) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => onChange({ difficulty: e.target.value as ExerciseDifficulty })}
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
            >
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Pattern */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Mô hình chuyển động (Pattern) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.movementPattern}
              onChange={(e) => onChange({ movementPattern: e.target.value as MovementPattern })}
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
            >
              {MOVEMENT_PATTERNS.map((mp) => (
                <option key={mp} value={mp}>
                  {mp}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. EQUIPMENT GROUP */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
            C
          </span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            3. Dụng cụ tập luyện (Equipment Requirements)
          </h3>
        </div>

        <p className="text-xs text-text-secondary">
          Chọn tất cả dụng cụ hỗ trợ bài tập này (có thể chọn nhiều dụng cụ):
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {EQUIPMENT_OPTIONS.map((eq) => {
            const isSelected = formData.equipment.includes(eq);
            return (
              <button
                key={eq}
                type="button"
                onClick={() => handleToggleEquipment(eq)}
                className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-accent text-white shadow-xs scale-102"
                    : "border border-border bg-background text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                }`}
              >
                <Dumbbell size={13} />
                <span>{eq}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. DISCOVERY & TAGS GROUP */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
            D
          </span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            4. Thẻ tìm kiếm & Đề xuất (Discovery Tags)
          </h3>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <TagIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Nhập thẻ tìm kiếm (e.g. Chest, Upper Body, Calisthenics) và bấm Enter..."
              className="w-full rounded-2xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAddTag}
            className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Thêm Tag</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-3 py-1 text-xs font-bold text-text-primary animate-in zoom-in-90"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="rounded-md p-0.5 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {formData.tags.length === 0 && (
            <span className="text-xs text-text-secondary italic">Chưa có thẻ nào được thêm.</span>
          )}
        </div>
      </div>
    </div>
  );
}
