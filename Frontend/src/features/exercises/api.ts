import { apiClient } from "../../lib/api/client";
import { exerciseService } from "../../services/mock/exerciseService";
import type { Exercise } from "../../types";
import type { BackendExerciseDetails } from "./mappers/exerciseDetailsMapper";

export interface ExerciseAiSyncResult {
  profileId: number;
  profileVersion: string;
  changed: boolean;
  rulesSynced: number;
  rulesSkipped: number;
  landmarksSynced: number;
}

export interface BackendExerciseResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  movementPattern: string;
  equipmentRequired: boolean;
  instructions?: string;
  safetyNotes?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  active: boolean;
  // Dữ liệu chi tiết của Exercise Builder (phases, nhóm cơ, kỹ thuật...) từ các bảng con
  details?: BackendExerciseDetails | null;
  // Chỉ có trong response của tạo/cập nhật: kết quả đồng bộ sang hồ sơ AI runtime
  aiSync?: ExerciseAiSyncResult | null;
}

function mapBackendExercise(item: BackendExerciseResponse): Exercise {
  const diff = (item.difficultyLevel || "Beginner") as Exercise["difficulty"];
  
  // Extract primary & secondary muscles from details if available
  const detailPrimaries = item.details?.muscleTargets
    ?.filter((m) => m.role?.toUpperCase() === "PRIMARY")
    .map((m) => m.muscleNameVi || m.muscleName || m.muscleCode) || [];
    
  const detailSecondaries = item.details?.muscleTargets
    ?.filter((m) => m.role?.toUpperCase() === "SECONDARY" || m.role?.toUpperCase() === "STABILIZER")
    .map((m) => m.muscleNameVi || m.muscleName || m.muscleCode) || [];

  const primaryMuscles = detailPrimaries.length > 0
    ? detailPrimaries
    : [item.categoryName || item.movementPattern || "Toàn thân"];

  const secondaryMuscles = detailSecondaries.length > 0
    ? detailSecondaries
    : [item.movementPattern || "Calisthenics"];

  return {
    id: item.code || String(item.id),
    name: item.name,
    imageUrl: item.thumbnailUrl || `https://picsum.photos/seed/calis-${item.code || item.id}/480/360`,
    hasRealImage: !!item.thumbnailUrl,
    difficulty: diff,
    primaryMuscles,
    secondaryMuscles,
    description: item.description || "",
    safetyNotes: item.safetyNotes || item.details?.safety?.generalConsiderations || "",
    progression: { current: item.name },
    videoUrl: item.videoUrl,
    equipment: item.details?.equipment,
    backendId: item.id,
    details: item.details,
  };
}

export const exercisesApi = {
  async list(): Promise<Exercise[]> {
    try {
      const res = await apiClient.get<BackendExerciseResponse[]>("/exercises");
      if (res.data && res.data.length > 0) {
        return res.data.map(mapBackendExercise);
      }
    } catch (err) {
      console.warn("Backend exercises API unavailable, using mock fallback", err);
    }
    return exerciseService.list();
  },

  async getById(id: string): Promise<Exercise> {
    try {
      // If numeric ID
      if (/^\d+$/.test(id)) {
        const res = await apiClient.get<BackendExerciseResponse>(`/exercises/${id}`);
        if (res.data) {
          return mapBackendExercise(res.data);
        }
      } else {
        // Find by code from list
        const res = await apiClient.get<BackendExerciseResponse[]>("/exercises");
        const found = res.data?.find((e) => e.code?.toLowerCase() === id.toLowerCase() || String(e.id) === id);
        if (found) {
          // If found, fetch single endpoint by numeric ID to ensure full details are loaded
          if (found.id) {
            try {
              const full = await apiClient.get<BackendExerciseResponse>(`/exercises/${found.id}`);
              if (full.data) return mapBackendExercise(full.data);
            } catch {
              // fallback to found
            }
          }
          return mapBackendExercise(found);
        }
      }
    } catch (err) {
      console.warn("Backend exercise detail API unavailable, using mock fallback", err);
    }
    return exerciseService.getById(id);
  },
};

