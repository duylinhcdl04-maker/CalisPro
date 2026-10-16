import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  CheckCircle2,
  Calendar,
  Flame,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { Exercise } from "../../../types";
import type { ExerciseDetailExtra, TrainingTierPreset } from "../../../services/mock/exerciseDetailTrainingData";
import { Button } from "../../ui/Button";

interface VideoPresetTrainingModeProps {
  exercise: Exercise;
  extra: ExerciseDetailExtra;
}

export function VideoPresetTrainingMode({ exercise, extra }: VideoPresetTrainingModeProps) {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<"Beginner" | "Intermediate" | "Advanced">(
    (exercise.difficulty as "Beginner" | "Intermediate" | "Advanced") || "Beginner"
  );
  const [isAddedToPlan, setIsAddedToPlan] = useState(false);

  const activePreset = extra.presets.find((p) => p.level === selectedTier) || extra.presets[0];

  function handleStartPresetWorkout() {
    toast.success(`Bắt đầu tập ${exercise.name}`, {
      description: `Chế độ ${selectedTier}: ${activePreset.sets} hiệp x ${activePreset.reps}.`,
    });
    navigate("/workout/12/active");
  }

  function handleAddToTodayPlan() {
    setIsAddedToPlan(true);
    toast.success(`Đã thêm ${exercise.name} vào giáo án hôm nay`, {
      description: "Bài tập đã được lưu vào danh sách chờ của phiên tập.",
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 🌟 BANNER GIỚI THIỆU CHẾ ĐỘ VIDEO & PRESET */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-surface via-surface to-accent-soft/20 p-5 shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-white font-bold text-xs">
                1
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-text-primary">
                Tập luyện theo Video & Động tác có sẵn (Preset)
              </h3>
            </div>
            <p className="text-xs text-text-secondary max-w-xl">
              Tự làm chủ kỹ thuật thông qua video chuẩn chuyển động, các mốc hiệp/rep theo cấp độ được thiết lập sẵn bởi chuyên gia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleStartPresetWorkout}
              className="bg-accent hover:bg-accent-strong text-white px-5 font-bold text-xs gap-2 shadow-md shrink-0"
            >
              <Play size={14} className="fill-current" />
              Tập ngay với bài này
            </Button>
          </div>
        </div>
      </div>

      {/* 🎯 3 CẤP ĐỘ PRESET (BEGINNER, INTERMEDIATE, ADVANCED) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Chọn mức độ mục tiêu của bạn:
          </span>
          <span className="text-xs font-semibold text-accent-strong">
            {selectedTier === "Beginner" ? "Dành cho người mới" : selectedTier === "Intermediate" ? "Đã có nền tảng" : "Vận động viên / Beast"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {extra.presets.map((preset) => {
            const isSelected = selectedTier === preset.level;
            return (
              <div
                key={preset.level}
                onClick={() => setSelectedTier(preset.level)}
                className={`group rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? "border-accent bg-accent-soft/30 shadow-md ring-2 ring-accent/30"
                    : "border-border/80 bg-surface hover:border-border hover:bg-surface-elevated"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg">
                    Đang chọn
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${
                        preset.level === "Beginner"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : preset.level === "Intermediate"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {preset.level}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-black text-text-primary">
                      {preset.sets} Hiệp <span className="text-xs font-bold text-text-secondary">x {preset.reps}</span>
                    </div>
                    <div className="text-[11px] text-text-secondary flex items-center gap-2">
                      <Clock size={12} />
                      Nghỉ {preset.restSeconds}s giữa hiệp • {preset.frequency}
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary/90 line-clamp-2 pt-1 border-t border-border/50">
                    {preset.focus}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📋 CHI TIẾT GIÁO ÁN ĐÃ CHỌN VÀ NÚT TÁC VỤ */}
      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-accent-strong">
              Cấu hình luyện tập được khuyến nghị ({selectedTier})
            </div>
            <div className="font-display text-lg font-black text-text-primary mt-0.5">
              {activePreset.sets} sets × {activePreset.reps} • Nghỉ {activePreset.restSeconds}s
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToTodayPlan}
              disabled={isAddedToPlan}
              className={`text-xs font-semibold gap-1.5 border-border ${
                isAddedToPlan ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "hover:border-accent"
              }`}
            >
              {isAddedToPlan ? (
                <>
                  <CheckCircle2 size={14} className="stroke-[2.5]" />
                  Đã thêm vào giáo án
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Thêm vào giáo án hôm nay
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handleStartPresetWorkout}
              className="bg-accent hover:bg-accent-strong text-white px-4 font-bold text-xs gap-1.5 shadow-xs"
            >
              Vào phòng tập
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {/* Quy trình thực hiện nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-xl bg-background/50 p-3 border border-border/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Pha 1: Khởi động</div>
            <div className="text-xs font-bold text-text-primary mt-1">Xoay cổ tay & ép vai 3 phút</div>
          </div>
          <div className="rounded-xl bg-background/50 p-3 border border-border/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Pha 2: Thực hiện chính</div>
            <div className="text-xs font-bold text-text-primary mt-1">{activePreset.sets} hiệp chuẩn form 100%</div>
          </div>
          <div className="rounded-xl bg-background/50 p-3 border border-border/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Pha 3: Giãn cơ phục hồi</div>
            <div className="text-xs font-bold text-text-primary mt-1">Ép ngực tĩnh 30s sau khi xong</div>
          </div>
        </div>
      </div>
    </div>
  );
}
