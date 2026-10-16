import axios, { type AxiosProgressEvent } from "axios";
import { apiClient } from "../../../lib/api/client";

export interface GenerateExercisePayload {
  exerciseName: string;
  category?: string;
  difficulty?: string;
  targetMuscles?: string;
  specificGoal?: string;
  existingExercises?: string[];
}

export interface GenerateExerciseResult {
  success: boolean;
  name: string;
  displayName: string;
  category: string;
  difficulty: string;
  movementPattern: string;
  equipment: string[];
  description: string;
  tags: string[];
  phases: {
    order: number;
    name: string;
    vietnameseName: string;
    description: string;
    coachingCue: string;
    breathing: "Inhale" | "Exhale" | "Hold / Braced" | "Natural";
    muscleFocus: string;
  }[];
  muscleTargets: {
    muscleCode: string;
    muscleNameVi: string;
    role: "PRIMARY" | "SECONDARY" | "STABILIZER";
    activationLevel: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
    userGuidance: string;
  }[];
  setupInstructions: string;
  executionInstructions: string;
  tempo: string;
  coachingCues: string[];
  commonMistakes: {
    name: string;
    problem: string;
    whyItHappens: string;
    correction: string;
    severity?: "LOW" | "MEDIUM" | "HIGH";
  }[];
  safetyCues: string[];
  deduplicationNote: string;
  inhaleTiming?: string;
  exhaleTiming?: string;
  stopConditions?: string[];
  contraindications?: string;
  generalConsiderations?: string;
  tempoRule?: AiTempoRule | null;
  // GEMINI = phân tích riêng cho động tác; FALLBACK = dữ liệu mẫu khi Gemini lỗi (cần chỉnh lại)
  source?: "GEMINI" | "FALLBACK";
  warnings?: string[];
}

export interface AiTempoRule {
  eccentricSec: number;
  pauseBottomSec: number;
  concentricSec: number;
  pauseTopSec: number;
  toleranceSec: number;
}

export interface GenerateWorkoutPlanPayload {
  planGoal: "HYPERTROPHY" | "CALISTHENICS_SKILLS" | "PURE_STRENGTH" | "FAT_LOSS" | "ENDURANCE";
  targetLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  daysPerWeek: number;
  totalWeeks: number;
  focusSkill?: string;
  availableEquipment?: string[];
  existingPlanNames?: string[];
}

export interface GenerateWorkoutPlanResult {
  success: boolean;
  planTitle: string;
  targetGoal: string;
  difficulty: string;
  totalWeeks: number;
  daysPerWeek: number;
  description: string;
  weeklyScheduleOverview: string[];
  sampleWeekDays: {
    dayNumber: number;
    dayTitle: string;
    focusCategory: string;
    exercises: {
      exerciseName: string;
      sets: number;
      repsOrDuration: string;
      restSeconds: number;
      intensityNotes: string;
    }[];
  }[];
  progressionStrategy: string[];
  deduplicationNote: string;
  isDuplicate?: boolean;
  similarityScore?: number;
  conflictingPlanName?: string;
  suggestedUniqueTitle?: string;
}

export interface ValidateWorkoutPlanPayload {
  planName: string;
  planGoal: string;
  targetLevel: string;
  existingPlanNames: string[];
}

export interface ValidateWorkoutPlanResult {
  isDuplicate: boolean;
  similarityScore: number;
  conflictingPlanName?: string;
  message: string;
  suggestedUniqueTitle: string;
}

export interface GenerateAssessmentPayload {
  assessmentName?: string;
  targetAudience?: string;
  primaryMetric?: string;
  existingAssessmentProtocols?: string[];
}

export interface GenerateAssessmentResult {
  success: boolean;
  assessmentTitle: string;
  description: string;
  targetCategory: string;
  tests: {
    testExerciseName: string;
    testProtocol: string;
    timeLimitSec: string;
    keyFormRequirements: string;
    failureStopConditions: string;
  }[];
  benchmarkTiers: {
    tierName: string;
    criteriaDescription: string;
    minScore: number;
    maxScore: number;
    recommendedPlanAction: string;
  }[];
  penaltyDeductions: string[];
  deduplicationNote: string;
}

export interface GenerateMotionRulesPayload {
  exerciseName: string;
  movementPattern?: string;
  difficulty?: string;
  existingJointRules?: string[];
  existingErrorRules?: string[];
}

export interface GenerateMotionRulesResult {
  success: boolean;
  exerciseName: string;
  recommendedLandmarkIds: number[];
  cameraAngleRequirement: string;
  minBodyVisibilityPercent: number;
  jointRules: {
    ruleRoleName: string;
    measurement: string;
    condition: "LESS_THAN" | "GREATER_THAN" | "BETWEEN" | "OUTSIDE_RANGE" | "STABLE";
    targetValue: number;
    secondaryValue?: number;
    tolerance: number;
    action: "REP_COUNT_TRIGGER" | "FORM_CUE" | "WARNING" | "CRITICAL_STOP";
    voicePromptVi: string;
    movementPhase: string;
  }[];
  errorRules: {
    ruleName: string;
    category: "Alignment" | "Joint Position" | "Range of Motion" | "Stability" | "Tempo" | "Symmetry";
    conditionDescription: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    aiFeedbackVi: string;
    correctionCueVi: string;
    isInvalidRepPenalty: boolean;
  }[];
  deduplicationReport: string;
  romRules?: {
    movementName: string;
    metricType: "angle_degrees" | "depth_cm" | "height_percent";
    minROM: number;
    maxROM: number;
    tolerance: number;
    unit: string;
    description: string;
  }[];
  tempoRule?: AiTempoRule | null;
  source?: "GEMINI" | "FALLBACK";
  warnings?: string[];
}

export interface MediaUploadResult {
  success: boolean;
  secureUrl: string;
  publicId: string;
  resourceType: "image" | "video";
  format: string;
  bytes: number;
  width: number;
  height: number;
  duration?: number;
  message: string;
}

interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  duration?: number;
}

// Gemini có thể mất 30-90s để sinh nội dung dài (vd. giáo án nhiều tuần)
const AI_GENERATE_TIMEOUT_MS = 120000;

export const aiGeneratorApi = {
  // 1. Generate full exercise
  async generateExercise(payload: GenerateExercisePayload): Promise<GenerateExerciseResult> {
    const res = await apiClient.post<GenerateExerciseResult>("/admin/ai/generate/exercise", payload, { timeout: AI_GENERATE_TIMEOUT_MS });
    return res.data;
  },

  // 2. Generate workout plan
  async generateWorkoutPlan(payload: GenerateWorkoutPlanPayload): Promise<GenerateWorkoutPlanResult> {
    const res = await apiClient.post<GenerateWorkoutPlanResult>("/admin/ai/generate/workout-plan", payload, { timeout: AI_GENERATE_TIMEOUT_MS });
    return res.data;
  },

  // 2.1 Validate workout plan duplicate / collision
  async validateWorkoutPlan(payload: ValidateWorkoutPlanPayload): Promise<ValidateWorkoutPlanResult> {
    const res = await apiClient.post<ValidateWorkoutPlanResult>("/admin/ai/generate/validate/workout-plan", payload);
    return res.data;
  },

  // 3. Generate assessment rubric
  async generateAssessment(payload: GenerateAssessmentPayload): Promise<GenerateAssessmentResult> {
    const res = await apiClient.post<GenerateAssessmentResult>("/admin/ai/generate/assessment", payload, { timeout: AI_GENERATE_TIMEOUT_MS });
    return res.data;
  },

  // 4. Generate motion analysis rules
  async generateMotionRules(payload: GenerateMotionRulesPayload): Promise<GenerateMotionRulesResult> {
    const res = await apiClient.post<GenerateMotionRulesResult>("/admin/ai/generate/motion-rules", payload, { timeout: AI_GENERATE_TIMEOUT_MS });
    return res.data;
  },

  // 5. Upload media. Ưu tiên upload THẲNG từ trình duyệt lên Cloudinary bằng chữ ký do backend cấp
  // (file chỉ truyền 1 lần, có % tiến trình). Nếu Cloudinary chưa cấu hình -> upload qua backend.
  async uploadMedia(
    file: File,
    folder = "calishealth_exercises",
    onProgress?: (percent: number) => void
  ): Promise<MediaUploadResult> {
    const reportProgress = (e: AxiosProgressEvent) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    let signature: CloudinarySignature | null = null;
    try {
      const sigRes = await apiClient.post<CloudinarySignature>("/media/signature", null, { params: { folder } });
      signature = sigRes.data;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      // Lỗi quyền: upload qua backend cũng sẽ bị từ chối (và trình duyệt chỉ báo "Network Error") -> báo rõ ngay
      if (status === 401) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi tải lên.");
      if (status === 403) throw new Error("Chỉ tài khoản ADMIN mới được tải media lên.");
      // 503 (Cloudinary chưa cấu hình) / lỗi mạng -> thử upload qua backend
      signature = null;
    }

    if (signature) {
      const resourceType = file.type.startsWith("video/") ? "video" : "image";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", String(signature.timestamp));
      formData.append("folder", signature.folder);
      formData.append("public_id", signature.publicId);
      formData.append("signature", signature.signature);

      const res = await axios.post<CloudinaryUploadResponse>(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`,
        formData,
        { onUploadProgress: reportProgress, timeout: 0 }
      );
      const d = res.data;
      return {
        success: true,
        secureUrl: d.secure_url,
        publicId: d.public_id,
        resourceType: d.resource_type === "video" ? "video" : "image",
        format: d.format,
        bytes: d.bytes,
        width: d.width,
        height: d.height,
        duration: d.duration,
        message: "Upload Cloudinary thành công",
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await apiClient.post<MediaUploadResult>("/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 phút cho video lớn
      onUploadProgress: reportProgress,
    });
    return res.data;
  },
};
