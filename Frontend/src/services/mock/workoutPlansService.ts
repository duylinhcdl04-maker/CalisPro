import {
  ExerciseItem,
  WorkoutPlan,
  WorkoutPlanAnalytics,
  WorkoutPlanFilters,
  WorkoutWeek,
  TrainingDay,
  FitnessLevel,
} from "../../types/workoutPlan";
import { MOCK_EXERCISE_LIBRARY } from "./workoutPlansMockData";
import { programTemplatesApi } from "../../features/workout-plans/api/programTemplatesApi";
import axios from "axios";
import { apiClient } from "../../lib/api/client";
import { BackendExerciseResponse } from "../../features/exercises/api";
import {
  type BackendMuscleTarget,
  detailsToFormData,
  formDataToDetails,
} from "../../features/exercises/mappers/exerciseDetailsMapper";

const STORAGE_KEY_EXERCISES = "calishealth_mock_admin_exercises";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // Purge legacy mock data seeded previously
    if (Array.isArray(parsed) && parsed.some((item: any) => item?.id === "plan-1" || item?.id === "ex-push-1" || item?.id === "ex-push-knee")) {
      localStorage.removeItem(key);
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Storage save error", err);
  }
}

// Backend đã nhận request nhưng từ chối (401/403/400/500): báo lỗi thật thay vì âm thầm lưu localStorage.
// Chỉ fallback local khi không kết nối được server.
function throwIfServerRejected(err: unknown, action: string): void {
  if (axios.isAxiosError(err) && err.response) {
    const status = err.response.status;
    const serverMsg = (err.response.data as { message?: string } | undefined)?.message;
    const reason =
      status === 401 ? "phiên đăng nhập đã hết hạn" : status === 403 ? "tài khoản không có quyền ADMIN" : serverMsg || `lỗi máy chủ (${status})`;
    throw new Error(`${action}: ${reason}.`);
  }
}

function mapBackendToExerciseItem(b: BackendExerciseResponse): ExerciseItem {
  let cat: ExerciseItem["category"] = "Push";
  const catName = (b.categoryName || "").toLowerCase();
  if (catName.includes("pull")) cat = "Pull";
  else if (catName.includes("core")) cat = "Core";
  else if (catName.includes("leg")) cat = "Legs";
  else if (catName.includes("skill")) cat = "Skill";
  else if (catName.includes("mobility")) cat = "Mobility";
  else if (catName.includes("cardio")) cat = "Warmup";
  else cat = "Push";

  const d = b.details;
  const targets = d?.muscleTargets ?? [];
  const muscleNames = (role: (m: BackendMuscleTarget) => boolean) =>
    targets.filter(role).map((m) => m.muscleNameVi || m.muscleName || m.muscleCode);
  const primaryMuscles = muscleNames((m) => m.role === "PRIMARY");
  const secondaryMuscles = muscleNames((m) => m.role !== "PRIMARY");
  const cues = d?.coachingCues?.length ? d.coachingCues.map((c) => c.text) : (b.instructions ?? "").split("\n").filter(Boolean);
  const mistakes = d?.commonMistakes?.length
    ? d.commonMistakes.map((m) => (m.correction ? `${m.name}: ${m.correction}` : m.name))
    : (b.safetyNotes ?? "").split("\n").filter(Boolean);

  return {
    id: String(b.id),
    name: b.name,
    vietnameseName: d?.displayName || b.name,
    imageUrl: b.thumbnailUrl || `https://picsum.photos/seed/calis-${b.code || b.id}/480/360`,
    videoUrl: b.videoUrl || undefined,
    builderData: detailsToFormData(b, d),
    sessionRoles: d?.sessionRoles ?? [],
    aiSync: b.aiSync ?? undefined,
    category: cat,
    movementPattern: b.movementPattern || "Standard",
    difficulty: ((b.difficultyLevel as string) === "Elite" ? "Advanced" : b.difficultyLevel) as FitnessLevel || "Beginner",
    primaryMuscles: primaryMuscles.length ? primaryMuscles : [b.categoryName || "Toàn thân"],
    secondaryMuscles,
    equipment: d?.equipment?.length
      ? d.equipment.join(", ")
      : b.equipmentRequired ? "Xà đơn / Dụng cụ" : "Không dụng cụ (Bodyweight)",
    description: b.description || "",
    cues,
    commonMistakes: mistakes,
    status: b.active ? "PUBLISHED" : "DRAFT",
  };
}

let memoryExercises: ExerciseItem[] = loadFromStorage(STORAGE_KEY_EXERCISES, MOCK_EXERCISE_LIBRARY);

export const workoutPlansService = {
  // ==========================================
  // GIÁO ÁN MẪU (Backend /admin/program-templates - Level Engine chọn giáo án theo level của học viên)
  // ==========================================

  // 1. Get Workout Plans with filters
  async getWorkoutPlans(filters?: Partial<WorkoutPlanFilters>): Promise<WorkoutPlan[]> {
    let result = await programTemplatesApi.list();

    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.createdBy.toLowerCase().includes(q)
      );
    }

    if (filters?.goal && filters.goal !== "ALL") {
      result = result.filter((p) => p.primaryGoal === filters.goal);
    }

    if (filters?.fitnessLevel && filters.fitnessLevel !== "ALL") {
      result = result.filter((p) => p.fitnessLevel === filters.fitnessLevel);
    }

    if (filters?.status && filters.status !== "ALL") {
      result = result.filter((p) => p.status === filters.status);
    }

    return result;
  },

  // 2. Get single plan by ID
  async getWorkoutPlanById(id: string): Promise<WorkoutPlan | null> {
    return programTemplatesApi.get(id);
  },

  // 3. Create or Save Plan
  async createWorkoutPlan(data: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    return programTemplatesApi.create({
      ...data,
      name: data.name || "Giáo án Calisthenics mới",
      description: data.description || "",
      primaryGoal: data.primaryGoal || "Strength",
      fitnessLevel: data.fitnessLevel || "Beginner",
      frequencyDaysPerWeek: data.frequencyDaysPerWeek || 3,
      sessionDurationMinutes: data.sessionDurationMinutes || 40,
      status: data.status || "DRAFT",
      weeks: data.weeks || [],
    });
  },

  // 4. Update Workout Plan (bản đã xuất bản & đang được dùng -> backend tạo phiên bản mới với id mới)
  async updateWorkoutPlan(id: string, updates: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    const current = await programTemplatesApi.get(id);
    if (!current) throw new Error("Không tìm thấy giáo án");
    return programTemplatesApi.update(id, { ...current, ...updates });
  },

  // 5. Publish Plan
  async publishWorkoutPlan(id: string): Promise<WorkoutPlan> {
    return programTemplatesApi.setStatus(id, "PUBLISHED");
  },

  // 6. Duplicate Plan
  async duplicateWorkoutPlan(id: string): Promise<WorkoutPlan> {
    return programTemplatesApi.duplicate(id);
  },

  // 7. Delete Plan (giáo án đã sinh chu kỳ cho học viên chỉ được lưu trữ để giữ truy vết)
  async deleteWorkoutPlan(id: string): Promise<boolean> {
    await programTemplatesApi.remove(id);
    return true;
  },

  // 8. Get Analytics for a Plan (số học viên lấy từ backend; các chỉ số còn lại là dữ liệu minh hoạ)
  async getWorkoutPlanAnalytics(id: string): Promise<WorkoutPlanAnalytics> {
    const plan = await programTemplatesApi.get(id);
    const enrolled = plan?.assignedUsersCount ?? 0;
    const active = plan?.activeUsersCount ?? 0;

    return {
      totalEnrolled: enrolled,
      activeTrainees: active,
      completedTrainees: Math.max(0, enrolled - active),
      avgCompletionRate: plan?.completionRate || 0,
      avgSessionDurationMin: plan?.sessionDurationMinutes || 0,
      avgRating: plan?.averageRating || 0,
      dropOffRate: 0,
      weeklyProgressData: [],
      levelDistribution: [],
    };
  },

  // ==========================================
  // EXERCISE LIBRARY APIS (Synced with Backend DB)
  // ==========================================

  async getExerciseLibrary(filter?: {
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<ExerciseItem[]> {
    let list: ExerciseItem[] = [];

    try {
      const res = await apiClient.get<BackendExerciseResponse[]>("/exercises");
      if (res.data && res.data.length > 0) {
        list = res.data.map(mapBackendToExerciseItem);
      }
    } catch (err) {
      console.warn("Backend exercises fetch failed, using local cache fallback", err);
    }

    // Merge any locally created items that might not be in DB yet
    for (const mem of memoryExercises) {
      if (!list.some((e) => e.id === mem.id || e.name.toLowerCase() === mem.name.toLowerCase())) {
        list.push(mem);
      }
    }

    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.vietnameseName.toLowerCase().includes(q) ||
          e.primaryMuscles.some((m) => m.toLowerCase().includes(q))
      );
    }

    if (filter?.category && filter.category !== "ALL") {
      list = list.filter((e) => e.category.toLowerCase() === filter.category?.toLowerCase());
    }

    if (filter?.difficulty && filter.difficulty !== "ALL") {
      list = list.filter((e) => e.difficulty.toLowerCase() === filter.difficulty?.toLowerCase());
    }

    return list;
  },

  async getExerciseById(id: string): Promise<ExerciseItem | null> {
    try {
      if (/^\d+$/.test(id)) {
        const res = await apiClient.get<BackendExerciseResponse>(`/exercises/${id}`);
        if (res.data) {
          return mapBackendToExerciseItem(res.data);
        }
      }
    } catch (err) {
      console.warn("Backend getExerciseById failed, searching local memory", err);
    }

    const found = memoryExercises.find((e) => e.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  async createExercise(data: Partial<ExerciseItem>): Promise<ExerciseItem> {
    try {
      let catId = 1; // PUSH default
      const cat = (data.category || "").toLowerCase();
      if (cat.includes("pull")) catId = 2;
      else if (cat.includes("leg")) catId = 3;
      else if (cat.includes("core")) catId = 4;
      else if (cat.includes("mobility")) catId = 5;
      else if (cat.includes("skill")) catId = 6;
      else if (cat.includes("cardio")) catId = 7;

      const payload = {
        name: data.name?.trim(),
        code: data.name?.trim().toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: data.description || "",
        categoryId: catId,
        difficultyLevel: (data.difficulty === "Elite" ? "Advanced" : data.difficulty) || "Beginner",
        movementPattern: data.movementPattern || "Standard",
        equipmentRequired: data.equipment ? !data.equipment.toLowerCase().includes("không") : false,
        instructions: (data.cues || []).join("\n"),
        safetyNotes: (data.commonMistakes || []).join("\n"),
        videoUrl: data.videoUrl,
        thumbnailUrl: data.imageUrl,
        details: data.builderData ? formDataToDetails(data.builderData) : undefined,
        active: data.status !== "DRAFT",
      };

      const res = await apiClient.post<BackendExerciseResponse>("/exercises", payload);
      if (res.data) {
        const item = mapBackendToExerciseItem(res.data);
        memoryExercises = [item, ...memoryExercises];
        saveToStorage(STORAGE_KEY_EXERCISES, memoryExercises);
        return item;
      }
    } catch (err) {
      throwIfServerRejected(err, "Không thể tạo động tác");
      console.warn("Failed to create exercise in backend DB, saving locally", err);
    }

    // Local fallback
    const item: ExerciseItem = {
      id: `ex-${Date.now()}`,
      name: data.name || "Động tác Calisthenics",
      vietnameseName: data.vietnameseName || data.name || "Động tác mới",
      imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
      videoUrl: data.videoUrl,
      category: data.category || "Push",
      movementPattern: data.movementPattern || "Horizontal Push",
      difficulty: data.difficulty || "Beginner",
      primaryMuscles: data.primaryMuscles || ["Ngực", "Tay sau"],
      secondaryMuscles: data.secondaryMuscles || [],
      equipment: data.equipment || "Không dụng cụ",
      description: data.description || "",
      cues: data.cues || ["Khóa chặt cơ bụng và kiểm soát nhịp hạ"],
      commonMistakes: data.commonMistakes || ["Lỏng cơ lõi võng lưng"],
      regressionId: data.regressionId,
      progressionId: data.progressionId,
      status: data.status || "PUBLISHED",
      viewsCount: 0,
      completionCount: 0,
      updatedAt: new Date().toISOString(),
    };

    memoryExercises = [item, ...memoryExercises];
    saveToStorage(STORAGE_KEY_EXERCISES, memoryExercises);
    return item;
  },

  async updateExercise(id: string, updates: Partial<ExerciseItem>): Promise<ExerciseItem> {
    try {
      if (/^\d+$/.test(id)) {
        let catId = 1;
        const cat = (updates.category || "").toLowerCase();
        if (cat.includes("pull")) catId = 2;
        else if (cat.includes("leg")) catId = 3;
        else if (cat.includes("core")) catId = 4;
        else if (cat.includes("mobility")) catId = 5;
        else if (cat.includes("skill")) catId = 6;
        else if (cat.includes("cardio")) catId = 7;

        const payload = {
          name: updates.name?.trim(),
          description: updates.description,
          categoryId: catId,
          difficultyLevel: (updates.difficulty === "Elite" ? "Advanced" : updates.difficulty) || "Beginner",
          movementPattern: updates.movementPattern,
          equipmentRequired: updates.equipment ? !updates.equipment.toLowerCase().includes("không") : false,
          instructions: updates.cues ? updates.cues.join("\n") : undefined,
          safetyNotes: updates.commonMistakes ? updates.commonMistakes.join("\n") : undefined,
          videoUrl: updates.videoUrl,
          thumbnailUrl: updates.imageUrl,
          details: updates.builderData ? formDataToDetails(updates.builderData) : undefined,
          active: updates.status ? updates.status !== "DRAFT" : true,
        };

        const res = await apiClient.put<BackendExerciseResponse>(`/exercises/${id}`, payload);
        if (res.data) {
          const item = mapBackendToExerciseItem(res.data);
          const idx = memoryExercises.findIndex((e) => e.id === id);
          if (idx !== -1) memoryExercises[idx] = item;
          saveToStorage(STORAGE_KEY_EXERCISES, memoryExercises);
          return item;
        }
      }
    } catch (err) {
      throwIfServerRejected(err, "Không thể cập nhật động tác");
      console.warn("Backend exercise update failed, updating locally", err);
    }

    const idx = memoryExercises.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Không tìm thấy bài tập");

    const updated: ExerciseItem = {
      ...memoryExercises[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    memoryExercises[idx] = updated;
    saveToStorage(STORAGE_KEY_EXERCISES, memoryExercises);
    return updated;
  },

  async deleteExercise(id: string): Promise<boolean> {
    try {
      if (/^\d+$/.test(id)) {
        await apiClient.delete(`/exercises/${id}`);
      }
    } catch (err) {
      console.warn("Backend exercise delete failed", err);
    }
    memoryExercises = memoryExercises.filter((e) => e.id !== id);
    saveToStorage(STORAGE_KEY_EXERCISES, memoryExercises);
    return true;
  },

  async clearAllExercises(): Promise<void> {
    memoryExercises = [];
    localStorage.removeItem(STORAGE_KEY_EXERCISES);
  },

};
