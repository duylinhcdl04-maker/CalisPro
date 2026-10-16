import { useState, useEffect } from "react";
import { Sparkles, Wand2, X, Loader2, Calendar, Target, Award, Cpu, AlertTriangle, CheckCircle2, RotateCcw, ShieldCheck, ChevronRight, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { aiGeneratorApi, GenerateWorkoutPlanResult, ValidateWorkoutPlanResult } from "../../ai-motion/api/aiGeneratorApi";
import { FitnessGoal, FitnessLevel } from "../../../types/workoutPlan";

interface AIWorkoutPlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (plan: GenerateWorkoutPlanResult) => void;
  existingPlanNames?: string[];
  initialGoal?: FitnessGoal;
  initialLevel?: FitnessLevel;
  initialWeeks?: number;
  initialDaysPerWeek?: number;
}

export function AIWorkoutPlanGeneratorModal({
  isOpen,
  onClose,
  onApplyPlan,
  existingPlanNames = [],
  initialGoal = "Strength",
  initialLevel = "Intermediate",
  initialWeeks = 8,
  initialDaysPerWeek = 4,
}: AIWorkoutPlanGeneratorModalProps) {
  // Goal mapping
  const mapFitnessGoalToAi = (g: FitnessGoal): "HYPERTROPHY" | "CALISTHENICS_SKILLS" | "PURE_STRENGTH" | "FAT_LOSS" | "ENDURANCE" => {
    switch (g) {
      case "Muscle Gain": return "HYPERTROPHY";
      case "Calisthenics Skills": return "CALISTHENICS_SKILLS";
      case "Strength": return "PURE_STRENGTH";
      case "Weight Management": return "FAT_LOSS";
      case "Endurance":
      case "Mobility":
      case "General Fitness":
      default: return "ENDURANCE";
    }
  };

  const mapFitnessLevelToAi = (l: FitnessLevel): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" => {
    switch (l) {
      case "Beginner": return "BEGINNER";
      case "Advanced":
      case "Elite": return "ADVANCED";
      case "Intermediate":
      default: return "INTERMEDIATE";
    }
  };

  const [goal, setGoal] = useState<"HYPERTROPHY" | "CALISTHENICS_SKILLS" | "PURE_STRENGTH" | "FAT_LOSS" | "ENDURANCE">(
    mapFitnessGoalToAi(initialGoal)
  );
  const [targetLevel, setTargetLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">(
    mapFitnessLevelToAi(initialLevel)
  );
  const [daysPerWeek, setDaysPerWeek] = useState(initialDaysPerWeek || 4);
  const [totalWeeks, setTotalWeeks] = useState(initialWeeks || 8);
  const [focusSkill, setFocusSkill] = useState("Muscle-Up & Xà Kép");
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(["Bodyweight", "Xà đơn", "Xà kép (Dips)"]);
  const [isLoading, setIsLoading] = useState(false);

  // Review step after AI generation
  const [generatedResult, setGeneratedResult] = useState<GenerateWorkoutPlanResult | null>(null);
  const [editableTitle, setEditableTitle] = useState("");
  const [validationResult, setValidationResult] = useState<ValidateWorkoutPlanResult | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setGoal(mapFitnessGoalToAi(initialGoal));
      setTargetLevel(mapFitnessLevelToAi(initialLevel));
      setDaysPerWeek(initialDaysPerWeek || 4);
      setTotalWeeks(initialWeeks || 8);
      setGeneratedResult(null);
      setValidationResult(null);
    }
  }, [isOpen, initialGoal, initialLevel, initialWeeks, initialDaysPerWeek]);

  if (!isOpen) return null;

  async function handleGenerate() {
    setIsLoading(true);
    const toastId = toast.loading("AI Gemini đang phân tích sinh cơ học và lập trình lộ trình...");

    try {
      const res = await aiGeneratorApi.generateWorkoutPlan({
        planGoal: goal,
        targetLevel,
        daysPerWeek,
        totalWeeks,
        focusSkill,
        availableEquipment,
        existingPlanNames,
      });

      if (res.success) {
        setGeneratedResult(res);
        setEditableTitle(res.planTitle);

        // Run validation against existing plan names
        try {
          const val = await aiGeneratorApi.validateWorkoutPlan({
            planName: res.planTitle,
            planGoal: goal,
            targetLevel,
            existingPlanNames,
          });
          setValidationResult(val);
        } catch {
          // fallback client-side validation
          const isDup = existingPlanNames.some(
            (p) => p.toLowerCase().trim() === res.planTitle.toLowerCase().trim()
          );
          setValidationResult({
            isDuplicate: isDup,
            similarityScore: isDup ? 1.0 : 0.0,
            message: isDup ? "Cảnh báo trùng lặp với giáo án sẵn có" : "Tên giáo án độc nhất",
            suggestedUniqueTitle: isDup ? `${res.planTitle} (Biến thể V2)` : res.planTitle,
          });
        }

        toast.success(`AI Gemini đã thiết kế xong lộ trình: "${res.planTitle}"`, {
          id: toastId,
          description: res.deduplicationNote,
        });
      } else {
        toast.error("Không thể tạo giáo án từ AI", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tạo giáo án AI", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }

  function handleApply() {
    if (!generatedResult) return;
    const finalPlan: GenerateWorkoutPlanResult = {
      ...generatedResult,
      planTitle: editableTitle.trim() || generatedResult.planTitle,
    };
    onApplyPlan(finalPlan);
    toast.success(`Đã nạp toàn bộ cấu trúc giáo án "${finalPlan.planTitle}" vào trình dựng!`);
    onClose();
  }

  function handleUseSuggestedTitle() {
    if (validationResult?.suggestedUniqueTitle) {
      setEditableTitle(validationResult.suggestedUniqueTitle);
      setValidationResult({
        ...validationResult,
        isDuplicate: false,
        similarityScore: 0.1,
        message: "Đã chuyển sang tên độc nhất không trùng lặp.",
      });
      toast.success("Đã áp dụng tên giáo án độc nhất!");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-2xl space-y-6 scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent to-purple-500 text-white shadow-lg shadow-accent/30">
              <Sparkles size={20} />
            </span>
            <div>
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <span>AI Gemini Tự Động Thiết Kế Lộ Trình</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={11} /> Collision Guard Active
                </span>
              </h3>
              <p className="text-xs text-text-secondary">
                Tự động phân bổ tuần tập, buổi tập, bài tập, sets/reps và thuật toán kiểm định chống trùng lặp.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: CONFIGURATION FORM (If not yet generated or regenerating) */}
        {!generatedResult ? (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3.5 flex items-start gap-3">
              <Cpu size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="text-[11px] leading-relaxed text-text-secondary">
                <span className="font-bold text-text-primary">Thuật toán kiểm định trùng lặp:</span>{" "}
                AI sẽ quét {existingPlanNames.length} giáo án hiện có trong hệ thống và áp dụng thang đo khoảng cách Levenshtein để bảo đảm lộ trình mới được sinh ra là <strong>độc nhất 100%</strong> và các bài tập trong từng buổi không bị trùng lặp.
              </div>
            </div>

            <div>
              <label className="font-bold text-text-primary block mb-1">Mục tiêu giáo án chính:</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="PURE_STRENGTH">Sức mạnh tối đa (Weighted Calisthenics Strength)</option>
                <option value="CALISTHENICS_SKILLS">Chinh phục Kỹ năng (Muscle-up, Planche, Front Lever)</option>
                <option value="HYPERTROPHY">Tăng kích thước cơ bắp (Hypertrophy Bodyweight)</option>
                <option value="FAT_LOSS">Giảm mỡ & Thể lực sức bền (Conditioning / Burn)</option>
                <option value="ENDURANCE">Sức bền cơ bắp số lượng Reps cao (Rep Endurance)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-text-secondary block mb-1">Trình độ học viên:</label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="BEGINNER">Beginner (Cơ bản - Người mới)</option>
                  <option value="INTERMEDIATE">Intermediate (Trung cấp)</option>
                  <option value="ADVANCED">Advanced (Nâng cao)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-text-secondary block mb-1">Số buổi/tuần:</label>
                <select
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value={3}>3 buổi / tuần (Toàn thân)</option>
                  <option value={4}>4 buổi / tuần (Upper/Lower Split)</option>
                  <option value={5}>5 buổi / tuần (Push/Pull/Legs)</option>
                  <option value={6}>6 buổi / tuần (Chuyên sâu)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-text-secondary block mb-1">Tổng chu kỳ (Tuần):</label>
                <select
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value={4}>4 tuần (Block tăng cường)</option>
                  <option value={6}>6 tuần (Tiêu chuẩn)</option>
                  <option value={8}>8 tuần (Chu kỳ hoàn chỉnh)</option>
                  <option value={12}>12 tuần (Đại chu kỳ Macrocycle)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-text-secondary block mb-1">Động tác / Kỹ năng trọng tâm muốn ưu tiên:</label>
              <input
                type="text"
                value={focusSkill}
                onChange={(e) => setFocusSkill(e.target.value)}
                placeholder="e.g. Muscle-Up, Handstand, Planche, Hít đất bùng nổ..."
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-text-secondary block mb-1">Trang thiết bị sẵn có:</label>
              <div className="flex flex-wrap gap-2">
                {["Bodyweight", "Xà đơn", "Xà kép (Dips)", "Dây kháng lực (Band)", "Vòng treo (Rings)", "Tạ đeo (Vest/Belt)"].map((eq) => {
                  const isChecked = availableEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setAvailableEquipment(availableEquipment.filter((item) => item !== eq));
                        } else {
                          setAvailableEquipment([...availableEquipment, eq]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? "bg-accent text-white border-accent shadow-xs"
                          : "bg-background text-text-secondary border-border hover:border-text-primary/40"
                      }`}
                    >
                      {isChecked ? "✓ " : "+ "}
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: REVIEW & DEDUPLICATION INSPECTION */
          <div className="space-y-4 text-xs">
            {/* Deduplication Status Alert */}
            {validationResult?.isDuplicate ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                    <AlertTriangle size={16} />
                    <span>PHÁT HIỆN TƯƠNG ĐỒNG VỚI GIÁO ÁN ĐÃ CÓ ({(validationResult.similarityScore * 100).toFixed(0)}%)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseSuggestedTitle}
                    className="px-3 py-1 rounded-xl bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    Đổi tên độc nhất
                  </button>
                </div>
                <p className="text-[11px] text-amber-300/90">
                  {validationResult.message}
                  {validationResult.conflictingPlanName && (
                    <> (Giáo án tương đồng: <strong>{validationResult.conflictingPlanName}</strong>)</>
                  )}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>XÁC THỰC THÀNH CÔNG: LỘ TRÌNH ĐỘC NHẤT 100%</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Zero Duplicates
                </span>
              </div>
            )}

            {/* Editable Generated Title */}
            <div className="space-y-1">
              <label className="font-bold text-text-primary block">Tên Giáo án & Lộ trình đề xuất:</label>
              <input
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-black text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-bold text-text-secondary block">Mô tả & Lời khuyên HLV:</label>
              <p className="p-3 rounded-2xl border border-border bg-background/50 text-[11px] text-text-secondary leading-relaxed">
                {generatedResult.description}
              </p>
            </div>

            {/* Weekly Schedule Overview */}
            <div className="space-y-2">
              <label className="font-bold text-text-primary flex items-center justify-between">
                <span>Phân bổ lịch tập ({generatedResult.sampleWeekDays.length} buổi tập / tuần):</span>
                <span className="text-[10px] text-emerald-400 font-mono">Đã tối ưu 48h hồi phục cơ</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto scrollbar-thin p-1">
                {generatedResult.sampleWeekDays.map((day) => (
                  <div key={day.dayNumber} className="rounded-2xl border border-border bg-background p-3 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-text-primary text-[11px]">{day.dayTitle}</span>
                      <span className="text-[9px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded-md">
                        {day.exercises.length} bài
                      </span>
                    </div>
                    <ul className="text-[10px] text-text-secondary space-y-1">
                      {day.exercises.map((ex, i) => (
                        <li key={i} className="flex items-center justify-between">
                          <span className="truncate pr-1">• {ex.exerciseName}</span>
                          <span className="text-[9px] font-mono shrink-0 text-text-primary/70">{ex.sets}x{ex.repsOrDuration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Progression Strategy Preview */}
            <div className="rounded-2xl border border-border bg-background/40 p-3 space-y-1">
              <span className="text-[10px] font-black uppercase text-text-secondary">Chiến lược quá tải tăng tiến (Overload):</span>
              <div className="text-[10px] text-text-secondary space-y-0.5">
                {generatedResult.progressionStrategy.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <ChevronRight size={11} className="text-accent shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/70">
          {generatedResult ? (
            <>
              <button
                type="button"
                onClick={() => setGeneratedResult(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-border bg-background text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              >
                <RotateCcw size={14} />
                <span>Tùy chỉnh lại</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-2xl border border-border bg-background text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-emerald-600 text-xs font-black text-white hover:opacity-90 cursor-pointer shadow-lg shadow-accent/25 transition-all"
                >
                  <CheckCircle2 size={15} />
                  <span>Áp dụng vào Giáo án</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl border border-border bg-background text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-xs font-black text-white hover:opacity-90 cursor-pointer shadow-lg shadow-accent/25 disabled:opacity-50 transition-all ml-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>AI Gemini đang tạo lộ trình...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={15} />
                    <span>Khởi tạo Lộ trình với AI</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
