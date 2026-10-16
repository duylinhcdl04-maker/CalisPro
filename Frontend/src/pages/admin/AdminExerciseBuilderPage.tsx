import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useExerciseBasePath } from "../../features/exercises/useExerciseBasePath";
import { usePendingRevisions } from "../../features/exercises/revisionsApi";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ExerciseFormData,
  ExerciseCategory,
  DifficultyLevel,
  Equipment,
  MovementPattern,
} from "../../features/exercises/types/exercise";
import {
  DEFAULT_PUSH_UP_FORM_DATA_V2,
  BLANK_EXERCISE_FORM_DATA_V2,
} from "../../features/exercises/mock/exerciseMock";
import { workoutPlansService } from "../../services/mock/workoutPlansService";
import { ExerciseItem, FitnessLevel } from "../../types/workoutPlan";
import { findCatalogMuscle, normalizeMuscleTargets } from "../../features/exercises/components/anatomy/bodyMusclesAdapter";

import { ExerciseStepper, StepItem } from "../../components/admin/exercise-builder/ExerciseStepper";
import { BasicInformationStep } from "../../features/exercises/components/steps/BasicInformationStep";
import { MediaStep } from "../../features/exercises/components/steps/MediaStep";
import { MusclesMovementStep } from "../../features/exercises/components/steps/MusclesMovementStep";
import { TechniqueStep } from "../../features/exercises/components/steps/TechniqueStep";
import { AIMotionAnalysisStep } from "../../features/exercises/components/steps/AIMotionAnalysisStep";
import { ReviewStep } from "../../features/exercises/components/steps/ReviewStep";
import { ExerciseLivePreview } from "../../features/exercises/components/preview/ExerciseLivePreview";
import { AIExerciseGeneratorModal } from "../../features/exercises/components/modals/AIExerciseGeneratorModal";

const STEPS: StepItem[] = [
  { id: 1, label: "Thông tin cơ bản", subLabel: "Định danh & Phân loại" },
  { id: 2, label: "Media & Pha kỹ thuật", subLabel: "Video & Movement Phases" },
  { id: 3, label: "Giải phẫu & Nhóm cơ", subLabel: "body-muscles 3D Map" },
  { id: 4, label: "Kỹ thuật & Huấn luyện", subLabel: "Cues & Lỗi sai thường gặp" },
  { id: 5, label: "AI Motion Analysis", subLabel: "MediaPipe 33 Landmarks" },
  { id: 6, label: "Kiểm tra & Xuất bản", subLabel: "Review & Publish" },
];

const FORM_SECTIONS = ["basicInformation", "media", "muscles", "technique", "aiAnalysis"] as const;

const EQUIPMENT_OPTIONS: Equipment[] = [
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

const MOVEMENT_PATTERN_OPTIONS: MovementPattern[] = [
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

// Nhóm bài trong Thư viện (Push/Pull/...) suy ra từ category & movementPattern của form
function deriveLibraryCategory(formData: ExerciseFormData): ExerciseItem["category"] {
  const cat = (formData.basicInformation.category || "").toLowerCase();
  const pattern = (formData.basicInformation.movementPattern || "").toLowerCase();
  if (pattern.includes("pull") || cat.includes("pull")) return "Pull";
  if (pattern.includes("leg") || pattern.includes("squat") || pattern.includes("lunge") || pattern.includes("hinge")) return "Legs";
  if (pattern.includes("core") || cat.includes("endurance")) return "Core";
  if (pattern.includes("hold") || pattern.includes("locomotion") || cat.includes("skill")) return "Skill";
  if (cat.includes("mobility") || cat.includes("flexibility")) return "Mobility";
  return "Push";
}

function mapLibraryCategoryToForm(category: ExerciseItem["category"]): ExerciseCategory {
  switch (category) {
    case "Skill":
      return "Skill";
    case "Mobility":
      return "Mobility";
    case "Warmup":
      return "Conditioning";
    case "Cooldown":
      return "Recovery";
    default:
      return "Strength";
  }
}

function mapExerciseToFormData(found: ExerciseItem, prev: ExerciseFormData): ExerciseFormData {
  // Động tác đã lưu bằng Builder: khôi phục nguyên trạng form, bổ sung field mặc định còn thiếu
  // (dữ liệu cũ có thể thiếu key mới). Video/ảnh lấy từ cột riêng vì đó là nguồn chuẩn.
  const saved = found.builderData;
  if (saved) {
    return {
      ...prev,
      ...saved,
      id: found.id,
      status: found.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      basicInformation: { ...prev.basicInformation, ...saved.basicInformation },
      media: {
        ...prev.media,
        ...saved.media,
        videoUrl: found.videoUrl ?? saved.media?.videoUrl ?? "",
        thumbnailUrl: found.imageUrl || saved.media?.thumbnailUrl || "",
      },
      muscles: {
        ...prev.muscles,
        ...saved.muscles,
        targets: normalizeMuscleTargets(saved.muscles?.targets ?? []),
      },
      technique: {
        ...prev.technique,
        ...saved.technique,
        safety: { ...prev.technique.safety, ...saved.technique?.safety },
      },
      aiAnalysis: {
        ...prev.aiAnalysis,
        ...saved.aiAnalysis,
        tempoRule: { ...prev.aiAnalysis.tempoRule, ...saved.aiAnalysis?.tempoRule },
      },
    };
  }

  // Động tác cũ (tạo trước khi có builderData): dựng lại từ các cột cơ bản
  const movementPattern = MOVEMENT_PATTERN_OPTIONS.find(
    (p) => p.toLowerCase() === (found.movementPattern || "").toLowerCase()
  );
  const equipment = (found.equipment || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Equipment => EQUIPMENT_OPTIONS.includes(s as Equipment));

  return {
    ...prev,
    id: found.id,
    status: found.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    basicInformation: {
      ...prev.basicInformation,
      name: found.name,
      displayName: found.vietnameseName || found.name,
      category: mapLibraryCategoryToForm(found.category),
      difficulty: (found.difficulty === "Elite" ? "Expert" : found.difficulty) as DifficultyLevel,
      movementPattern: movementPattern ?? prev.basicInformation.movementPattern,
      equipment: equipment.length ? equipment : prev.basicInformation.equipment,
      description: found.description || "",
    },
    media: {
      ...prev.media,
      videoUrl: found.videoUrl || "",
      thumbnailUrl: found.imageUrl || "",
    },
    technique: {
      ...prev.technique,
      coachingCues: (found.cues || []).map((text, i) => ({
        id: `cue-${found.id}-${i}`,
        text,
        priority: "MEDIUM",
        category: "ALIGNMENT",
      })),
      // Khi xuất bản, lỗi sai được lưu dạng "Tên lỗi: Cách sửa" -> tách lại thành 2 trường
      commonMistakes: (found.commonMistakes || []).map((raw, i) => {
        const sep = raw.indexOf(":");
        const name = sep > 0 ? raw.slice(0, sep).trim() : raw.trim();
        const correction = sep > 0 ? raw.slice(sep + 1).trim() : "";
        return {
          id: `mistake-${found.id}-${i}`,
          name,
          problem: "",
          whyItHappens: "",
          correction,
          severity: "MEDIUM",
        };
      }),
    },
  };
}

export default function AdminExerciseBuilderPage() {
  const { base, isCoach } = useExerciseBasePath();
  const { id } = useParams<{ id: string }>();
  const editingId = id && /^\d+$/.test(id) ? Number(id) : undefined;
  const pendingRevisions = usePendingRevisions(editingId, editingId != null);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [formData, setFormData] = useState<ExerciseFormData>(() => BLANK_EXERCISE_FORM_DATA_V2);

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("Vừa xong");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Load existing exercise data if editing
  // Nạp lại TOÀN BỘ dữ liệu đã lưu vào form. Nếu thiếu trường nào (vd. videoUrl, cues),
  // lần lưu kế tiếp sẽ gửi giá trị rỗng và ghi đè mất dữ liệu cũ trong DB.
  useEffect(() => {
    if (!id || id === "new") return;
    workoutPlansService.getExerciseById(id).then((found) => {
      if (!found) {
        toast.error("Không tìm thấy động tác cần chỉnh sửa.");
        return;
      }
      setFormData((prev: ExerciseFormData) => mapExerciseToFormData(found, prev));
      setCompletedSteps([1, 2, 3, 4, 5, 6]);
    });
  }, [id]);

  // Các bước gửi lên một phần của section (vd. { media: { videoUrl } }). Merge vào state MỚI NHẤT
  // theo từng section để callback bất đồng bộ (upload xong sau vài chục giây) không ghi đè dữ liệu vừa nhập.
  function handleFormChange(updated: Partial<ExerciseFormData>) {
    setFormData((prev: ExerciseFormData) => {
      const next = { ...prev, ...updated };
      for (const key of FORM_SECTIONS) {
        if (updated[key]) {
          (next as any)[key] = { ...prev[key], ...updated[key] };
        }
      }
      return next;
    });
    setIsDirty(true);
  }

  // Bắt buộc có ảnh nền (thumbnail) thật trước khi lưu, nếu không thẻ động tác sẽ hiện ảnh mặc định
  function validateThumbnail(): boolean {
    const thumb = formData.media.thumbnailUrl?.trim() ?? "";
    if (!thumb) {
      toast.error("Vui lòng tải lên hoặc nhập URL ít nhất 1 ảnh bìa (Thumbnail) làm ảnh nền cho động tác.");
      setCurrentStep(2);
      return false;
    }
    if (thumb.startsWith("blob:") || thumb.startsWith("data:")) {
      toast.error("Ảnh bìa đang là file tạm trên máy. Hãy dùng nút \"Tải ảnh lên\" để đưa ảnh lên Cloudinary.");
      setCurrentStep(2);
      return false;
    }
    return true;
  }

  // Autosave simulation
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}:${now
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
      setLastSavedTime(timeStr);
      setIsDirty(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [formData, isDirty]);

  // Payload chung cho Lưu nháp & Xuất bản. builderData giữ TOÀN BỘ dữ liệu form để trang Edit
  // và trang Xem chi tiết nạp lại đầy đủ (phases, nhóm cơ, kỹ thuật, AI rules...).
  function buildExercisePayload(status: ExerciseItem["status"]): Partial<ExerciseItem> {
    const muscleName = (muscleId: string) =>
      findCatalogMuscle(muscleId)?.nameVi ?? muscleId;
    const targets = formData.muscles?.targets ?? [];
    const primaryMuscles = targets.filter((m) => m.role === "PRIMARY").map((m) => muscleName(m.muscleId));
    const secondaryMuscles = targets.filter((m) => m.role !== "PRIMARY").map((m) => muscleName(m.muscleId));
    const name = formData.basicInformation.name.trim() || "Bản nháp động tác";

    return {
      name,
      vietnameseName: formData.basicInformation.displayName?.trim() || name,
      imageUrl: formData.media.thumbnailUrl.trim(),
      videoUrl: formData.media.videoUrl,
      category: deriveLibraryCategory(formData),
      movementPattern: formData.basicInformation.movementPattern || "Standard",
      difficulty: ((formData.basicInformation.difficulty === "Expert" ? "Advanced" : formData.basicInformation.difficulty) as FitnessLevel) || "Beginner",
      primaryMuscles,
      secondaryMuscles,
      equipment: (formData.basicInformation.equipment || []).join(", ") || "No Equipment",
      description: formData.basicInformation.description || "",
      cues: formData.technique?.coachingCues?.map((c) => c.text).filter(Boolean) || [],
      commonMistakes:
        formData.technique?.commonMistakes
          ?.filter((m) => m.name)
          .map((m) => (m.correction ? `${m.name}: ${m.correction}` : m.name)) || [],
      status,
      builderData: { ...formData, status, updatedAt: new Date().toISOString() },
    };
  }

  async function persistExercise(status: ExerciseItem["status"]): Promise<ExerciseItem> {
    const payload = buildExercisePayload(status);
    if (id && id !== "new") {
      return workoutPlansService.updateExercise(id, payload);
    }
    return workoutPlansService.createExercise(payload);
  }

  async function handleSaveDraft() {
    if (!validateThumbnail()) return;
    setIsSaving(true);
    try {
      const saved = await persistExercise("DRAFT");
      const sentForReview = isCoach && formData.status === "PUBLISHED";   // bài đã xuất bản: chỉnh sửa của Coach chờ Admin duyệt
      setFormData((prev: ExerciseFormData) => ({ ...prev, id: saved.id, status: sentForReview ? "PUBLISHED" : "DRAFT" }));
      setIsDirty(false);
      toast.success(sentForReview ? "Đã gửi chỉnh sửa. Học viên chỉ thấy thay đổi sau khi Admin duyệt." : "Đã lưu bản nháp thành công!");
      // Lần lưu đầu của động tác mới -> chuyển sang URL Edit để các lần lưu sau cập nhật đúng bản ghi
      if (!id || id === "new") {
        navigate(`${base}/${saved.id}/edit`, { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu bản nháp.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!formData.basicInformation.name.trim()) {
      toast.error("Vui lòng nhập tên động tác trước khi xuất bản.");
      setCurrentStep(1);
      return;
    }
    if (!validateThumbnail()) return;

    setIsPublishing(true);
    try {
      // Coach chỉ soạn: lưu thành bản nháp (backend giữ nguyên trạng thái xuất bản), Admin sẽ xem và xuất bản
      const saved = await persistExercise(isCoach ? "DRAFT" : "PUBLISHED");
      toast.success(
        isCoach
          ? formData.status === "PUBLISHED"
            ? "Đã gửi chỉnh sửa. Học viên chỉ thấy thay đổi sau khi Admin duyệt."
            : "Đã lưu động tác. Admin sẽ xem lại và xuất bản vào Thư viện."
          : id && id !== "new"
          ? "Cập nhật động tác trong Thư viện thành công!"
          : "Xuất bản động tác vào Thư viện và lưu vào Database thành công!"
      );
      const sync = saved.aiSync;
      if (sync?.changed) {
        toast.success(
          `Đã đồng bộ AI Motion (v${sync.profileVersion}): ${sync.rulesSynced} quy tắc, ${sync.landmarksSynced} landmark.`
        );
        if (sync.rulesSkipped > 0) {
          toast.warning(
            `${sync.rulesSkipped} quy tắc chưa được engine hỗ trợ (vd. điều kiện Tăng dần/Giảm dần) nên chưa đồng bộ.`
          );
        }
      }
      setFormData((prev: ExerciseFormData) => ({ ...prev, status: isCoach && prev.status !== "PUBLISHED" ? "DRAFT" : "PUBLISHED" }));
      setIsDirty(false);
      navigate(base);
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi xuất bản.");
    } finally {
      setIsPublishing(false);
    }
  }

  function handleNextStep() {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < STEPS.length) {
      setCurrentStep((prev: number) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handlePublish();
    }
  }

  function handlePrevStep() {
    if (currentStep > 1) {
      setCurrentStep((prev: number) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      {/* 1. TOP STICKY HEADER */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={base}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              title="Quay lại Thư viện"
            >
              <ArrowLeft size={16} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-text-primary">
                  {formData.basicInformation.name ? formData.basicInformation.name : "Thêm mới Động tác Calisthenics"}
                </h1>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                    formData.status === "PUBLISHED"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {formData.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp (Draft)"}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary hidden sm:block">
                Hệ thống chuẩn hóa bài tập CalisHealth Sports Science & body-muscles Interactive Anatomy
              </p>
            </div>
          </div>

          {/* Autosave Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-text-secondary font-mono">
              <span
                className={`h-2 w-2 rounded-full ${
                  isDirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <span>{isDirty ? "Thay đổi chưa lưu" : `Đã lưu lúc ${lastSavedTime}`}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-2 text-xs font-black text-sky-400 hover:bg-sky-500/20 cursor-pointer shadow-xs transition-colors"
              title="Nhờ AI tự động phân tích và sinh toàn bộ dữ liệu động tác"
            >
              <Wand2 size={13} />
              <span>✨ AI Sinh Động Tác</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer shadow-xs"
            >
              <Save size={13} />
              <span className="hidden sm:inline">Lưu nháp</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-xs font-black text-white hover:bg-accent-strong cursor-pointer shadow-xs"
            >
              <Send size={13} />
              <span>{isCoach ? "Lưu & gửi Admin" : "Xuất bản"}</span>
            </button>
          </div>
        </div>
      </header>

      {pendingRevisions.isSuccess && pendingRevisions.data.length > 0 && (
        <div role="status" className="mx-auto mt-3 max-w-7xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
          Bài này có chỉnh sửa đang chờ Admin duyệt{isCoach ? " (của bạn)" : ""}. Học viên vẫn thấy nội dung đang xuất bản.{" "}
          <Link to={isCoach ? base : `${base}?revision=${pendingRevisions.data[0].id}`} className="font-black underline">{isCoach ? "Xem trong thư viện" : "Xem và duyệt"}</Link>
        </div>
      )}

      {/* 2. PROGRESS STEPPER */}
      <ExerciseStepper
        currentStep={currentStep}
        steps={STEPS}
        completedSteps={completedSteps}
        onSelectStep={(step: number) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* 3. MAIN WORKSPACE (70% FORM BUILDER / 30% LIVE PREVIEW) */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Step Form Builder (Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            {currentStep === 1 && (
              <BasicInformationStep formData={formData} onChange={handleFormChange} />
            )}
            {currentStep === 2 && (
              <MediaStep formData={formData} onChange={handleFormChange} />
            )}
            {currentStep === 3 && (
              <MusclesMovementStep formData={formData} onChange={handleFormChange} />
            )}
            {currentStep === 4 && (
              <TechniqueStep formData={formData} onChange={handleFormChange} />
            )}
            {currentStep === 5 && (
              <AIMotionAnalysisStep formData={formData} onChange={handleFormChange} />
            )}
            {currentStep === 6 && (
              <ReviewStep
                formData={formData}
                onChange={handleFormChange}
                onPublish={handlePublish}
                onSaveDraft={handleSaveDraft}
                isPublishing={isPublishing}
              />
            )}
          </div>

          {/* RIGHT: Sticky Live User Preview (Col 4) */}
          <div className="lg:col-span-4 sticky top-24">
            <ExerciseLivePreview formData={formData} />
          </div>
        </div>
      </main>

      {/* 4. BOTTOM FLOATING ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="rounded-2xl border border-border bg-background px-4 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer shadow-xs"
            >
              Lưu nháp
            </button>
            <span className="text-xs text-text-secondary hidden sm:inline">
              Bước {currentStep} / {STEPS.length}: {STEPS[currentStep - 1].label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Quay lại</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 rounded-2xl bg-accent px-5 py-2 text-xs font-black text-white hover:bg-accent-strong cursor-pointer shadow-xs"
            >
              <span>{currentStep === STEPS.length ? (isCoach ? "Hoàn tất & gửi Admin" : "Hoàn tất & Xuất bản") : "Tiếp theo"}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Exercise Generator Modal */}
      <AIExerciseGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyExercise={(aiData) => {
          setFormData((prev) => ({
            ...prev,
            ...aiData,
            // Preserve ID if editing
            id: prev.id,
          }));
          setIsDirty(true);
          setCompletedSteps([1, 2, 3, 4, 5, 6]);
        }}
      />
    </div>
  );
}
