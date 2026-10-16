import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Dumbbell,
  Clock,
  Flame,
  Activity,
  AlertTriangle,
  Play,
  Bot,
  Users,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Info,
  Wind,
} from "lucide-react";
import { toast } from "sonner";
import type { Exercise } from "../../types";
import { getExerciseExtra } from "../../services/mock/exerciseDetailTrainingData";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ProgressionPath } from "./ProgressionPath";
import { VideoPresetTrainingMode } from "./modes/VideoPresetTrainingMode";
import { AICoachTrainingMode } from "./modes/AICoachTrainingMode";
import { HumanCoachTrainingMode } from "./modes/HumanCoachTrainingMode";

type TrainingModeKey = "video-preset" | "ai-coach" | "human-coach";

interface ExerciseDetailViewProps {
  exercise: Exercise;
}

export function ExerciseDetailView({ exercise }: ExerciseDetailViewProps) {
  const navigate = useNavigate();
  const extra = getExerciseExtra(exercise.id);

  const [activeMode, setActiveMode] = useState<TrainingModeKey>("video-preset");
  // Tab AI Coach chỉ có khi Coach đã bật "tích hợp AI" cho bài này
  const aiEnabled = !!exercise.details?.aiEnabled;
  const mode: TrainingModeKey = activeMode === "ai-coach" && !aiEnabled ? "video-preset" : activeMode;
  const [isBookmarked, setIsBookmarked] = useState(false);

  function handleBookmarkToggle() {
    setIsBookmarked(!isBookmarked);
    if (!isBookmarked) {
      toast.success(`Đã lưu ${exercise.name} vào danh sách yêu thích`);
    } else {
      toast.info(`Đã bỏ lưu ${exercise.name}`);
    }
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết bài tập vào bộ nhớ tạm");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 md:px-8 md:py-6 pb-20">
      {/* 🧭 1. TOP BREADCRUMB & QUICK ACTIONS */}
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
        <Link
          to="/exercises"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Thư viện bài tập (Exercise Library)</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="Chia sẻ bài tập"
          >
            <Share2 size={15} />
          </button>

          <button
            type="button"
            onClick={handleBookmarkToggle}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
              isBookmarked
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
            }`}
            title="Lưu bài tập"
          >
            <Bookmark size={15} className={isBookmarked ? "fill-current" : ""} />
          </button>
        </div>
      </div>

      {/* 🏋️‍♂️ 2. EXERCISE HERO SHOWCASE CARD */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-7 shadow-elevated space-y-6">
        {/* Media Preview & Title Group */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Visual Poster */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-black aspect-video sm:aspect-[16/10] w-full lg:w-[440px] shrink-0 group">
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
              <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold border border-white/20">
                HD Video Tutorial • {extra.videoDuration}
              </span>
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                {extra.type}
              </span>
            </div>
          </div>

          {/* Exercise Overview Information */}
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                  {exercise.name}
                </h1>
                <Badge
                  variant={
                    exercise.difficulty === "Beginner"
                      ? "accent"
                      : exercise.difficulty === "Intermediate"
                      ? "warning"
                      : "danger"
                  }
                >
                  {exercise.difficulty}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {exercise.description}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-xl bg-background/60 p-2.5 border border-border/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Dụng cụ</div>
                <div className="text-xs font-bold text-text-primary mt-0.5 truncate">{extra.equipment}</div>
              </div>

              <div className="rounded-xl bg-background/60 p-2.5 border border-border/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Tiêu hao</div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{extra.caloriesBurn}</div>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-xl bg-background/60 p-2.5 border border-border/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Nhóm cơ chính</div>
                <div className="text-xs font-bold text-accent-strong mt-0.5 truncate">{exercise.primaryMuscles.join(", ")}</div>
              </div>
            </div>

            {/* Target Muscles Badges */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Nhóm cơ kích hoạt:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {exercise.primaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-lg bg-accent text-white px-2.5 py-1 text-xs font-bold shadow-xs"
                  >
                    {m} (Chính)
                  </span>
                ))}
                {exercise.secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-lg bg-surface-elevated border border-border px-2.5 py-1 text-xs font-medium text-text-secondary"
                  >
                    {m} (Phụ)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 3. THE 3 TRAINING MODES MASTER TAB SELECTOR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-display text-lg font-black text-text-primary">
              Chọn phương thức tập luyện cho bài này
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Tùy chọn tự tập theo video chuẩn, hỗ trợ chấm form AI thời gian thực, hoặc kèm 1-1 với Huấn luyện viên.
            </p>
          </div>
        </div>

        {/* 3 Tabs Bar */}
        <div className={`grid grid-cols-1 ${aiEnabled ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2.5 rounded-2xl bg-surface p-2 border border-border/80 shadow-xs`}>
          <button
            type="button"
            onClick={() => setActiveMode("video-preset")}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all cursor-pointer ${
              mode === "video-preset"
                ? "bg-accent-soft text-accent-strong shadow-xs border border-accent/40 ring-1 ring-accent/30"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                mode === "video-preset" ? "bg-accent text-white" : "bg-surface border border-border"
              }`}
            >
              <Play size={16} className="fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-text-primary truncate">1. Video & Preset</div>
              <div className="text-[10px] text-text-secondary truncate">Tự tập theo giáo án có sẵn</div>
            </div>
          </button>

          {aiEnabled && (
            <button
              type="button"
              onClick={() => setActiveMode("ai-coach")}
              className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all cursor-pointer ${
                mode === "ai-coach"
                  ? "bg-accent-soft text-accent-strong shadow-xs border border-accent/40 ring-1 ring-accent/30"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                  mode === "ai-coach" ? "bg-accent text-white" : "bg-surface border border-border"
                }`}
              >
                <Bot size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-text-primary truncate flex items-center gap-1.5">
                  2. AI Coach
                  <span className="rounded bg-accent text-white px-1 py-0.2 text-[9px] font-black uppercase">Live</span>
                </div>
                <div className="text-[10px] text-text-secondary truncate">Camera đếm rep, đo góc, chấm form</div>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveMode("human-coach")}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all cursor-pointer ${
              mode === "human-coach"
                ? "bg-accent-soft text-accent-strong shadow-xs border border-accent/40 ring-1 ring-accent/30"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                mode === "human-coach" ? "bg-accent text-white" : "bg-surface border border-border"
              }`}
            >
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-text-primary truncate">{aiEnabled ? "3." : "2."} Coach Human 1-1</div>
              <div className="text-[10px] text-text-secondary truncate">Chấm video, Live 1-1, Giáo án riêng</div>
            </div>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="mt-4">
          {mode === "video-preset" && <VideoPresetTrainingMode exercise={exercise} extra={extra} />}
          {mode === "ai-coach" && <AICoachTrainingMode exercise={exercise} />}
          {mode === "human-coach" && <HumanCoachTrainingMode exercise={exercise} extra={extra} />}
        </div>
      </div>

      {/* 📖 4. HƯỚNG DẪN KỸ THUẬT TỪNG BƯỚC (START & BOTTOM POSITION CARDS) */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-7 shadow-elevated space-y-6">
        <div className="border-b border-border/70 pb-3">
          <h3 className="font-display text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
            <Info size={18} className="text-accent" />
            Kỹ thuật thực hiện chuẩn xác từng bước
          </h3>
        </div>

        {/* Step by Step Breakdown / Backend Movement Phases */}
        {exercise.details?.phases && exercise.details.phases.length > 0 ? (
          <div className="space-y-4">
            {exercise.details.phases.map((phase, idx) => (
              <div key={idx} className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white font-black text-xs shadow-xs">
                      {phase.order || idx + 1}
                    </div>
                    <div className="font-bold text-sm text-text-primary">
                      {phase.vietnameseName || phase.name}
                    </div>
                    {phase.name && phase.vietnameseName && (
                      <span className="text-xs text-text-secondary hidden sm:inline">({phase.name})</span>
                    )}
                  </div>

                  {phase.breathing && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 text-xs font-semibold">
                      <Wind size={12} />
                      {phase.breathing}
                    </span>
                  )}
                </div>

                {phase.description && (
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pl-8">
                    {phase.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 pl-8">
                  {phase.coachingCue && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 text-xs font-semibold border border-amber-500/20">
                      <Sparkles size={12} />
                      <span>Mẹo: {phase.coachingCue}</span>
                    </div>
                  )}
                  {phase.muscleFocus && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated border border-border px-2.5 py-1 text-xs text-text-secondary font-medium">
                      <Activity size={12} className="text-accent" />
                      <span>Kích hoạt: {phase.muscleFocus}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {extra.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm leading-relaxed">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white font-black text-xs shadow-xs mt-0.5">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-text-primary">{step.title}</div>
                  <p className="text-text-secondary text-xs">{step.description}</p>
                  <div className="text-[11px] text-accent-strong font-semibold flex items-center gap-1.5 pt-0.5">
                    <Sparkles size={12} />
                    Mẹo: {step.keyTip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visual 2-Position Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-2xl border border-border/80 bg-background/50 p-3 space-y-2">
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black/10">
              <img
                src={exercise.details?.anatomyImages?.[0]?.url || extra.startPositionImage}
                alt="Tư thế bắt đầu"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Tư thế chuẩn bị (Start Position)
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/50 p-3 space-y-2">
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black/10">
              <img
                src={exercise.details?.anatomyImages?.[1]?.url || extra.bottomPositionImage}
                alt="Tư thế hạ sâu"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-lime-500" />
                Tư thế hạ sâu (Bottom Position)
              </span>
            </div>
          </div>
        </div>

        {/* Common Mistakes & Corrections from Backend */}
        {exercise.details?.commonMistakes && exercise.details.commonMistakes.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/60">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle size={15} />
              Lỗi kỹ thuật thường gặp & Cách khắc phục:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exercise.details.commonMistakes.map((mistake, idx) => (
                <div key={idx} className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-text-primary">{mistake.name}</span>
                    {mistake.severity && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300">
                        {mistake.severity}
                      </span>
                    )}
                  </div>
                  {mistake.problem && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      <strong className="text-text-primary">Vấn đề: </strong>
                      {mistake.problem}
                    </p>
                  )}
                  {mistake.correction && (
                    <div className="rounded-xl bg-background/80 p-2.5 border border-border/50 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-bold">Cách sửa: </strong>
                        {mistake.correction}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Note Alert Card */}
        <div className="flex items-start gap-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Lưu ý an toàn & Phòng tránh chấn thương:
            </div>
            <p className="text-xs text-text-primary leading-relaxed">
              {exercise.details?.safety?.generalConsiderations ||
                exercise.details?.safety?.safetyCues?.join(". ") ||
                exercise.safetyNotes}
            </p>
            {exercise.details?.safety?.stopConditions && exercise.details.safety.stopConditions.length > 0 && (
              <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold pt-1">
                Dừng tập ngay khi: {exercise.details.safety.stopConditions.join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🌳 5. LỘ TRÌNH NÂNG CẤP (PROGRESSION TREE) */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-7 shadow-elevated space-y-4">
        <div className="border-b border-border/70 pb-3">
          <h3 className="font-display text-base sm:text-lg font-bold text-text-primary">
            Lộ trình tiến hoá động tác (Progression Tree)
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Các biến thể bổ trợ từ dễ đến khó để phát triển sức mạnh bền vững.
          </p>
        </div>

        <div className="pt-2">
          <ProgressionPath progression={exercise.progression} />
        </div>
      </div>
    </div>
  );
}
