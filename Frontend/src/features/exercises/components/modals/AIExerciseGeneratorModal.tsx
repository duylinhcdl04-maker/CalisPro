import { useState } from "react";
import { Sparkles, Wand2, X, Loader2, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import { toast } from "sonner";
import { aiGeneratorApi, GenerateExerciseResult } from "../../../ai-motion/api/aiGeneratorApi";
import { ExerciseFormData } from "../../types/exercise";
import { findCatalogMuscle } from "../anatomy/bodyMusclesAdapter";

interface AIExerciseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExercise: (data: Partial<ExerciseFormData>) => void;
  existingExerciseNames?: string[];
}

export function AIExerciseGeneratorModal({
  isOpen,
  onClose,
  onApplyExercise,
  existingExerciseNames = [],
}: AIExerciseGeneratorModalProps) {
  const [exerciseName, setExerciseName] = useState("");
  const [category, setCategory] = useState("Strength");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [specificGoal, setSpecificGoal] = useState("Calisthenics Mastery");
  const [targetMuscles, setTargetMuscles] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleGenerate() {
    if (!exerciseName.trim()) {
      toast.warning("Vui lòng nhập tên động tác (ví dụ: Muscle-Up, Dragon Flag, Pistol Squat).");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(`AI Gemini đang phân tích sinh cơ học cho: ${exerciseName}...`);

    try {
      const res: GenerateExerciseResult = await aiGeneratorApi.generateExercise({
        exerciseName: exerciseName.trim(),
        category,
        difficulty,
        specificGoal,
        targetMuscles: targetMuscles.trim() || undefined,
        existingExercises: existingExerciseNames,
      });

      if (res.success) {
        // Map response to ExerciseFormData structure
        const partialData: Partial<ExerciseFormData> = {
          basicInformation: {
            name: res.name,
            displayName: res.displayName,
            category: (res.category as any) || "Strength",
            difficulty: (res.difficulty as any) || "Intermediate",
            movementPattern: (res.movementPattern as any) || "Horizontal Push",
            equipment: (res.equipment as any) || ["No Equipment"],
            description: res.description,
            tags: res.tags,
          },
          media: {
            videoUrl: "", // User will upload via Cloudinary
            thumbnailUrl: "",
            phases: res.phases.map((p, idx) => ({
              id: `phase-${idx + 1}`,
              order: p.order,
              name: p.name,
              vietnameseName: p.vietnameseName,
              description: p.description,
              coachingCue: p.coachingCue,
              breathing: p.breathing,
              muscleFocus: p.muscleFocus,
            })),
          },
          muscles: {
            targets: res.muscleTargets.map((m) => ({
              muscleId: findCatalogMuscle(m.muscleCode)?.id ?? `muscle_${m.muscleCode.toLowerCase()}`,
              role: m.role,
              activationLevel: m.activationLevel,
              laterality: "BILATERAL",
              expectedSensations: ["MUSCLE_TENSION", "PUMP"],
              unexpectedSensations: ["JOINT_PAIN", "SHARP_PAIN"],
              userGuidance: m.userGuidance,
            })),
          },
          technique: {
            setup: res.setupInstructions,
            execution: res.executionInstructions,
            inhaleTiming: res.inhaleTiming || "",
            exhaleTiming: res.exhaleTiming || "",
            tempo: res.tempo,
            coachingCues: res.coachingCues.map((cue, idx) => ({
              id: `cue-${idx + 1}`,
              text: cue,
              priority: idx === 0 ? "HIGH" : "MEDIUM",
              category: "ALIGNMENT",
            })),
            commonMistakes: res.commonMistakes.map((m, idx) => ({
              id: `mistake-${idx + 1}`,
              name: m.name,
              problem: m.problem,
              whyItHappens: m.whyItHappens,
              correction: m.correction,
              severity: m.severity ?? (idx === 0 ? "HIGH" : "MEDIUM"),
            })),
            safety: {
              safetyCues: res.safetyCues,
              stopConditions: res.stopConditions ?? [],
              generalConsiderations: res.generalConsiderations ?? "",
              contraindications: res.contraindications ?? "",
            },
          },
          aiAnalysis: {
            enabled: true,
            landmarks: [],
            jointRules: [],
            romRules: [],
            tempoRule: res.tempoRule ?? {
              eccentricSec: 2,
              pauseBottomSec: 0,
              concentricSec: 1,
              pauseTopSec: 0,
              toleranceSec: 1,
            },
            errorRules: [],
          },
        };

        onApplyExercise(partialData);
        if (res.source === "FALLBACK") {
          // Gemini lỗi -> chỉ là khung dữ liệu mẫu, admin phải sửa lại cho đúng động tác
          toast.warning(`Gemini đang không phản hồi - đã điền DỮ LIỆU MẪU cho "${res.name}"`, {
            id: toastId,
            description: "Nội dung chưa phải phân tích riêng cho động tác này. Hãy chỉnh lại giai đoạn, nhóm cơ và kỹ thuật, hoặc thử sinh lại sau.",
            duration: 10000,
          });
        } else {
          toast.success(`Gemini đã phân tích xong động tác: ${res.name}`, {
            id: toastId,
            description: res.warnings?.length
              ? `Đã tự điều chỉnh ${res.warnings.length} giá trị không hợp lệ: ${res.warnings.slice(0, 3).join("; ")}`
              : res.deduplicationNote,
          });
        }
        onClose();
      } else {
        toast.error("Không thể sinh nội dung từ AI", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kết nối AI Generator", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent text-white shadow-md shadow-accent/30">
              <Sparkles size={18} />
            </span>
            <div>
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <span>AI Sinh Nhanh Động Tác Toàn Diện</span>
                <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">
                  Gemini + Deduplication
                </span>
              </h3>
              <p className="text-xs text-text-secondary">
                Tự động tạo từ A-Z: Định danh, 4 pha kỹ thuật, nhóm cơ giải phẫu, khẩu lệnh và an toàn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-text-primary block mb-1">
              Tên động tác Calisthenics bạn muốn tạo: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Muscle-Up, Handstand Push-Up, Dragon Flag, Pistol Squat..."
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-secondary block mb-1">Phân loại thể lực:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:outline-none"
              >
                <option value="Strength">Sức mạnh (Strength)</option>
                <option value="Skill">Kỹ năng tĩnh/động (Skill)</option>
                <option value="Endurance">Sức bền (Endurance)</option>
                <option value="Mobility">Độ linh hoạt (Mobility)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-text-secondary block mb-1">Cấp độ phù hợp:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:outline-none"
              >
                <option value="Beginner">Người mới (Beginner)</option>
                <option value="Intermediate">Trung cấp (Intermediate)</option>
                <option value="Advanced">Nâng cao (Advanced)</option>
                <option value="Expert">Chuyên gia (Expert)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-secondary block mb-1">Nhóm cơ mục tiêu (tùy chọn):</label>
              <input
                type="text"
                value={targetMuscles}
                onChange={(e) => setTargetMuscles(e.target.value)}
                placeholder="e.g. Lưng xô, tay trước, cơ lõi"
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-text-secondary block mb-1">Mục tiêu tập luyện:</label>
              <input
                type="text"
                value={specificGoal}
                onChange={(e) => setSpecificGoal(e.target.value)}
                placeholder="e.g. Sức mạnh tối đa, phục hồi khớp vai"
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 flex items-start gap-2.5 text-sky-500">
            <Cpu size={16} className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Gemini phân tích riêng cho động tác này</strong> (khoảng 10–30 giây): giai đoạn chuyển
              động, nhóm cơ, tempo, kỹ thuật, lỗi sai và an toàn. Hệ thống tự kiểm tra giá trị hợp lệ và tránh trùng với động tác đã có.
              Hãy rà soát lại nội dung chuyên môn trước khi xuất bản.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl border border-border bg-background text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !exerciseName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent text-xs font-black text-white hover:bg-accent-strong cursor-pointer shadow-lg shadow-accent/25 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang phân tích sinh cơ học...</span>
              </>
            ) : (
              <>
                <Wand2 size={15} />
                <span>Tự động sinh toàn bộ động tác</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
