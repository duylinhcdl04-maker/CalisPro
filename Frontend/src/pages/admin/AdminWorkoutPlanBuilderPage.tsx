import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Dumbbell,
  Layers,
  Sliders,
  Calendar,
  Settings,
  Flame,
  X,
  Search,
  MoveUp,
  MoveDown,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { workoutPlansService } from "../../services/mock/workoutPlansService";
import { apiClient } from "../../lib/api/client";
import { SESSION_ROLE_ORDER, canonicalSection, sessionRoleLabel, type SessionRole } from "../../features/exercises/constants/sessionRoles";
import { useWorkoutPlanScope } from "../../features/workout-plans/useWorkoutPlanScope";
import { programTemplatesApi } from "../../features/workout-plans/api/programTemplatesApi";
import { AIWorkoutPlanGeneratorModal } from "../../features/workout-plans/components/AIWorkoutPlanGeneratorModal";
import { GenerateWorkoutPlanResult } from "../../features/ai-motion/api/aiGeneratorApi";
import {
  WorkoutPlan,
  WorkoutWeek,
  TrainingDay,
  WorkoutSection,
  WorkoutExercisePrescription,
  ExerciseItem,
  FitnessGoal,
  FitnessLevel,
  PrescriptionType,
  IntensityType,
} from "../../types/workoutPlan";
import { EQUIPMENT_OPTIONS, SKILL_GOALS } from "../../features/workout-plans/api/programTemplatesApi";

/** Thang level của Level Engine (L0–L4) - khung sản phẩm CalisHealth. */
const LEVEL_ORDER: FitnessLevel[] = ["Foundation", "Beginner", "Intermediate", "Advanced", "Elite"];
const LEVEL_LABELS: Record<FitnessLevel, string> = {
  Foundation: "L0 · Foundation (Nền tảng)",
  Beginner: "L1 · Beginner (Cơ bản)",
  Intermediate: "L2 · Intermediate (Trung cấp)",
  Advanced: "L3 · Advanced (Nâng cao)",
  Elite: "L4 · Elite (cần coach duyệt)",
};

/** Mỗi buổi tập có đủ 4 phần theo thứ tự cố định; phần cũ kiểu "SKILL" được gộp vào Bài chính. */
function withFourSections(plan: WorkoutPlan): WorkoutPlan {
  return {
    ...plan,
    weeks: plan.weeks.map((w) => ({
      ...w,
      days: w.days.map((d) => {
        if (d.dayType === "REST") return d;
        const byType = new Map<SessionRole, WorkoutSection>();
        for (const sec of d.sections) {
          const type = canonicalSection(sec.sectionType);
          if (!type) continue;
          const existing = byType.get(type);
          byType.set(type, existing ? { ...existing, exercises: [...existing.exercises, ...sec.exercises] } : { ...sec, sectionType: type });
        }
        const sections = SESSION_ROLE_ORDER.map((type, i) => {
          const sec = byType.get(type);
          return { id: sec?.id ?? `sec-${type.toLowerCase()}-${d.id}`, name: sessionRoleLabel(type), sectionType: type, order: i + 1, exercises: sec?.exercises ?? [] } as WorkoutSection;
        });
        return { ...d, sections };
      }),
    })),
  };
}

type AiReadiness = Record<string, { ready: boolean; formScoring: boolean }>;

/** Các điểm chưa đạt của một buổi tập: phần trống, bài chính chưa có bài AI đo được. */
function dayIssues(day: TrainingDay, ai: AiReadiness): string[] {
  if (day.dayType === "REST") return [];
  const issues: string[] = [];
  for (const type of SESSION_ROLE_ORDER) {
    const sec = day.sections.find((x) => x.sectionType === type);
    if (!sec || sec.exercises.length === 0) issues.push(`Thiếu phần "${sessionRoleLabel(type)}"`);
  }
  const main = day.sections.find((x) => x.sectionType === "MAIN");
  if (main && main.exercises.length > 0 && !main.exercises.some((e) => ai[String(e.exerciseId)]?.ready)) issues.push('Phần "Bài chính" chưa có bài nào đo được bằng AI');
  return issues;
}

export default function AdminWorkoutPlanBuilderPage() {
  const { base, isCoach } = useWorkoutPlanScope();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>("Vừa xong");
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);

  // Modals
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [targetSectionContext, setTargetSectionContext] = useState<{ dayId: string; sectionId: string } | null>(null);
  const [isConfigExerciseOpen, setIsConfigExerciseOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<WorkoutExercisePrescription | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<ExerciseItem[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState("ALL");
  const [aiReadiness, setAiReadiness] = useState<AiReadiness>({});

  // Deduplication State
  const [existingPlanNames, setExistingPlanNames] = useState<string[]>([]);
  const [planTitleDuplicateWarning, setPlanTitleDuplicateWarning] = useState<string | null>(null);

  // Main Builder State
  const [plan, setPlan] = useState<WorkoutPlan>({
    id: `plan-${Date.now()}`,
    name: "Giáo án Calisthenics mới",
    description: "Xây dựng sức mạnh và làm chủ các chuyển động trọng lượng cơ thể.",
    primaryGoal: "Strength",
    secondaryGoals: ["Muscle Gain"],
    fitnessLevel: "Beginner",
    durationWeeks: 8,
    frequencyDaysPerWeek: 3,
    sessionDurationMinutes: 40,
    equipmentRequired: ["Không dụng cụ (Bodyweight)"],
    programType: "Structured Program",
    status: "DRAFT",
    version: "1.0",
    assignedUsersCount: 0,
    completionRate: 0,
    averageRating: 0,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: "Coach Calis",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
    weeks: [
      {
        id: "w-1",
        weekNumber: 1,
        title: "Tuần 1: Khởi động & Xây dựng Thể lực Nền tảng",
        objective: "Thiết lập khối lượng cơ sở (Baseline Volume) và kiểm tra chuẩn form chuyển động.",
        progressionTarget: {
          type: "Volume",
          targetDescription: "Thực hiện 3 hiệp với dải 8-10 reps mỗi bài compound.",
        },
        coachNotes: "Nghỉ đủ 90 giây giữa các hiệp hít đất.",
        days: [
          {
            id: "d-1",
            dayNumber: 1,
            dayOfWeekTitle: "Thứ 2",
            name: "Push Strength & Hypertrophy",
            focus: "Ngực, Tay sau và Khớp vai",
            dayType: "WORKOUT",
            estimatedDurationMinutes: 40,
            difficulty: "Beginner",
            primaryMuscleGroups: ["Ngực", "Tay sau"],
            sections: [
              {
                id: "sec-warmup",
                name: "Khởi động làm ấm khớp (Warm-up)",
                sectionType: "WARMUP",
                order: 1,
                exercises: [],
              },
              {
                id: "sec-main",
                name: "Bài tập chính (Main Workout)",
                sectionType: "MAIN",
                order: 2,
                exercises: [
                  {
                    id: `p-${Date.now()}-1`,
                    exerciseId: "ex-push-1",
                    exerciseName: "Push Up",
                    exerciseCategory: "Push",
                    exerciseDifficulty: "Beginner",
                    exerciseImageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
                    sets: 3,
                    prescriptionType: "REP_RANGE",
                    reps: "8 - 10",
                    restSeconds: 90,
                    tempo: "2-0-1-0",
                    intensityType: "RPE",
                    rpe: 7,
                    rir: 2,
                    coachingCues: "Khóa chặt cơ bụng, hạ chạm nhẹ ngực xuống đất",
                  },
                ],
              },
              {
                id: "sec-cooldown",
                name: "Giãn cơ & Hạ nhiệt (Cooldown)",
                sectionType: "COOLDOWN",
                order: 3,
                exercises: [],
              },
            ],
          },
          {
            id: "d-2",
            dayNumber: 2,
            dayOfWeekTitle: "Thứ 4",
            name: "Pull & Lưng Xô — Sức kéo",
            focus: "Lưng xô, Tay trước và Cẳng tay",
            dayType: "WORKOUT",
            estimatedDurationMinutes: 35,
            difficulty: "Beginner",
            primaryMuscleGroups: ["Lưng xô", "Tay trước"],
            sections: [
              {
                id: "sec-pull-main",
                name: "Bài tập chính (Main Workout)",
                sectionType: "MAIN",
                order: 1,
                exercises: [
                  {
                    id: `p-${Date.now()}-2`,
                    exerciseId: "ex-pull-1",
                    exerciseName: "Australian Pull Up",
                    exerciseCategory: "Pull",
                    exerciseDifficulty: "Beginner",
                    exerciseImageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
                    sets: 3,
                    prescriptionType: "REP_RANGE",
                    reps: "8 - 10",
                    restSeconds: 90,
                    tempo: "2-1-1-0",
                    intensityType: "RPE",
                    rpe: 7,
                    coachingCues: "Kéo ngực chạm thanh xà, siết bả vai",
                  },
                ],
              },
            ],
          },
          {
            id: "d-3",
            dayNumber: 3,
            dayOfWeekTitle: "Thứ 6",
            name: "Legs & Core Conditioning",
            focus: "Đùi trước, Mông và Cơ lõi bụng",
            dayType: "WORKOUT",
            estimatedDurationMinutes: 35,
            difficulty: "Beginner",
            primaryMuscleGroups: ["Chân mông", "Core"],
            sections: [],
          },
        ],
      },
    ],
  });

  // Load existing plan if editing
  useEffect(() => {
    async function load() {
      if (isEditing && id) {
        try {
          const loaded = await workoutPlansService.getWorkoutPlanById(id);
          if (loaded) setPlan(withFourSections(loaded));
        } catch {
          toast.error("Không thể tải thông tin giáo án");
        }
      }
      if (!(isEditing && id)) setPlan((p) => withFourSections(p));
      const exercises = await workoutPlansService.getExerciseLibrary();
      setAvailableExercises(exercises);
      try {
        setAiReadiness((await apiClient.get<AiReadiness>("/exercises/ai-readiness")).data ?? {});
      } catch {
        setAiReadiness({});   // không tải được: không hiện cảnh báo AI thay vì báo sai
      }

      // Load all existing plans for deduplication
      try {
        const allPlans = await workoutPlansService.getWorkoutPlans();
        const names = allPlans.map((p) => p.name).filter(Boolean);
        setExistingPlanNames(names);
      } catch (err) {
        console.warn("Could not load existing plans for deduplication", err);
      }

      setIsLoading(false);
    }
    load();
  }, [id, isEditing]);

  // Real-time title duplicate validation
  function checkPlanTitleDuplicate(title: string) {
    if (!title || !title.trim()) {
      setPlanTitleDuplicateWarning(null);
      return;
    }
    const clean = title.trim().toLowerCase();
    const otherPlanNames = existingPlanNames.filter(
      (n) => n.trim().toLowerCase() !== (plan.name || "").trim().toLowerCase() || !isEditing
    );
    const exactMatch = otherPlanNames.find((n) => n.trim().toLowerCase() === clean);
    if (exactMatch) {
      setPlanTitleDuplicateWarning(`Tên giáo án trùng khớp 100% với "${exactMatch}". Khuyến nghị thêm số phiên bản (V2) hoặc chi tiết mục tiêu.`);
      return;
    }
    const fuzzyMatch = otherPlanNames.find((n) => {
      const otherClean = n.trim().toLowerCase();
      return otherClean.includes(clean) || clean.includes(otherClean);
    });
    if (fuzzyMatch) {
      setPlanTitleDuplicateWarning(`Tên giáo án có độ tương đồng cao với "${fuzzyMatch}".`);
      return;
    }
    setPlanTitleDuplicateWarning(null);
  }

  // Lưu giáo án: nếu đang tạo mới thì tạo bản ghi lần đầu, sau đó chuyển sang URL chỉnh sửa
  // để các lần lưu/xuất bản tiếp theo cập nhật đúng bản ghi (tránh tạo trùng & lệch id).
  async function persistPlan(data: WorkoutPlan): Promise<WorkoutPlan> {
    if (isEditing && id) {
      const saved = await workoutPlansService.updateWorkoutPlan(id, data);
      // Giáo án đã xuất bản và đang có học viên dùng: backend tạo phiên bản mới (id mới), bản cũ được lưu trữ
      if (saved.id !== id) {
        setPlan((prev) => ({ ...prev, id: saved.id, version: saved.version }));
        navigate(`${base}/${saved.id}/edit`, { replace: true });
        toast.info(`Đã tạo phiên bản mới v${saved.version} - các học viên đang tập giữ nguyên phiên bản cũ.`);
      }
      return saved;
    }
    const created = await workoutPlansService.createWorkoutPlan(data);
    setPlan((prev) => ({ ...prev, id: created.id }));
    navigate(`${base}/${created.id}/edit`, { replace: true });
    return created;
  }

  // Autosave simulation
  async function handleSaveDraft() {
    try {
      await persistPlan(plan);
      setLastSavedTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      toast.success("Đã lưu bản nháp giáo án");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu giáo án");
    }
  }

  // Week Controls
  function handleAddWeek() {
    const nextNumber = plan.weeks.length + 1;
    const newWeek: WorkoutWeek = {
      id: `w-${Date.now()}`,
      weekNumber: nextNumber,
      title: `Tuần ${nextNumber}: Gia tăng Khối lượng & Thích nghi`,
      objective: "Tăng thể tích tập luyện hoặc độ khó chuyển động.",
      progressionTarget: {
        type: "Volume",
        targetDescription: "Tăng thêm +1 hiệp hoặc +2 reps cho các bài tập chính.",
      },
      coachNotes: "Kiểm tra form học viên trước khi nâng mức tạ/reps.",
      days: JSON.parse(JSON.stringify(plan.weeks[plan.weeks.length - 1]?.days || [])),
    };

    setPlan({
      ...plan,
      durationWeeks: Math.max(plan.durationWeeks, nextNumber),
      weeks: [...plan.weeks, newWeek],
    });
    setActiveWeekIndex(plan.weeks.length);
    toast.success(`Đã thêm Tuần ${nextNumber}`);
  }

  function handleDeleteWeek(weekIdx: number) {
    if (plan.weeks.length <= 1) {
      toast.error("Giáo án phải có tối thiểu 1 tuần tập luyện");
      return;
    }
    const updated = plan.weeks.filter((_, i) => i !== weekIdx).map((w, i) => ({ ...w, weekNumber: i + 1 }));
    setPlan({ ...plan, weeks: updated, durationWeeks: updated.length });
    setActiveWeekIndex(Math.max(0, weekIdx - 1));
    toast.success("Đã xóa tuần tập");
  }

  // Day Controls
  // Đánh lại số thứ tự ngày liên tục (1..n). Chỉ đổi tiêu đề dạng "Ngày X" tự sinh,
  // giữ nguyên tiêu đề tùy chỉnh như "Thứ 2".
  function renumberDays(days: TrainingDay[]): TrainingDay[] {
    return days.map((d, i) => ({
      ...d,
      dayNumber: i + 1,
      dayOfWeekTitle: /^Ngày \d+$/.test(d.dayOfWeekTitle) ? `Ngày ${i + 1}` : d.dayOfWeekTitle,
    }));
  }

  function handleAddDay(weekIdx: number) {
    const week = plan.weeks[weekIdx];
    const nextNumber = week.days.length + 1;
    const newDay: TrainingDay = {
      id: `d-${Date.now()}`,
      dayNumber: nextNumber,
      dayOfWeekTitle: `Ngày ${nextNumber}`,
      name: "Buổi tập bổ trợ & Kỹ năng",
      focus: "Toàn thân & Cơ lõi",
      dayType: "WORKOUT",
      estimatedDurationMinutes: 35,
      difficulty: plan.fitnessLevel,
      primaryMuscleGroups: ["Core", "Lưng xô"],
      sections: [],
    };

    const updatedWeeks = plan.weeks.map((w, i) =>
      i === weekIdx ? { ...w, days: renumberDays([...w.days, newDay]) } : w
    );
    setPlan(withFourSections({ ...plan, weeks: updatedWeeks }));
    toast.success("Đã thêm ngày tập mới");
  }

  function handleDeleteDay(weekIdx: number, dayId: string) {
    const updatedWeeks = plan.weeks.map((w, i) =>
      i === weekIdx ? { ...w, days: renumberDays(w.days.filter((d) => d.id !== dayId)) } : w
    );
    setPlan({ ...plan, weeks: updatedWeeks });
    toast.success("Đã xóa ngày tập");
  }

  function handleOpenExercisePicker(dayId: string, sectionId: string) {
    setTargetSectionContext({ dayId, sectionId });
    setIsExercisePickerOpen(true);
  }

  function handleSelectExerciseForSection(ex: ExerciseItem) {
    if (!targetSectionContext) return;
    const { dayId, sectionId } = targetSectionContext;

    const updatedWeeks = [...plan.weeks];
    const currentWeek = updatedWeeks[activeWeekIndex];
    const day = currentWeek.days.find((d) => d.id === dayId);
    const section = day?.sections.find((s) => s.id === sectionId);

    if (day && section) {
      const secType = canonicalSection(section.sectionType);
      if (secType && ex.sessionRoles && ex.sessionRoles.length > 0 && !ex.sessionRoles.includes(secType)) {
        toast.error(`"${ex.name}" không dùng được ở phần "${sessionRoleLabel(secType)}". Chọn bài khác hoặc đổi phần dùng được trong thông tin bài tập.`);
        return;
      }
      // 1. VALIDATION: Check duplicate in target section
      const isAlreadyInSection = section.exercises.some(
        (e) => e.exerciseId === ex.id || e.exerciseName.toLowerCase().trim() === ex.name.toLowerCase().trim()
      );
      if (isAlreadyInSection) {
        toast.error(`Bài tập "${ex.name}" đã có trong phân đoạn này! Vui lòng không thêm trùng lặp.`);
        setIsExercisePickerOpen(false);
        return;
      }

      // 2. VALIDATION: Check duplicate in other sections of the same day
      const isAlreadyInDay = day.sections.some(
        (sec) => sec.id !== sectionId && sec.exercises.some((e) => e.exerciseId === ex.id || e.exerciseName.toLowerCase().trim() === ex.name.toLowerCase().trim())
      );
      if (isAlreadyInDay) {
        toast.warning(`Lưu ý: "${ex.name}" đã có ở phân đoạn khác trong buổi tập này.`);
      }

      const prescription: WorkoutExercisePrescription = {
        id: `p-${Date.now()}`,
        exerciseId: ex.id,
        exerciseName: ex.name,
        exerciseCategory: ex.category,
        exerciseDifficulty: ex.difficulty,
        exerciseImageUrl: ex.imageUrl,
        sets: 3,
        prescriptionType: "FIXED_REPS",
        reps: "10",
        restSeconds: 90,
        tempo: "2-0-1-0",
        intensityType: "RPE",
        rpe: 7,
        coachingCues: ex.cues?.[0] || "Kiểm soát nhịp hạ và giữ form thẳng người",
      };

      section.exercises.push(prescription);
      setPlan({ ...plan, weeks: updatedWeeks });
      toast.success(`Đã thêm "${ex.name}" vào bài tập`);
    }

    setIsExercisePickerOpen(false);
  }

  // Handle Full Roadmap conversion from AI Gemini
  function handleApplyAiGeneratedPlan(aiPlan: GenerateWorkoutPlanResult) {
    const goalMap: Record<string, FitnessGoal> = {
      HYPERTROPHY: "Muscle Gain",
      CALISTHENICS_SKILLS: "Calisthenics Skills",
      PURE_STRENGTH: "Strength",
      FAT_LOSS: "Weight Management",
      ENDURANCE: "General Fitness",
    };
    const levelMap: Record<string, FitnessLevel> = {
      BEGINNER: "Beginner",
      INTERMEDIATE: "Intermediate",
      ADVANCED: "Advanced",
    };

    const targetGoal = goalMap[aiPlan.targetGoal] || "Strength";
    const targetLevel = levelMap[aiPlan.difficulty] || "Intermediate";
    const weeksCount = Math.max(aiPlan.totalWeeks, 1);
    const daysCount = Math.max(aiPlan.daysPerWeek, 1);
    const dayTitles = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

    // Helper to find matching exercise in library or construct a valid item
    const matchExercise = (exItemName: string): Partial<WorkoutExercisePrescription> => {
      const cleanName = exItemName.toLowerCase().trim();
      const matched = availableExercises.find(
        (e) => e.name.toLowerCase().includes(cleanName) ||
               cleanName.includes(e.name.toLowerCase()) ||
               (e.vietnameseName && (e.vietnameseName.toLowerCase().includes(cleanName) || cleanName.includes(e.vietnameseName.toLowerCase())))
      );
      if (matched) {
        return {
          exerciseId: matched.id,
          exerciseName: matched.name,
          exerciseCategory: matched.category,
          exerciseDifficulty: matched.difficulty,
          exerciseImageUrl: matched.imageUrl || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
          coachingCues: matched.cues?.[0] || "Duy trì trục cột sống thẳng 180 độ và siết core",
        };
      }
      return {
        exerciseId: `ex-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        exerciseName: exItemName,
        exerciseCategory: "Push",
        exerciseDifficulty: targetLevel,
        exerciseImageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
        coachingCues: "Kiểm soát nhịp độ và không khóa khớp đột ngột",
      };
    };

    // Build weeks array
    const generatedWeeks: WorkoutWeek[] = [];
    for (let w = 1; w <= weeksCount; w++) {
      let progType: "Volume" | "Intensity" | "Skill" | "Deload" = "Volume";
      let progDesc = "Duy trì thể tích tập và kiểm soát kỹ thuật form.";
      if (w === weeksCount || w === 6) {
        progType = "Deload";
        progDesc = "Tuần giảm tải: Giảm 40% thể tích tập để hệ thần kinh và bao khớp phục hồi.";
      } else if (w >= 3) {
        progType = "Intensity";
        progDesc = "Quá tải tăng tiến (Progressive Overload): Tăng 1-2 reps hoặc giảm thời gian nghỉ 10s.";
      }

      const coachNote = aiPlan.progressionStrategy?.[w - 1] || "Chú ý khởi động kỹ cổ tay và khớp vai trước mỗi buổi tập.";
      const weekDays: TrainingDay[] = [];
      const sampleDays = aiPlan.sampleWeekDays || [];

      for (let d = 0; d < daysCount; d++) {
        const sampleDay = sampleDays[d % sampleDays.length] || {
          dayNumber: d + 1,
          dayTitle: `Buổi ${d + 1}: Toàn thân & Thể lực`,
          focusCategory: "FULL_BODY",
          exercises: [],
        };

        const dayName = sampleDay.dayTitle || `Buổi ${d + 1}`;
        const dayDow = dayTitles[d] || `Ngày ${d + 1}`;

        // Build main exercises avoiding duplicate items
        const mainPrescriptions: WorkoutExercisePrescription[] = [];
        const seenInThisDay = new Set<string>();

        for (const ex of (sampleDay.exercises || [])) {
          const exMeta = matchExercise(ex.exerciseName);
          const slugKey = (exMeta.exerciseName || ex.exerciseName).toLowerCase().trim();
          if (seenInThisDay.has(slugKey)) continue; // SKIP DUPLICATE IN SAME DAY
          seenInThisDay.add(slugKey);

          mainPrescriptions.push({
            id: `p-${w}-${d}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            exerciseId: exMeta.exerciseId || `ex-${Date.now()}`,
            exerciseName: exMeta.exerciseName || ex.exerciseName,
            exerciseCategory: exMeta.exerciseCategory || "Push",
            exerciseDifficulty: exMeta.exerciseDifficulty || targetLevel,
            exerciseImageUrl: exMeta.exerciseImageUrl || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
            sets: ex.sets || 3,
            prescriptionType: "FIXED_REPS",
            reps: ex.repsOrDuration || "10 - 12",
            restSeconds: ex.restSeconds || 90,
            tempo: "2-0-1-0",
            intensityType: "RPE",
            rpe: 8,
            coachingCues: ex.intensityNotes || exMeta.coachingCues || "Kiểm soát nhịp hạ và siết core",
          });
        }

        const trainingDay: TrainingDay = {
          id: `d-${w}-${d + 1}-${Date.now()}`,
          dayNumber: d + 1,
          dayOfWeekTitle: dayDow,
          name: dayName,
          focus: sampleDay.focusCategory || "Sức mạnh & Kỹ năng Calisthenics",
          dayType: "WORKOUT",
          estimatedDurationMinutes: 45,
          difficulty: targetLevel,
          primaryMuscleGroups: [sampleDay.focusCategory || "Toàn thân"],
          coachNotes: "Nghỉ đầy đủ giữa các hiệp chính.",
          sections: [
            {
              id: `sec-warmup-${w}-${d}`,
              name: "Khởi động & Làm ấm khớp (Warm-up)",
              sectionType: "WARMUP",
              order: 1,
              exercises: [],
            },
            {
              id: `sec-main-${w}-${d}`,
              name: "Bài tập chính (Main Workout)",
              sectionType: "MAIN",
              order: 2,
              exercises: mainPrescriptions,
            },
            {
              id: `sec-cooldown-${w}-${d}`,
              name: "Hạ nhiệt & Giãn cơ (Cool-down)",
              sectionType: "COOLDOWN",
              order: 3,
              exercises: [],
            },
          ],
        };
        weekDays.push(trainingDay);
      }

      generatedWeeks.push({
        id: `w-${w}-${Date.now()}`,
        weekNumber: w,
        title: `Tuần ${w}: ${w === weeksCount ? "Kiểm tra Đỉnh cao & Tối ưu" : w === 1 ? "Khởi động & Thích nghi Thể lực" : "Quá tải Tăng tiến Khối lượng"}`,
        objective: aiPlan.progressionStrategy?.[w - 1] || progDesc,
        progressionTarget: {
          type: progType,
          targetDescription: progDesc,
        },
        coachNotes: coachNote,
        days: weekDays,
      });
    }

    const updatedPlan: WorkoutPlan = {
      ...plan,
      name: aiPlan.planTitle,
      description: aiPlan.description,
      primaryGoal: targetGoal,
      fitnessLevel: targetLevel,
      durationWeeks: weeksCount,
      frequencyDaysPerWeek: daysCount,
      sessionDurationMinutes: 45,
      weeks: withFourSections({ ...plan, weeks: generatedWeeks }).weeks,
      status: "DRAFT",
      updatedAt: new Date().toISOString(),
    };

    setPlan(updatedPlan);
    setActiveWeekIndex(0);
    checkPlanTitleDuplicate(aiPlan.planTitle);
  }

  function handleRemoveExercise(dayId: string, sectionId: string, exPrescriptionId: string) {
    const updatedWeeks = [...plan.weeks];
    const currentWeek = updatedWeeks[activeWeekIndex];
    const day = currentWeek.days.find((d) => d.id === dayId);
    const section = day?.sections.find((s) => s.id === sectionId);
    if (section) {
      section.exercises = section.exercises.filter((e) => e.id !== exPrescriptionId);
      setPlan({ ...plan, weeks: updatedWeeks });
      toast.success("Đã gỡ bài tập");
    }
  }

  function handleSaveExerciseConfig(updatedPrescription: WorkoutExercisePrescription) {
    const updatedWeeks = [...plan.weeks];
    for (const week of updatedWeeks) {
      for (const day of week.days) {
        for (const sec of day.sections) {
          const idx = sec.exercises.findIndex((e) => e.id === updatedPrescription.id);
          if (idx !== -1) {
            sec.exercises[idx] = updatedPrescription;
            setPlan({ ...plan, weeks: updatedWeeks });
            setIsConfigExerciseOpen(false);
            toast.success("Đã cập nhật thông số bài tập");
            return;
          }
        }
      }
    }
  }

  // Publish Flow
  async function handleConfirmPublish() {
    try {
      // Coach chỉ soạn: lưu bản nháp để Admin xem xét và xuất bản (backend cũng ép bản nháp)
      const saved = await persistPlan({ ...plan, status: isCoach ? "DRAFT" : "PUBLISHED" });
      if (isCoach) await programTemplatesApi.submitReview(saved.id);   // báo Admin ngay (realtime)
      setIsPublishModalOpen(false);
      toast.success(isCoach ? `Đã gửi Admin duyệt giáo án "${plan.name}". Admin được báo ngay.` : `Giáo án "${plan.name}" đã được xuất bản thành công!`);
      navigate(`${base}/${saved.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xuất bản giáo án");
    }
  }

  const currentWeek = plan.weeks[activeWeekIndex] || plan.weeks[0];

  // Filter exercises for picker
  const pickerSectionType = (() => {
    if (!targetSectionContext) return null;
    const sec = currentWeek.days.find((d) => d.id === targetSectionContext.dayId)?.sections.find((x) => x.id === targetSectionContext.sectionId);
    return sec ? canonicalSection(sec.sectionType) : null;
  })();
  const fitsSection = (e: ExerciseItem): boolean | null => {
    if (!pickerSectionType || !e.sessionRoles || e.sessionRoles.length === 0) return null;   // null = bài chưa phân loại
    return e.sessionRoles.includes(pickerSectionType);
  };
  const filteredPickerExercises = availableExercises.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      e.vietnameseName.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      e.primaryMuscles.some((m) => m.toLowerCase().includes(pickerSearch.toLowerCase()));
    const matchCategory = pickerCategory === "ALL" || e.category.toLowerCase() === pickerCategory.toLowerCase();
    return matchSearch && matchCategory;
  }).sort((x, y) => Number(fitsSection(y) === true) - Number(fitsSection(x) === true));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={base}
            className="rounded-2xl border border-border bg-background p-2.5 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors shrink-0"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="truncate space-y-0.5">
            <h1 className="text-xl font-black text-text-primary truncate">
              {plan.name || "Giáo án chưa đặt tên"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1 font-medium">
                <Clock size={12} className="text-emerald-500" />
                Đã lưu lúc: <span className="font-bold text-text-primary">{lastSavedTime}</span>
              </span>
              <span>•</span>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-extrabold text-[10px] text-accent-strong uppercase border border-accent/20">
                {plan.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles size={14} />
            <span>✨ AI Gemini Tạo Lộ Trình</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated hover:border-border transition-all cursor-pointer shadow-2xs"
          >
            <Save size={14} />
            <span>Lưu nháp</span>
          </button>

          <Link
            to={`${base}/${plan.id}/preview`}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated hover:border-border transition-all shadow-2xs"
          >
            <Eye size={14} />
            <span>Xem trước</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white hover:bg-accent-strong transition-all shadow-xs cursor-pointer"
          >
            <Send size={14} />
            <span>Xuất bản Giáo án</span>
          </button>
        </div>
      </div>

      {/* 2. PROGRAM BASIC INFORMATION ACCORDION */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
              <Dumbbell size={15} />
            </div>
            <h2 className="text-sm font-black text-text-primary">1. THÔNG TIN CHUNG VỀ GIÁO ÁN</h2>
          </div>
          <span className="text-[11px] font-bold text-text-secondary">Cấu hình cơ bản & Đối tượng học viên</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary">Tên Giáo án & Chương trình *</label>
              {planTitleDuplicateWarning && (
                <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                  <AlertTriangle size={12} /> Cảnh báo trùng lặp
                </span>
              )}
            </div>
            <input
              type="text"
              value={plan.name}
              onChange={(e) => {
                setPlan({ ...plan, name: e.target.value });
                checkPlanTitleDuplicate(e.target.value);
              }}
              placeholder="e.g. 8-Tuần Nền Tảng Sức Mạnh Calisthenics"
              className={`w-full rounded-xl border bg-background p-2.5 text-xs text-text-primary focus:outline-none font-bold ${
                planTitleDuplicateWarning ? "border-amber-500/70 focus:border-amber-500" : "border-border focus:border-accent"
              }`}
            />
            {planTitleDuplicateWarning && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                <span>{planTitleDuplicateWarning}</span>
                <button
                  type="button"
                  onClick={() => {
                    const unique = `${plan.name} (Biến thể V2)`;
                    setPlan({ ...plan, name: unique });
                    setPlanTitleDuplicateWarning(null);
                    toast.success("Đã thêm hậu tố phân kỳ độc nhất!");
                  }}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-bold text-[10px] hover:bg-amber-400 cursor-pointer shrink-0"
                >
                  Thêm (Biến thể V2)
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-primary">Mục tiêu chính (Primary Goal)</label>
            <select
              value={plan.primaryGoal}
              onChange={(e) => setPlan({ ...plan, primaryGoal: e.target.value as FitnessGoal })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none font-semibold cursor-pointer"
            >
              <option value="Strength">Sức mạnh (Strength)</option>
              <option value="Muscle Gain">Tăng cơ (Hypertrophy)</option>
              <option value="Calisthenics Skills">Kỹ năng Calisthenics</option>
              <option value="Weight Management">Giảm mỡ & Thể lực</option>
              <option value="Mobility">Linh hoạt khớp (Mobility)</option>
              <option value="General Fitness">Thể chất chung</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-primary">Level chính (Fitness Level)</label>
            <select
              value={plan.fitnessLevel}
              onChange={(e) => {
                const lv = e.target.value as FitnessLevel;
                const rank = (l?: FitnessLevel) => LEVEL_ORDER.indexOf(l ?? lv);
                setPlan({
                  ...plan,
                  fitnessLevel: lv,
                  levelMin: rank(plan.levelMin) > rank(lv) ? lv : plan.levelMin ?? lv,
                  levelMax: rank(plan.levelMax) < rank(lv) ? lv : plan.levelMax ?? lv,
                });
              }}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none font-semibold cursor-pointer"
            >
              {LEVEL_ORDER.map((l) => (
                <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-primary">Thời lượng chương trình (Tuần)</label>
            <input
              type="number"
              min={1}
              max={52}
              value={plan.durationWeeks}
              onChange={(e) => setPlan({ ...plan, durationWeeks: Number(e.target.value) })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-primary">Tần suất tập (Buổi / Tuần)</label>
            <input
              type="number"
              min={1}
              max={7}
              value={plan.frequencyDaysPerWeek}
              onChange={(e) => setPlan({ ...plan, frequencyDaysPerWeek: Number(e.target.value) })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none font-semibold"
            />
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="text-xs font-bold text-text-primary">Mô tả giáo án & Lời khuyên của Huấn luyện viên</label>
            <textarea
              rows={2}
              value={plan.description}
              onChange={(e) => setPlan({ ...plan, description: e.target.value })}
              placeholder="Mô tả tóm tắt giá trị của lộ trình và đối tượng học viên hướng đến..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2b. ĐIỀU KIỆN ÁP DỤNG (Level Engine chọn giáo án mẫu theo các điều kiện này) */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-text-primary">Điều kiện áp dụng cho học viên</h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Sau mỗi bài đánh giá, hệ thống chọn giáo án mẫu phù hợp nhất với level, mục tiêu, số buổi/tuần, thời lượng và dụng cụ
            của học viên, rồi tự điều chỉnh từng bài theo nấc tiến trình của người đó (trừ bài được cố định).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Áp dụng từ level</label>
            <select
              value={plan.levelMin ?? plan.fitnessLevel}
              onChange={(e) => setPlan({ ...plan, levelMin: e.target.value as FitnessLevel })}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-semibold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              {LEVEL_ORDER.filter((l) => LEVEL_ORDER.indexOf(l) <= LEVEL_ORDER.indexOf(plan.fitnessLevel)).map((l) => (
                <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Đến level</label>
            <select
              value={plan.levelMax ?? plan.fitnessLevel}
              onChange={(e) => setPlan({ ...plan, levelMax: e.target.value as FitnessLevel })}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-semibold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              {LEVEL_ORDER.filter((l) => LEVEL_ORDER.indexOf(l) >= LEVEL_ORDER.indexOf(plan.fitnessLevel)).map((l) => (
                <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Số buổi/tuần tối đa</label>
            <input
              type="number"
              min={plan.frequencyDaysPerWeek}
              max={7}
              value={plan.frequencyDaysMax ?? plan.frequencyDaysPerWeek}
              onChange={(e) => setPlan({ ...plan, frequencyDaysMax: Number(e.target.value) })}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-semibold text-text-primary focus:border-accent focus:outline-none"
            />
            <p className="text-[10px] text-text-secondary">Học viên có ít buổi hơn số ngày trong tuần của giáo án sẽ nhận N buổi đầu.</p>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Thời lượng mỗi buổi (phút)</label>
            <input
              type="number"
              min={10}
              max={180}
              value={plan.sessionDurationMinutes}
              onChange={(e) => setPlan({ ...plan, sessionDurationMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-semibold text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Tuần giảm tải (deload)</label>
            <select
              value={plan.deloadWeek ?? 0}
              onChange={(e) => setPlan({ ...plan, deloadWeek: Number(e.target.value) || null })}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-semibold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value={0}>Không có</option>
              {plan.weeks.map((w) => (
                <option key={w.id} value={w.weekNumber}>Tuần {w.weekNumber}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Mục tiêu kỹ năng cụ thể</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {SKILL_GOALS.map((g) => {
                const on = (plan.targetGoalCodes ?? []).includes(g.code);
                return (
                  <button
                    key={g.code}
                    type="button"
                    onClick={() => setPlan({
                      ...plan,
                      targetGoalCodes: on ? (plan.targetGoalCodes ?? []).filter((c) => c !== g.code) : [...(plan.targetGoalCodes ?? []), g.code],
                    })}
                    className={`rounded-lg border px-2 py-1 font-bold cursor-pointer ${on ? "border-accent bg-accent/15 text-accent" : "border-border text-text-secondary"}`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1 md:col-span-3">
            <label className="font-bold text-text-primary">Dụng cụ bắt buộc (học viên thiếu dụng cụ sẽ không được xếp giáo án này)</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {EQUIPMENT_OPTIONS.map((o) => {
                const current = plan.requiredEquipmentCodes ?? [];
                const on = current.includes(o.code);
                return (
                  <button
                    key={o.code}
                    type="button"
                    onClick={() => setPlan({
                      ...plan,
                      requiredEquipmentCodes: on ? current.filter((c) => c !== o.code) : [...current, o.code],
                      equipmentRequired: (on ? current.filter((c) => c !== o.code) : [...current, o.code])
                        .map((c) => EQUIPMENT_OPTIONS.find((x) => x.code === c)?.label ?? c),
                    })}
                    className={`rounded-lg border px-2 py-1 font-bold cursor-pointer ${on ? "border-accent bg-accent/15 text-accent" : "border-border text-text-secondary"}`}
                  >
                    {o.label}
                  </button>
                );
              })}
              {(plan.requiredEquipmentCodes ?? []).length === 0 && (
                <span className="text-[11px] text-text-secondary self-center">Không yêu cầu dụng cụ</span>
              )}
            </div>
          </div>
          {plan.emphasis && Object.keys(plan.emphasis).length > 0 && (
            <div className="md:col-span-3 text-[11px] text-text-secondary">
              Trọng tâm năng lực (tự tính từ số set):{" "}
              {Object.entries(plan.emphasis).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(" · ")}
            </div>
          )}
        </div>
      </div>

      {/* 3. AI TRAINING SUGGESTION NOTIFICATION BANNER */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <span>ĐỀ XUẤT TỐI ƯU HÓA TỪ CALISHEALTH AI ENGINE</span>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
              Dựa trên mục tiêu <strong>{plan.primaryGoal}</strong> cấp độ <strong>{plan.fitnessLevel}</strong>: Tự động phân bổ lịch tập từng tuần, đề phòng trùng lặp bài tập và bảo đảm tối thiểu 48h hồi phục giữa các buổi tập.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAiModalOpen(true)}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <Sparkles size={13} />
          <span>AI Tự Động Sinh Lộ Trình</span>
        </button>
      </div>

      {/* 4. HORIZONTAL WEEK BUILDER TABS */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
              <Calendar size={15} />
            </div>
            <h2 className="text-sm font-black text-text-primary">2. TRÌNH DỰNG LỘ TRÌNH THEO TUẦN (WEEK BUILDER)</h2>
          </div>

          <button
            type="button"
            onClick={handleAddWeek}
            className="flex items-center gap-1 rounded-xl bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong hover:bg-accent hover:text-white transition-all cursor-pointer border border-accent/20"
          >
            <Plus size={13} /> Thêm Tuần mới
          </button>
        </div>

        {/* Horizontal Week Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {plan.weeks.map((w, idx) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setActiveWeekIndex(idx)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                activeWeekIndex === idx
                  ? "bg-accent text-white border-accent shadow-xs scale-102"
                  : "bg-background text-text-secondary border-border hover:bg-surface-elevated hover:text-text-primary"
              }`}
            >
              <span>Tuần {w.weekNumber}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeWeekIndex === idx ? "bg-white/20 text-white" : "bg-surface-elevated text-text-secondary"
                }`}
              >
                {w.days.length} ngày
              </span>
            </button>
          ))}
        </div>

        {/* Current Active Week Header & Settings */}
        {currentWeek && (
          <div className="rounded-2xl border border-accent/30 bg-accent-soft/10 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-accent/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-accent px-2 py-0.5 text-xs font-black text-white">
                  Tuần {currentWeek.weekNumber}
                </span>
                <input
                  type="text"
                  value={currentWeek.title}
                  onChange={(e) => {
                    const updated = [...plan.weeks];
                    updated[activeWeekIndex].title = e.target.value;
                    setPlan({ ...plan, weeks: updated });
                  }}
                  className="rounded-lg border border-transparent hover:border-border focus:border-accent bg-transparent px-2 py-1 text-xs font-black text-text-primary focus:bg-surface focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDeleteWeek(activeWeekIndex)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  title="Xóa tuần này"
                >
                  <Trash2 size={13} /> Xóa tuần
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-primary">Mục tiêu của tuần (Week Objective)</label>
                <input
                  type="text"
                  value={currentWeek.objective}
                  onChange={(e) => {
                    const updated = [...plan.weeks];
                    updated[activeWeekIndex].objective = e.target.value;
                    setPlan({ ...plan, weeks: updated });
                  }}
                  placeholder="e.g. Tăng thể tích thích nghi và củng cố form..."
                  className="w-full rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Mục tiêu tăng tiến (Progression Target)</label>
                <input
                  type="text"
                  value={currentWeek.progressionTarget.targetDescription}
                  onChange={(e) => {
                    const updated = [...plan.weeks];
                    updated[activeWeekIndex].progressionTarget.targetDescription = e.target.value;
                    setPlan({ ...plan, weeks: updated });
                  }}
                  placeholder="e.g. +1 hiệp cho bài compound hoặc nâng dải reps..."
                  className="w-full rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. TRAINING DAYS BUILDER (CARDS GRID) */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
              <Layers size={15} />
            </div>
            <h2 className="text-sm font-black text-text-primary">
              3. CÁC NGÀY TẬP TRONG TUẦN {currentWeek?.weekNumber} ({currentWeek?.days.length || 0} Ngày)
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleAddDay(activeWeekIndex)}
            className="flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-strong transition-all cursor-pointer shadow-xs"
          >
            <Plus size={13} /> Thêm Ngày tập
          </button>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {currentWeek?.days.map((day) => (
            <div
              key={day.id}
              className="rounded-2xl border border-border bg-background p-4 shadow-xs space-y-4 hover:border-accent/40 transition-colors"
            >
              {/* Day Header */}
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-extrabold text-white">
                      {day.dayOfWeekTitle}
                    </span>
                    <input
                      type="text"
                      value={day.name}
                      onChange={(e) => {
                        const updated = [...plan.weeks];
                        const d = updated[activeWeekIndex].days.find((x) => x.id === day.id);
                        if (d) d.name = e.target.value;
                        setPlan({ ...plan, weeks: updated });
                      }}
                      className="rounded border border-transparent hover:border-border focus:border-accent bg-transparent px-1 text-xs font-black text-text-primary focus:bg-surface focus:outline-none"
                    />
                  </div>
                  <div className="text-[11px] text-text-secondary flex items-center gap-1.5 pl-1">
                    <span>Thời lượng: ~{day.estimatedDurationMinutes}p</span>
                    <span>•</span>
                    <span>Focus: {day.focus}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteDay(activeWeekIndex, day.id)}
                  className="rounded-lg p-1 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                  title="Xóa ngày tập này"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Sections in this day */}
              {dayIssues(day, aiReadiness).length > 0 && (
                <ul className="mb-2 space-y-0.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-600" aria-label="Cần bổ sung">
                  {dayIssues(day, aiReadiness).map((m) => <li key={m}>{m}</li>)}
                </ul>
              )}
              <div className="space-y-3">
                {day.sections.map((section) => (
                  <div key={section.id} className="rounded-xl border border-border/80 bg-surface p-3 space-y-2">
                    {/* Section Title */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-accent" />
                        <span className="text-xs font-black text-text-primary">{section.name}</span>
                        <span className="text-[10px] text-text-secondary font-bold">
                          ({section.exercises.length} động tác)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenExercisePicker(day.id, section.id)}
                        className="flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-bold text-accent-strong hover:bg-accent hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus size={12} /> Thêm động tác
                      </button>
                    </div>

                    {/* Exercises in Section */}
                    {section.exercises.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border py-3 text-center text-[11px] text-text-secondary">
                        Chưa có động tác nào trong phân đoạn này.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {section.exercises.map((exPrescription) => (
                          <div
                            key={exPrescription.id}
                            className="group flex items-center justify-between rounded-xl border border-border bg-background p-2.5 hover:border-accent transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={exPrescription.exerciseImageUrl}
                                alt={exPrescription.exerciseName}
                                className="h-10 w-12 rounded-lg object-cover border border-border"
                              />
                              <div className="truncate">
                                <div className="text-xs font-bold text-text-primary truncate">
                                  {exPrescription.exerciseName}
                                </div>
                                <div className="text-[10px] text-text-secondary flex items-center gap-2">
                                  <span className="font-bold text-accent-strong">
                                    {exPrescription.sets} hiệp × {exPrescription.reps}
                                  </span>
                                  <span>•</span>
                                  <span>Nghỉ: {exPrescription.restSeconds}s</span>
                                  {exPrescription.rpe && (
                                    <>
                                      <span>•</span>
                                      <span className="font-semibold">RPE {exPrescription.rpe}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPrescription(exPrescription);
                                  setIsConfigExerciseOpen(true);
                                }}
                                className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-accent-strong cursor-pointer"
                                title="Cấu hình Sets, Reps & RPE"
                              >
                                <Sliders size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(day.id, section.id, exPrescription.id)}
                                className="rounded-lg p-1.5 text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                                title="Gỡ động tác"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. MODAL: EXERCISE PICKER DRAWER */}
      {isExercisePickerOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-black text-text-primary">Chọn động tác cho phần "{pickerSectionType ? sessionRoleLabel(pickerSectionType) : "buổi tập"}"</h2>
                <p className="text-xs text-text-secondary">Bài hợp với phần này được xếp lên đầu. Bài không dùng được ở phần này sẽ không thêm được.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsExercisePickerOpen(false)}
                className="rounded-xl p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search & Categories */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Tìm theo tên bài tập, tên tiếng Việt, nhóm cơ..."
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {["ALL", "Push", "Pull", "Core", "Legs", "Skill"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPickerCategory(cat)}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold cursor-pointer ${
                      pickerCategory === cat
                        ? "bg-accent text-white font-bold"
                        : "bg-background text-text-secondary border border-border hover:bg-surface-elevated"
                    }`}
                  >
                    {cat === "ALL" ? "Tất cả" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercises Grid List */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredPickerExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-background p-3 hover:border-accent hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={ex.imageUrl} alt={ex.name} className="h-12 w-16 rounded-xl object-cover border border-border shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-black text-text-primary truncate">{ex.name}</div>
                      <div className="text-[11px] text-text-secondary truncate">{ex.vietnameseName}</div>
                      <div className="flex gap-1 mt-1">
                        <span className="rounded bg-accent-soft px-1.5 py-0.2 text-[9px] font-bold text-accent-strong">
                          {ex.category}
                        </span>
                        <span className="rounded bg-surface-elevated border border-border px-1.5 py-0.2 text-[9px] font-bold text-text-secondary">
                          {ex.difficulty}
                        </span>
                        {aiReadiness[ex.id]?.ready && (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-bold text-emerald-500">
                            {aiReadiness[ex.id].formScoring ? "AI đếm rep + chấm form" : "AI đếm rep"}
                          </span>
                        )}
                        {fitsSection(ex) === false && (
                          <span className="rounded bg-red-500/15 px-1.5 py-0.2 text-[9px] font-bold text-red-500">Không dùng được ở phần này</span>
                        )}
                        {fitsSection(ex) === null && (
                          <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-bold text-amber-600">Chưa phân loại phần</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectExerciseForSection(ex)}
                    className="flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs shrink-0"
                  >
                    <Plus size={13} /> Thêm vào bài
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 7. MODAL: EXERCISE CONFIGURATION (SETS / REPS / REST / RPE / TEMPO) */}
      {isConfigExerciseOpen && editingPrescription && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-black text-text-primary">
                  Cấu hình Thông số: {editingPrescription.exerciseName}
                </h2>
                <p className="text-[11px] text-text-secondary">Thiết lập Sets, Reps, Thời gian nghỉ, Tempo và RPE.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigExerciseOpen(false)}
                className="rounded-xl p-1 text-text-secondary hover:bg-surface-elevated hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-primary">Số hiệp (Sets)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editingPrescription.sets}
                  onChange={(e) => setEditingPrescription({ ...editingPrescription, sets: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-bold text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Số lần / Thời gian giữ (Reps/Time)</label>
                <input
                  type="text"
                  value={editingPrescription.reps}
                  onChange={(e) => setEditingPrescription({ ...editingPrescription, reps: e.target.value })}
                  placeholder="e.g. 10 hoặc 8-12 hoặc 30s"
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-bold text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Nghỉ giữa hiệp (Giây)</label>
                <input
                  type="number"
                  step={15}
                  value={editingPrescription.restSeconds}
                  onChange={(e) => setEditingPrescription({ ...editingPrescription, restSeconds: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-semibold text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Tempo (Nhịp độ cử động)</label>
                <input
                  type="text"
                  value={editingPrescription.tempo || "2-0-1-0"}
                  onChange={(e) => setEditingPrescription({ ...editingPrescription, tempo: e.target.value })}
                  placeholder="e.g. 3-1-1-0"
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-mono text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Cường độ RPE (1 - 10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editingPrescription.rpe || 7}
                  onChange={(e) => setEditingPrescription({ ...editingPrescription, rpe: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-bold text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Số Rep dự trữ (RIR)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={editingPrescription.rir || 2}
                  onChange={(e) => setEditingPrescription({ ...editingPrescription, rir: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-bold text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <label className="col-span-2 flex items-start gap-2 rounded-xl border border-border bg-background p-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingPrescription.locked)}
                  onChange={(e) => setEditingPrescription({ ...editingPrescription, locked: e.target.checked })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-bold text-text-primary">Cố định bài này</span>
                  <span className="block text-[10px] text-text-secondary">
                    Mặc định hệ thống tự đổi sang nấc dễ/khó hơn trong cùng chuỗi tiến trình cho phù hợp từng học viên.
                    Bật để mọi học viên đều tập đúng bài này.
                  </span>
                </span>
              </label>

              <div className="space-y-1 col-span-2">
                <label className="font-bold text-text-primary">Ghi chú Kỹ thuật & AI Cues</label>
                <textarea
                  rows={2}
                  value={editingPrescription.coachingCues || ""}
                  onChange={(e) => setEditingPrescription({ ...editingPrescription, coachingCues: e.target.value })}
                  placeholder="e.g. Siết mông và bụng, hạ chạm ngực không xòe cùi chỏ..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsConfigExerciseOpen(false)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveExerciseConfig(editingPrescription)}
                className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 8. MODAL: PUBLISH PRE-FLIGHT VALIDATION CHECKLIST */}
      {isPublishModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-text-primary">Kiểm tra & Xuất bản Giáo án</h2>
                  <p className="text-[11px] text-text-secondary">Xác thực các tiêu chuẩn an toàn trước khi mở cho học viên.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="rounded-xl p-1 text-text-secondary hover:bg-surface-elevated hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Validation Checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Tên giáo án & Thông tin mục tiêu đầy đủ</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Cấu trúc {plan.weeks.length} tuần & {plan.weeks.reduce((a, b) => a + b.days.length, 0)} ngày tập đã thiết lập</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Toàn bộ bài tập có thông số Sets, Reps và thời gian nghỉ hợp lệ</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Đã kiểm tra tương thích AI Vision & Landmark Cues</span>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-elevated p-3 text-[11px] text-text-secondary border border-border">
              Sau khi xuất bản, hệ thống sẽ xếp giáo án này cho học viên level <strong>{LEVEL_LABELS[plan.levelMin ?? plan.fitnessLevel]}</strong> – <strong>{LEVEL_LABELS[plan.levelMax ?? plan.fitnessLevel]}</strong>, mục tiêu <strong>{plan.primaryGoal}</strong>, {plan.frequencyDaysPerWeek}–{plan.frequencyDaysMax ?? plan.frequencyDaysPerWeek} buổi/tuần khi đây là giáo án phù hợp nhất, và điều chỉnh bài theo nấc của từng người.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
              >
                Xác nhận Xuất bản Giáo án
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI Workout Plan Generator Modal */}
      <AIWorkoutPlanGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyPlan={handleApplyAiGeneratedPlan}
        existingPlanNames={existingPlanNames}
        initialGoal={plan.primaryGoal}
        initialLevel={plan.fitnessLevel}
        initialWeeks={plan.durationWeeks}
        initialDaysPerWeek={plan.frequencyDaysPerWeek}
      />
    </div>
  );
}
