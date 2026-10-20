import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Dumbbell,
  Activity,
  Play,
  Bot,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Info,
  Wind,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { Exercise } from "../../types";
import { Badge } from "../ui/Badge";
import { ProgressionPath } from "./ProgressionPath";
import { AICoachTrainingMode } from "./modes/AICoachTrainingMode";
import { ExerciseMedia } from "../../features/training/ExerciseMedia";

type TrainingModeKey = "video" | "ai-coach";

interface ExerciseDetailViewProps {
  exercise: Exercise;
}

/**
 * Trang chi tiết bài tập của học viên: CHỈ hiển thị dữ liệu thật của bài (do Coach nhập trong thư viện động tác).
 * Mục nào bài chưa có dữ liệu thì ẩn, không dùng ảnh/số liệu mẫu chung (calo, thời lượng video, ảnh tư thế stock...).
 */
export function ExerciseDetailView({ exercise }: ExerciseDetailViewProps) {
  const details = exercise.details;
  const [activeMode, setActiveMode] = useState<TrainingModeKey>("video");

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết bài tập vào bộ nhớ tạm");
    }
  }

  // ---- dữ liệu thật ----
  const heroImage = exercise.hasRealImage === false ? null : exercise.imageUrl;
  const category = details?.trainingCategory || null;
  const equipment = exercise.equipment && exercise.equipment.length > 0 ? exercise.equipment.join(", ") : null;
  const phases = details?.phases ?? [];
  const mistakes = details?.commonMistakes ?? [];
  const images = (details?.anatomyImages ?? []).filter((img) => !!img.url);
  const safetyText = details?.safety?.generalConsiderations || details?.safety?.safetyCues?.join(". ") || exercise.safetyNotes || "";
  const stopConditions = details?.safety?.stopConditions ?? [];
  const hasProgression = !!(exercise.progression.previous || exercise.progression.next);

  // Chỉ hiện phương thức tập mà bài thật sự có: video hướng dẫn (khi Coach đã nhập) và AI Coach (khi Coach bật tích hợp AI)
  const modes: { key: TrainingModeKey; title: string; hint: string; icon: typeof Play }[] = [];
  if (exercise.videoUrl) modes.push({ key: "video", title: "Video hướng dẫn", hint: "Xem kỹ thuật chuẩn của bài", icon: Play });
  if (details?.aiEnabled) modes.push({ key: "ai-coach", title: "AI Coach", hint: "Camera đếm rep, đo góc, chấm form", icon: Bot });
  const mode: TrainingModeKey | null = modes.some((m) => m.key === activeMode) ? activeMode : modes[0]?.key ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 md:px-8 md:py-6 pb-20">
      {/* 1. Điều hướng */}
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
        <Link
          to="/exercises"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Thư viện bài tập</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          title="Chia sẻ bài tập"
          aria-label="Chia sẻ bài tập"
        >
          <Share2 size={15} />
        </button>
      </div>

      {/* 2. Tổng quan bài */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-7 shadow-elevated space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {heroImage && (
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-black aspect-video sm:aspect-[16/10] w-full lg:w-[440px] shrink-0 group">
              <img src={heroImage} alt={exercise.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {category && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-end p-3">
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">{category}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 flex-1 min-w-0">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-text-primary tracking-tight">{exercise.name}</h1>
                <Badge variant={exercise.difficulty === "Beginner" ? "accent" : exercise.difficulty === "Intermediate" ? "warning" : "danger"}>
                  {exercise.difficulty}
                </Badge>
                {!heroImage && category && <Badge variant="accent">{category}</Badge>}
              </div>
              {exercise.description && <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{exercise.description}</p>}
            </div>

            <div className={`grid gap-2.5 pt-1 ${equipment ? "grid-cols-2" : "grid-cols-1"}`}>
              {equipment && (
                <div className="rounded-xl bg-background/60 p-2.5 border border-border/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Dụng cụ</div>
                  <div className="text-xs font-bold text-text-primary mt-0.5">{equipment}</div>
                </div>
              )}
              <div className="rounded-xl bg-background/60 p-2.5 border border-border/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Nhóm cơ chính</div>
                <div className="text-xs font-bold text-accent-strong mt-0.5">{exercise.primaryMuscles.join(", ")}</div>
              </div>
            </div>

            {(exercise.primaryMuscles.length > 0 || exercise.secondaryMuscles.length > 0) && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Nhóm cơ kích hoạt:</div>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primaryMuscles.map((m) => (
                    <span key={m} className="rounded-lg bg-accent text-white px-2.5 py-1 text-xs font-bold shadow-xs">{m} (Chính)</span>
                  ))}
                  {exercise.secondaryMuscles.map((m) => (
                    <span key={m} className="rounded-lg bg-surface-elevated border border-border px-2.5 py-1 text-xs font-medium text-text-secondary">{m} (Phụ)</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Phương thức tập: chỉ những gì bài có */}
      {mode && (
        <div className="space-y-4">
          {modes.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-2xl bg-surface p-2 border border-border/80 shadow-xs" role="tablist" aria-label="Phương thức tập luyện">
              {modes.map((m, i) => {
                const Icon = m.icon;
                const active = mode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveMode(m.key)}
                    className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all cursor-pointer ${
                      active
                        ? "bg-accent-soft text-accent-strong shadow-xs border border-accent/40 ring-1 ring-accent/30"
                        : "bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-accent text-white" : "bg-surface border border-border"}`}>
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-text-primary truncate">{i + 1}. {m.title}</div>
                      <div className="text-[10px] text-text-secondary truncate">{m.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {mode === "video" && (
            <div className="space-y-2">
              {modes.length === 1 && <h2 className="font-display text-lg font-black text-text-primary">Video hướng dẫn</h2>}
              <ExerciseMedia videoUrl={exercise.videoUrl ?? null} thumbnailUrl={heroImage} name={exercise.name} className="max-h-[460px]" />
            </div>
          )}
          {mode === "ai-coach" && <AICoachTrainingMode exercise={exercise} />}
        </div>
      )}

      {/* 4. Kỹ thuật thực hiện (chỉ khi bài có pha chuyển động thật) */}
      {(phases.length > 0 || images.length > 0 || mistakes.length > 0 || safetyText) && (
        <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-7 shadow-elevated space-y-6">
          {phases.length > 0 && (
            <>
              <div className="border-b border-border/70 pb-3">
                <h3 className="font-display text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Info size={18} className="text-accent" />
                  Kỹ thuật thực hiện từng bước
                </h3>
              </div>
              <div className="space-y-4">
                {phases.map((phase, idx) => (
                  <div key={idx} className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white font-black text-xs shadow-xs">
                          {phase.order || idx + 1}
                        </div>
                        <div className="font-bold text-sm text-text-primary">{phase.vietnameseName || phase.name}</div>
                        {phase.name && phase.vietnameseName && <span className="text-xs text-text-secondary hidden sm:inline">({phase.name})</span>}
                      </div>
                      {phase.breathing && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 text-xs font-semibold">
                          <Wind size={12} />
                          {phase.breathing}
                        </span>
                      )}
                    </div>
                    {phase.description && <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pl-8">{phase.description}</p>}
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
            </>
          )}

          {/* Ảnh minh họa do Coach tải lên cho bài này */}
          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {images.map((img, idx) => (
                <figure key={`${img.url}-${idx}`} className="rounded-2xl border border-border/80 bg-background/50 p-3 space-y-2">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black/10">
                    <img src={img.url} alt={img.caption || `Ảnh minh họa ${exercise.name}`} loading="lazy" className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                  {img.caption && <figcaption className="px-1 text-xs font-bold text-text-primary">{img.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}

          {mistakes.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border/60">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle size={15} />
                Lỗi kỹ thuật thường gặp & cách khắc phục:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mistakes.map((mistake, idx) => (
                  <div key={idx} className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-text-primary">{mistake.name}</span>
                      {mistake.severity && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300">{mistake.severity}</span>
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

          {safetyText && (
            <div className="flex items-start gap-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Lưu ý an toàn & phòng tránh chấn thương:</div>
                <p className="text-xs text-text-primary leading-relaxed">{safetyText}</p>
                {stopConditions.length > 0 && (
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold pt-1">Dừng tập ngay khi: {stopConditions.join(", ")}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Lộ trình nâng cấp (chỉ khi bài có bài trước/sau thật) */}
      {hasProgression && (
        <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-7 shadow-elevated space-y-4">
          <div className="border-b border-border/70 pb-3">
            <h3 className="font-display text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
              <Dumbbell size={18} className="text-accent" />
              Lộ trình tiến hoá động tác
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Các biến thể bổ trợ từ dễ đến khó để phát triển sức mạnh bền vững.</p>
          </div>
          <div className="pt-2">
            <ProgressionPath progression={exercise.progression} />
          </div>
        </div>
      )}
    </div>
  );
}
