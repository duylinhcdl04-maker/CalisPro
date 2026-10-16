import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Dumbbell,
  Gauge,
  Activity,
  Eye,
  Target,
  ArrowRight,
  ArrowLeft,
  ScanLine,
  Timer,
  Loader2,
  VideoOff,
  Edit,
  ExternalLink,
  BookOpen,
  Wind,
  ShieldAlert,
  ListOrdered,
  Ruler,
  Ban,
  Info,
} from "lucide-react";
import { apiClient } from "../../../lib/api/client";
import type { ExerciseItem } from "../../../types/workoutPlan";
import type { ExerciseFormData, MuscleTarget } from "../../../features/exercises/types/exercise";
import { findCatalogMuscle } from "../../../features/exercises/components/anatomy/bodyMusclesAdapter";
import { AnatomySelector } from "../../../features/exercises/components/anatomy/AnatomySelector";

// Shape trả về thực tế của GET /admin/ai/profiles/exercise/{id} (AiMotionDtos.AiProfileDto)
interface BackendMotionRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  metricType?: string;
  operator?: string;
  thresholdMin?: number | null;
  thresholdMax?: number | null;
  severity?: string;
  invalidRep: boolean;
  enabled: boolean;
  priority: number;
  feedbackMessage?: string;
}

interface BackendAiProfile {
  id: number;
  profileName?: string;
  poseModel?: string;
  repCountingEnabled: boolean;
  formAnalysisEnabled: boolean;
  voiceWarningEnabled: boolean;
  version?: string;
  status?: string;
  repDownCondition?: string;
  repUpCondition?: string;
  minRepDurationMs?: number;
  maxRepDurationMs?: number;
  minRomPercentage?: number;
  landmarks?: { id: number; landmarkName: string; required: boolean }[];
  rules?: BackendMotionRule[];
}

type TabKey = "phases" | "muscles" | "technique" | "safety" | "ai";
type AiLoadState = "idle" | "loading" | "error" | "unavailable";

interface ExerciseDetailModalProps {
  exercise: ExerciseItem;
  allExercises: ExerciseItem[];
  onClose: () => void;
  onEdit: (ex: ExerciseItem) => void;
  onSelectExercise: (ex: ExerciseItem) => void;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Advanced: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

const STATUS_LABEL: Record<ExerciseItem["status"], { label: string; cls: string }> = {
  PUBLISHED: { label: "Đang hoạt động", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  DRAFT: { label: "Bản nháp", cls: "bg-slate-500/10 text-text-secondary border-border" },
  ARCHIVED: { label: "Lưu trữ", cls: "bg-slate-500/10 text-text-secondary border-border" },
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  HIGH: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  WARNING: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  INFO: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  LOW: "bg-sky-500/10 text-sky-600 border-sky-500/30",
};

const ROLE_LABEL: Record<MuscleTarget["role"], string> = {
  PRIMARY: "Cơ chính",
  SECONDARY: "Cơ phụ trợ",
  STABILIZER: "Cơ ổn định",
};

const ACTIVATION_LEVEL: Record<MuscleTarget["activationLevel"], { label: string; pct: number }> = {
  LOW: { label: "Thấp", pct: 25 },
  MODERATE: { label: "Trung bình", pct: 50 },
  HIGH: { label: "Cao", pct: 75 },
  VERY_HIGH: { label: "Rất cao", pct: 100 },
};

const LATERALITY_LABEL: Record<MuscleTarget["laterality"], string> = {
  BILATERAL: "Hai bên",
  LEFT: "Bên trái",
  RIGHT: "Bên phải",
  CENTRAL: "Trung tâm",
};

const BREATHING_LABEL: Record<string, string> = {
  Inhale: "Hít vào",
  Exhale: "Thở ra",
  "Hold / Braced": "Nín thở / Gồng",
  Natural: "Thở tự nhiên",
};

const PRIORITY_LABEL: Record<string, string> = { HIGH: "Ưu tiên cao", MEDIUM: "Trung bình", LOW: "Thấp" };

const CONDITION_SYMBOL: Record<string, string> = {
  LESS_THAN: "<",
  LT: "<",
  LTE: "≤",
  GREATER_THAN: ">",
  GT: ">",
  GTE: "≥",
  EQUALS: "=",
  INCREASING: "↑ tăng dần",
  DECREASING: "↓ giảm dần",
  STABLE: "ổn định",
};

const ACTION_LABEL: Record<string, string> = {
  WARNING: "Cảnh báo",
  CRITICAL_STOP: "Dừng khẩn",
  FORM_CUE: "Nhắc form",
  REP_COUNT_TRIGGER: "Đếm rep",
};

// Nhận diện nguồn video: YouTube / Vimeo nhúng iframe, còn lại phát bằng <video>
function resolveVideoSource(url?: string): { kind: "youtube" | "vimeo" | "file"; src: string } | null {
  if (!url?.trim()) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", src: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "vimeo", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: "file", src: url };
}

function formatRange(condition: string | undefined, min?: number | null, max?: number | null, unit = ""): string {
  if ((condition === "BETWEEN" || condition === "OUTSIDE_RANGE") && min != null && max != null) {
    return `${condition === "OUTSIDE_RANGE" ? "ngoài " : ""}${min}${unit} – ${max}${unit}`;
  }
  const value = min ?? max;
  const symbol = CONDITION_SYMBOL[condition ?? ""] ?? condition ?? "";
  if (value == null) return symbol || "—";
  return `${symbol} ${value}${unit}`.trim();
}

function humanize(code?: string): string {
  return code ? code.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "—";
}

function muscleInfo(muscleId: string) {
  const m = findCatalogMuscle(muscleId);
  return { nameVi: m?.nameVi ?? muscleId, name: m?.name ?? "" };
}

export function ExerciseDetailModal({ exercise, allExercises, onClose, onEdit, onSelectExercise }: ExerciseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("phases");
  const [videoFailed, setVideoFailed] = useState(false);
  const [aiProfile, setAiProfile] = useState<BackendAiProfile | null>(null);
  const [aiState, setAiState] = useState<AiLoadState>("idle");

  const data = exercise.builderData;
  const video = resolveVideoSource(exercise.videoUrl);
  const isBackendExercise = /^\d+$/.test(exercise.id);
  const regression = allExercises.find((e) => e.id === exercise.regressionId);
  const progression = allExercises.find((e) => e.id === exercise.progressionId);
  const status = STATUS_LABEL[exercise.status] ?? STATUS_LABEL.DRAFT;

  const phases = [...(data?.media?.phases ?? [])].sort((a, b) => a.order - b.order);
  const muscleTargets = data?.muscles?.targets ?? [];
  const tags = data?.basicInformation?.tags ?? [];
  const equipment = data?.basicInformation?.equipment?.join(", ") || exercise.equipment || "—";
  const tempo = data?.technique?.tempo;

  // Reset khi chuyển sang động tác khác (vd. bấm vào progression/regression)
  useEffect(() => {
    setVideoFailed(false);
    setActiveTab("phases");
  }, [exercise.id]);

  // Esc để đóng & khóa scroll nền
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Tải cấu hình AI Motion runtime của động tác
  useEffect(() => {
    if (!isBackendExercise) {
      setAiProfile(null);
      setAiState("unavailable");
      return;
    }
    let cancelled = false;
    setAiState("loading");
    apiClient
      .get<BackendAiProfile>(`/admin/ai/profiles/exercise/${exercise.id}`)
      .then((res) => {
        if (cancelled) return;
        setAiProfile(res.data);
        setAiState("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setAiProfile(null);
        setAiState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [exercise.id, isBackendExercise]);

  const mistakesCount = data?.technique?.commonMistakes?.length ?? exercise.commonMistakes.length;
  const tabs: { key: TabKey; label: string; icon: typeof Layers; count?: number }[] = [
    { key: "phases", label: "Giai đoạn chuyển động", icon: ListOrdered, count: phases.length },
    { key: "muscles", label: "Nhóm cơ", icon: Target, count: muscleTargets.length || undefined },
    { key: "technique", label: "Kỹ thuật & Hơi thở", icon: CheckCircle2 },
    { key: "safety", label: "Lỗi sai & An toàn", icon: ShieldAlert, count: mistakesCount },
    { key: "ai", label: "AI Motion", icon: Sparkles },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-6xl max-h-[94vh] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="exercise-detail-title" className="text-xl font-black text-text-primary truncate">
                {exercise.name}
              </h2>
              <span className="rounded-lg bg-accent-soft px-2 py-0.5 text-[11px] font-extrabold text-accent-strong border border-accent/20">
                {exercise.category}
              </span>
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-extrabold border ${DIFFICULTY_STYLE[exercise.difficulty] ?? ""}`}>
                {exercise.difficulty}
              </span>
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold border ${status.cls}`}>{status.label}</span>
              {data?.version && (
                <span className="rounded-lg border border-border px-2 py-0.5 text-[11px] font-mono font-bold text-text-secondary">
                  v{data.version}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary">
              {exercise.vietnameseName !== exercise.name && <>{exercise.vietnameseName} • </>}
              {exercise.movementPattern}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="shrink-0 rounded-xl p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-5 sm:p-6">
            {!data && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-text-secondary">
                <Info size={15} className="mt-0.5 shrink-0 text-amber-500" />
                <p>
                  Động tác này được tạo trước khi hệ thống lưu đầy đủ dữ liệu Builder nên chỉ có thông tin cơ bản. Mở{" "}
                  <button type="button" onClick={() => onEdit(exercise)} className="font-bold text-accent-strong hover:underline cursor-pointer">
                    Chỉnh sửa
                  </button>{" "}
                  để bổ sung giai đoạn chuyển động, nhóm cơ, kỹ thuật và AI rules rồi lưu lại.
                </p>
              </div>
            )}

            {/* TOP: media + overview */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-5">
              <div className="space-y-2 min-w-0">
                <VideoPlayer
                  exercise={exercise}
                  video={video}
                  failed={videoFailed}
                  onFail={() => setVideoFailed(true)}
                  onEdit={() => onEdit(exercise)}
                />
                {video && !videoFailed && (
                  <a
                    href={exercise.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-accent-strong"
                  >
                    <ExternalLink size={11} /> Mở video trong tab mới
                  </a>
                )}
              </div>

              <div className="space-y-4 min-w-0">
                <div className="grid grid-cols-2 gap-2.5">
                  <StatTile icon={Gauge} label="Cấp độ" value={data?.basicInformation?.difficulty ?? exercise.difficulty} />
                  <StatTile icon={Layers} label="Mẫu chuyển động" value={exercise.movementPattern} />
                  <StatTile icon={Dumbbell} label="Dụng cụ" value={equipment} />
                  <StatTile icon={Timer} label="Tempo" value={tempo || "—"} mono />
                </div>

                <section className="space-y-1.5">
                  <SectionTitle icon={BookOpen}>Mô tả động tác</SectionTitle>
                  <p className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-line">
                    {exercise.description || "Chưa có mô tả kỹ thuật chi tiết."}
                  </p>
                </section>

                <section className="space-y-2">
                  <SectionTitle icon={Target}>Cơ tác động chính</SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.primaryMuscles.length ? (
                      exercise.primaryMuscles.map((m) => (
                        <span key={m} className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-text-secondary">—</span>
                    )}
                    {exercise.secondaryMuscles.map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-accent-soft/40 px-2 py-0.5 text-[11px] font-bold text-accent-strong border border-accent/20"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </section>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {(regression || progression) && (
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { ex: regression, label: "Dễ hơn (Regression)", icon: ArrowLeft },
                      { ex: progression, label: "Khó hơn (Progression)", icon: ArrowRight },
                    ].map(({ ex, label, icon: Icon }) =>
                      ex ? (
                        <button
                          key={label}
                          type="button"
                          onClick={() => onSelectExercise(ex)}
                          className="flex items-center gap-3 rounded-xl border border-border bg-background p-2 text-left hover:border-accent/40 hover:bg-surface-elevated cursor-pointer"
                        >
                          <img src={ex.imageUrl} alt="" className="h-9 w-12 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold text-text-secondary">{label}</p>
                            <p className="text-xs font-bold text-text-primary truncate">{ex.name}</p>
                          </div>
                          <Icon size={14} className="shrink-0 text-text-secondary" />
                        </button>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* TABS */}
            <div className="rounded-2xl border border-border bg-background">
              <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border p-1.5 no-scrollbar">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    type="button"
                    aria-selected={activeTab === t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === t.key
                        ? "bg-surface text-text-primary shadow-xs border border-border"
                        : "text-text-secondary hover:text-text-primary border border-transparent"
                    }`}
                  >
                    <t.icon size={13} className={t.key === "ai" ? "text-emerald-500" : ""} />
                    {t.label}
                    {t.count != null && (
                      <span className="rounded-full bg-surface-elevated px-1.5 text-[10px] font-bold text-text-secondary">{t.count}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-5">
                {activeTab === "phases" && <PhasesPanel phases={phases} />}
                {activeTab === "muscles" && <MusclesPanel data={data} exercise={exercise} />}
                {activeTab === "technique" && <TechniquePanel data={data} exercise={exercise} />}
                {activeTab === "safety" && <SafetyPanel data={data} exercise={exercise} />}
                {activeTab === "ai" && <AiPanel data={data} state={aiState} profile={aiProfile} />}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5 sm:px-6">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-text-secondary">
            {exercise.viewsCount != null && (
              <span className="flex items-center gap-1">
                <Eye size={12} /> {exercise.viewsCount.toLocaleString("vi-VN")} lượt xem
              </span>
            )}
            {exercise.completionCount != null && (
              <span className="flex items-center gap-1">
                <Activity size={12} /> {exercise.completionCount.toLocaleString("vi-VN")} lượt hoàn thành
              </span>
            )}
            {(data?.updatedAt || exercise.updatedAt) && (
              <span>Cập nhật: {new Date(data?.updatedAt || exercise.updatedAt!).toLocaleDateString("vi-VN")}</span>
            )}
          </div>
          <div className="flex gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => onEdit(exercise)}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
            >
              <Edit size={13} /> Chỉnh sửa bài tập
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ----------------------------- Shared bits ----------------------------- */

function SectionTitle({ icon: Icon, children }: { icon: typeof Layers; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-text-primary">
      <Icon size={13} className="text-accent-strong" /> {children}
    </h3>
  );
}

function StatTile({ icon: Icon, label, value, mono }: { icon: typeof Layers; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        <Icon size={12} className="text-accent-strong shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className={`mt-1 text-xs font-bold text-text-primary truncate ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Layers; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Icon size={20} className="text-text-secondary opacity-50" />
      <p className="text-xs text-text-secondary max-w-sm">{text}</p>
    </div>
  );
}

function Badge({ children, cls }: { children: ReactNode; cls?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${cls ?? "border-border text-text-secondary"}`}>
      {children}
    </span>
  );
}

function VideoPlayer({
  exercise,
  video,
  failed,
  onFail,
  onEdit,
}: {
  exercise: ExerciseItem;
  video: ReturnType<typeof resolveVideoSource>;
  failed: boolean;
  onFail: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
      {video && !failed ? (
        video.kind === "file" ? (
          <video
            key={video.src}
            src={video.src}
            poster={exercise.imageUrl}
            controls
            playsInline
            preload="metadata"
            onError={onFail}
            className="h-full w-full object-contain bg-black"
          />
        ) : (
          <iframe
            key={video.src}
            src={video.src}
            title={`Video hướng dẫn ${exercise.name}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        )
      ) : (
        <>
          <img src={exercise.imageUrl} alt={exercise.name} className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <div className="rounded-full bg-white/15 p-3 backdrop-blur-md border border-white/20">
              <VideoOff size={22} className="text-white" />
            </div>
            <p className="text-sm font-bold text-white">{failed ? "Không thể phát video" : "Chưa có video hướng dẫn"}</p>
            <p className="text-[11px] text-white/70 max-w-xs">
              {failed
                ? "Đường dẫn video không hợp lệ hoặc đã hết hạn. Hãy tải lại video trong trang chỉnh sửa."
                : "Thêm video mẫu để học viên và AI Motion Engine có chuẩn tham chiếu."}
            </p>
            <button
              type="button"
              onClick={onEdit}
              className="mt-1 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-900 hover:bg-white cursor-pointer"
            >
              <Play size={12} /> {failed ? "Cập nhật video" : "Thêm video"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------- Panels ------------------------------- */

function PhasesPanel({ phases }: { phases: ExerciseFormData["media"]["phases"] }) {
  const filled = phases.filter((p) => p.description || p.coachingCue || p.muscleFocus);
  if (!phases.length || !filled.length) {
    return <EmptyState icon={ListOrdered} text="Chưa phân rã giai đoạn chuyển động cho động tác này." />;
  }
  return (
    <ol className="relative space-y-4">
      {phases.map((p, i) => (
        <li key={p.id} className="relative flex gap-4">
          {/* timeline rail */}
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-black text-white">
              {i + 1}
            </span>
            {i < phases.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
          </div>
          <div className="flex-1 min-w-0 rounded-xl border border-border bg-surface p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-black text-text-primary">{p.name}</p>
                {p.vietnameseName && <p className="text-[11px] text-text-secondary">{p.vietnameseName}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge cls="border-sky-500/30 bg-sky-500/10 text-sky-600">
                  <Wind size={10} /> {BREATHING_LABEL[p.breathing] ?? p.breathing}
                </Badge>
                {p.muscleFocus && (
                  <Badge cls="border-accent/20 bg-accent-soft/40 text-accent-strong">
                    <Target size={10} /> {p.muscleFocus}
                  </Badge>
                )}
              </div>
            </div>
            <div className={`grid gap-3 ${p.mediaUrl ? "sm:grid-cols-[1fr_140px]" : ""}`}>
              <div className="space-y-2">
                <p className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-line">
                  {p.description || <span className="italic opacity-70">Chưa có mô tả.</span>}
                </p>
                {p.coachingCue && (
                  <p className="rounded-lg border-l-2 border-emerald-500 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-text-primary">
                    “{p.coachingCue}”
                  </p>
                )}
              </div>
              {p.mediaUrl && <img src={p.mediaUrl} alt={p.name} className="h-24 w-full rounded-lg object-cover" />}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function MusclesPanel({ data, exercise }: { data?: ExerciseFormData; exercise: ExerciseItem }) {
  const targets = data?.muscles?.targets ?? [];
  const images = data?.muscles?.anatomyImages?.length
    ? data.muscles.anatomyImages
    : data?.muscles?.anatomyImageUrl
      ? [{ id: "legacy", url: data.muscles.anatomyImageUrl, caption: data.muscles.anatomyImageCaption }]
      : [];

  if (!targets.length) {
    return exercise.primaryMuscles.length ? (
      <div className="space-y-2">
        <p className="text-xs text-text-secondary">Chưa cấu hình chi tiết nhóm cơ. Thông tin hiện có:</p>
        <div className="flex flex-wrap gap-1.5">
          {[...exercise.primaryMuscles, ...exercise.secondaryMuscles].map((m) => (
            <Badge key={m}>{m}</Badge>
          ))}
        </div>
      </div>
    ) : (
      <EmptyState icon={Target} text="Chưa cấu hình nhóm cơ tác động." />
    );
  }

  const groups = (["PRIMARY", "SECONDARY", "STABILIZER"] as const)
    .map((role) => ({ role, items: targets.filter((t) => t.role === role) }))
    .filter((g) => g.items.length);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-5">
        <div className="rounded-xl border border-border bg-surface p-3">
          <AnatomySelector targets={targets} onSelectMuscle={() => {}} readOnly />
        </div>
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.role} className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">
                {ROLE_LABEL[g.role]} ({g.items.length})
              </p>
              {g.items.map((t) => {
                const info = muscleInfo(t.muscleId);
                const act = ACTIVATION_LEVEL[t.activationLevel] ?? ACTIVATION_LEVEL.MODERATE;
                return (
                  <div key={t.muscleId} className="rounded-xl border border-border bg-surface p-3 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary">{info.nameVi}</p>
                        {info.name && <p className="text-[10px] text-text-secondary">{info.name}</p>}
                      </div>
                      <Badge>{LATERALITY_LABEL[t.laterality] ?? t.laterality}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${act.pct}%` }} />
                      </div>
                      <span className="w-20 text-right text-[10px] font-bold text-text-secondary">Kích hoạt {act.label}</span>
                    </div>
                    {t.userGuidance && <p className="text-[11px] italic text-text-secondary">“{t.userGuidance}”</p>}
                    {(t.expectedSensations?.length > 0 || t.unexpectedSensations?.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {t.expectedSensations?.map((s) => (
                          <Badge key={s} cls="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                            {humanize(s)}
                          </Badge>
                        ))}
                        {t.unexpectedSensations?.map((s) => (
                          <Badge key={s} cls="border-rose-500/30 bg-rose-500/10 text-rose-600">
                            <Ban size={9} /> {humanize(s)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Ảnh minh họa cơ tác động</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {images.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="group space-y-1">
                <img src={img.url} alt={img.caption ?? ""} className="aspect-square w-full rounded-lg object-cover border border-border group-hover:border-accent/40" />
                {img.caption && <p className="text-[10px] text-text-secondary line-clamp-2">{img.caption}</p>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TechniquePanel({ data, exercise }: { data?: ExerciseFormData; exercise: ExerciseItem }) {
  const t = data?.technique;
  const cues = t?.coachingCues?.length
    ? t.coachingCues
    : exercise.cues.map((text, i) => ({ id: String(i), text, priority: undefined, category: undefined }));
  const hasBreathing = t?.inhaleTiming || t?.exhaleTiming;

  if (!t?.setup && !t?.execution && !hasBreathing && !cues.length) {
    return <EmptyState icon={CheckCircle2} text="Chưa có hướng dẫn kỹ thuật cho động tác này." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        {t?.setup && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Tư thế chuẩn bị (Setup)</p>
            <p className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-line">{t.setup}</p>
          </div>
        )}
        {t?.execution && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Thực hiện (Execution)</p>
            <p className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-line">{t.execution}</p>
          </div>
        )}
        {(hasBreathing || t?.tempo) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {t?.inhaleTiming && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-sky-600">
                  <Wind size={11} /> Hít vào
                </p>
                <p className="mt-1 text-xs text-text-primary">{t.inhaleTiming}</p>
              </div>
            )}
            {t?.exhaleTiming && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-violet-600">
                  <Wind size={11} /> Thở ra
                </p>
                <p className="mt-1 text-xs text-text-primary">{t.exhaleTiming}</p>
              </div>
            )}
            {t?.tempo && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-text-secondary">
                  <Timer size={11} /> Tempo
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-text-primary">{t.tempo}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Khẩu lệnh huấn luyện ({cues.length})</p>
        {cues.length ? (
          <ol className="space-y-2.5">
            {cues.map((c, i) => (
              <li key={c.id} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-black text-emerald-600 border border-emerald-500/30">
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-[13px] leading-relaxed text-text-primary">{c.text}</p>
                  {(c.priority || c.category) && (
                    <div className="flex gap-1">
                      {c.priority && <Badge cls={SEVERITY_STYLE[c.priority]}>{PRIORITY_LABEL[c.priority] ?? c.priority}</Badge>}
                      {c.category && <Badge>{humanize(c.category)}</Badge>}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-text-secondary">—</p>
        )}
      </div>
    </div>
  );
}

function SafetyPanel({ data, exercise }: { data?: ExerciseFormData; exercise: ExerciseItem }) {
  const mistakes = data?.technique?.commonMistakes ?? [];
  const safety = data?.technique?.safety;
  const legacyMistakes = !mistakes.length ? exercise.commonMistakes : [];
  const hasSafety =
    safety && (safety.contraindications || safety.generalConsiderations || safety.safetyCues?.length || safety.stopConditions?.length);

  if (!mistakes.length && !legacyMistakes.length && !hasSafety) {
    return <EmptyState icon={ShieldAlert} text="Chưa ghi nhận lỗi sai thường gặp hay lưu ý an toàn." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-2.5">
        <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">
          Lỗi sai thường gặp ({mistakes.length || legacyMistakes.length})
        </p>
        {mistakes.map((m) => (
          <div key={m.id} className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <AlertTriangle size={13} className="shrink-0 text-rose-500" /> {m.name}
              </p>
              <Badge cls={SEVERITY_STYLE[m.severity]}>{m.severity}</Badge>
            </div>
            <dl className="space-y-1 text-[12px]">
              {m.problem && (
                <div>
                  <dt className="inline font-bold text-text-primary">Biểu hiện: </dt>
                  <dd className="inline text-text-secondary">{m.problem}</dd>
                </div>
              )}
              {m.whyItHappens && (
                <div>
                  <dt className="inline font-bold text-text-primary">Nguyên nhân: </dt>
                  <dd className="inline text-text-secondary">{m.whyItHappens}</dd>
                </div>
              )}
              {m.correction && (
                <div className="rounded-lg bg-emerald-500/5 px-2 py-1">
                  <dt className="inline font-bold text-emerald-600">Cách sửa: </dt>
                  <dd className="inline text-text-secondary">{m.correction}</dd>
                </div>
              )}
            </dl>
            {m.mediaUrl && <img src={m.mediaUrl} alt={m.name} className="h-28 w-full rounded-lg object-cover" />}
          </div>
        ))}
        {legacyMistakes.map((m, i) => (
          <div key={i} className="flex gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-500" />
            <p className="text-[13px] leading-relaxed text-text-secondary">{m}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Hướng dẫn an toàn</p>
        {hasSafety ? (
          <>
            {safety!.contraindications && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-rose-600">
                  <Ban size={11} /> Chống chỉ định
                </p>
                <p className="mt-1 text-[13px] text-text-secondary whitespace-pre-line">{safety!.contraindications}</p>
              </div>
            )}
            {safety!.safetyCues?.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="text-[10px] font-bold uppercase text-emerald-600">Lưu ý an toàn</p>
                <ul className="mt-1.5 space-y-1">
                  {safety!.safetyCues.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-[12px] text-text-secondary">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {safety!.stopConditions?.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-[10px] font-bold uppercase text-amber-600">Dừng tập ngay khi</p>
                <ul className="mt-1.5 space-y-1">
                  {safety!.stopConditions.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-[12px] text-text-secondary">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {safety!.generalConsiderations && (
              <p className="text-[12px] leading-relaxed text-text-secondary whitespace-pre-line">{safety!.generalConsiderations}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-text-secondary">Chưa có hướng dẫn an toàn.</p>
        )}
      </div>
    </div>
  );
}

function AiPanel({ data, state, profile }: { data?: ExerciseFormData; state: AiLoadState; profile: BackendAiProfile | null }) {
  const ai = data?.aiAnalysis;
  const enabledLandmarks = ai?.landmarks?.filter((l) => l.enabled).length ?? 0;
  const tempo = ai?.tempoRule;
  const hasBuilderAi = ai && (ai.jointRules?.length || ai.romRules?.length || ai.errorRules?.length);

  return (
    <div className="space-y-6">
      {/* Builder AI configuration */}
      {hasBuilderAi ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge cls={ai!.enabled ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : undefined}>
              <Sparkles size={10} /> {ai!.enabled ? "AI Motion đang bật" : "AI Motion đang tắt"}
            </Badge>
            <Badge>
              <ScanLine size={10} /> {enabledLandmarks}/{ai!.landmarks?.length ?? 33} landmarks
            </Badge>
            {tempo && (
              <Badge>
                <Timer size={10} /> Tempo {tempo.eccentricSec}-{tempo.pauseBottomSec}-{tempo.concentricSec}-{tempo.pauseTopSec}s (±
                {tempo.toleranceSec}s)
              </Badge>
            )}
          </div>

          {ai!.jointRules?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Quy tắc góc khớp ({ai!.jointRules.length})</p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-surface text-[10px] uppercase text-text-secondary">
                    <tr>
                      <th className="px-3 py-2 font-bold">Phép đo</th>
                      <th className="px-3 py-2 font-bold">Ngưỡng</th>
                      <th className="px-3 py-2 font-bold">Hành động</th>
                      <th className="px-3 py-2 font-bold">Phản hồi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ai!.jointRules.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 font-semibold text-text-primary">{r.measurement}</td>
                        <td className="px-3 py-2 font-mono font-bold text-text-primary whitespace-nowrap">
                          {formatRange(r.condition, r.targetValue, r.secondaryValue, "°")}
                          <span className="ml-1 font-normal text-text-secondary">±{r.tolerance}°</span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge cls={r.action === "CRITICAL_STOP" ? SEVERITY_STYLE.CRITICAL : r.action === "WARNING" ? SEVERITY_STYLE.WARNING : undefined}>
                            {ACTION_LABEL[r.action] ?? r.action}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-text-secondary">{r.message || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ai!.romRules?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Biên độ chuyển động – ROM ({ai!.romRules.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ai!.romRules.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-surface p-3 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Ruler size={12} className="text-accent-strong" /> {r.movementName}
                    </p>
                    <p className="font-mono text-xs font-bold text-text-primary">
                      {r.minROM} – {r.maxROM} {r.unit} <span className="font-normal text-text-secondary">±{r.tolerance}</span>
                    </p>
                    {r.description && <p className="text-[11px] text-text-secondary">{r.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ai!.errorRules?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Quy tắc nhận diện lỗi ({ai!.errorRules.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ai!.errorRules.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-text-primary">{r.ruleName}</p>
                      <Badge cls={SEVERITY_STYLE[r.severity]}>{r.severity}</Badge>
                    </div>
                    <p className="text-[10px] font-semibold text-text-secondary">{r.category}</p>
                    {r.conditionDescription && <p className="text-[11px] text-text-secondary">{r.conditionDescription}</p>}
                    {r.aiFeedback && <p className="text-[11px] italic text-text-primary">“{r.aiFeedback}”</p>}
                    {r.correctionCue && <p className="text-[11px] text-emerald-600">→ {r.correctionCue}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={Sparkles} text="Chưa cấu hình quy tắc AI Motion trong Builder (bước 5)." />
      )}

      {/* Runtime profile from AI Motion service */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-text-primary">Hồ sơ AI Motion đang chạy (runtime)</p>
        <RuntimeProfile state={state} profile={profile} />
      </div>
    </div>
  );
}

function RuntimeProfile({ state, profile }: { state: AiLoadState; profile: BackendAiProfile | null }) {
  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-text-secondary">
        <Loader2 size={14} className="animate-spin" /> Đang tải cấu hình AI Motion...
      </div>
    );
  }
  if (state === "unavailable") {
    return <p className="text-xs text-text-secondary">Động tác chưa được đồng bộ lên hệ thống nên chưa có hồ sơ AI runtime.</p>;
  }
  if (state === "error" || !profile) {
    return <p className="text-xs text-text-secondary">Không thể tải hồ sơ AI Motion. Vui lòng kiểm tra kết nối backend.</p>;
  }

  const rules = (profile.rules ?? []).filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);
  const requiredLandmarks = profile.landmarks?.filter((l) => l.required).length ?? 0;
  const features = [
    { on: profile.repCountingEnabled, label: "Đếm rep" },
    { on: profile.formAnalysisEnabled, label: "Phân tích form" },
    { on: profile.voiceWarningEnabled, label: "Cảnh báo giọng nói" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge cls="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
          {profile.profileName || "AI Motion Profile"} • {profile.status ?? "DRAFT"}
          {profile.version && ` • v${profile.version}`}
        </Badge>
        {features.map((f) => (
          <Badge key={f.label} cls={f.on ? "border-emerald-500/30 text-emerald-600" : "border-border text-text-secondary line-through"}>
            {f.label}
          </Badge>
        ))}
        <Badge>{profile.poseModel ?? "—"}</Badge>
        <Badge>
          Landmarks bắt buộc {requiredLandmarks}/{profile.landmarks?.length ?? 33}
        </Badge>
        {profile.minRomPercentage != null && <Badge>ROM tối thiểu {profile.minRomPercentage}%</Badge>}
        {profile.minRepDurationMs != null && profile.maxRepDurationMs != null && (
          <Badge>
            1 rep {(profile.minRepDurationMs / 1000).toFixed(1)}–{(profile.maxRepDurationMs / 1000).toFixed(1)}s
          </Badge>
        )}
      </div>
      {rules.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rules.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-2.5 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-text-primary">{r.ruleName}</p>
                <Badge cls={SEVERITY_STYLE[r.severity ?? ""] ?? SEVERITY_STYLE.INFO}>{r.severity ?? "INFO"}</Badge>
              </div>
              <p className="text-[11px] text-text-secondary">
                {humanize(r.metricType)}{" "}
                <span className="font-mono font-bold text-text-primary">
                  {formatRange(r.operator, r.thresholdMin, r.thresholdMax, r.metricType?.includes("ANGLE") ? "°" : "")}
                </span>
                {r.invalidRep && <span className="ml-2 font-bold text-rose-600">Không tính rep</span>}
              </p>
              {r.feedbackMessage && <p className="text-[11px] italic text-text-secondary">“{r.feedbackMessage}”</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-secondary">Chưa có quy tắc runtime nào được bật.</p>
      )}
    </div>
  );
}
