import { apiClient } from "../../lib/api/client";
import type { AnswerValue, AssessmentQuestion } from "../../types";

/**
 * Bài test đầu vào do admin cấu hình (backend: /api/v1/assessments/onboarding).
 * Câu hỏi, cách chấm điểm và mức trình độ đều lấy từ backend; câu trả lời đang làm dở được lưu tạm
 * trong trình duyệt theo từng phiên bản bài để không mất khi tải lại trang.
 */

/** PENDING: cần làm | COMPLETED | SKIPPED | NOT_REQUIRED: chưa cấu hình bài | BLOCKED: chưa cấu hình & admin chặn */
export type OnboardingServerStatus = "PENDING" | "COMPLETED" | "SKIPPED" | "NOT_REQUIRED" | "BLOCKED";

export interface OnboardingStatusResponse {
  status: OnboardingServerStatus;
  mustTake: boolean;
  canSkip: boolean;
  templateId: string | null;
  templateVersion: number | null;
}

interface ServerQuestion {
  id: string;
  type: AssessmentQuestion["type"];
  prompt: string;
  helperText: string | null;
  options: { value: string; label: string; description: string | null }[];
  min: number | null;
  max: number | null;
  unit: string | null;
  required: boolean;
  category: string | null;
  minLabel: string | null;
  maxLabel: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
}

interface ServerStep {
  step: number;
  title: string | null;
  category: string | null;
  questions: ServerQuestion[];
}

export interface OnboardingQuestionnaire {
  templateId: string;
  version: number;
  title: string;
  description: string | null;
  estimatedDuration: number;
  canSkip: boolean;
  steps: { step: number; title: string; questions: AssessmentQuestion[] }[];
}

export interface OnboardingResult {
  sessionId: string;
  templateId: string;
  templateVersion: number;
  overallScore: number;
  maxScore: number;
  level: {
    code: string;
    name: string;
    description: string | null;
    recommendation: string | null;
    colorScheme: string | null;
    badgeLabel: string | null;
  } | null;
  dimensions: { category: string; score: number; questionCount: number }[];
  passed: boolean | null;
  answeredCount: number;
  scoredCount: number;
  source: string;
  completedAt: string | null;
}

/** Tên tiếng Việt của nhóm năng lực (khớp danh mục FitnessDimension phía admin) */
export const DIMENSION_LABELS: Record<string, string> = {
  // 6 năng lực của Level Engine
  PUSH: "Sức mạnh đẩy",
  PULL: "Sức mạnh kéo",
  LEGS: "Chân",
  CORE: "Thân giữa (Core)",
  MOBILITY: "Linh hoạt",
  SKILL: "Kỹ năng thăng bằng",
  UPPER_BODY_STRENGTH: "Sức mạnh thân trên",
  LOWER_BODY_STRENGTH: "Sức mạnh thân dưới",
  CORE_STABILITY: "Ổn định cơ lõi",
  MUSCULAR_ENDURANCE: "Sức bền cơ bắp",
  CARDIO_ENDURANCE: "Sức bền tim mạch",
  SHOULDER_MOBILITY: "Linh hoạt khớp vai",
  HIP_MOBILITY: "Linh hoạt khớp hông",
  ANKLE_MOBILITY: "Linh hoạt cổ chân",
  BALANCE: "Thăng bằng",
  BODY_CONTROL: "Kiểm soát cơ thể",
  CALISTHENICS_SKILL: "Kỹ năng calisthenics",
  RECOVERY: "Phục hồi",
  TRAINING_CONSISTENCY: "Thói quen luyện tập",
  PERCEIVED_EFFORT: "Cảm nhận gắng sức",
};

export const dimensionLabel = (code: string | null | undefined) =>
  (code && DIMENSION_LABELS[code]) || (code ? code.replace(/_/g, " ").toLowerCase() : "Thông tin chung");

const draftKey = (templateId: string, version: number) => `calis_onboarding_draft_${templateId}_v${version}`;

export const onboardingApi = {
  async getStatus(): Promise<OnboardingStatusResponse> {
    const res = await apiClient.get<OnboardingStatusResponse>("/assessments/onboarding/status");
    return res.data;
  },

  async getQuestionnaire(): Promise<OnboardingQuestionnaire> {
    const res = await apiClient.get<{
      templateId: string;
      version: number;
      title: string;
      description: string | null;
      estimatedDuration: number;
      canSkip: boolean;
      steps: ServerStep[];
    }>("/assessments/onboarding");
    const d = res.data;
    return {
      ...d,
      steps: d.steps.map((s) => {
        const title = s.title || dimensionLabel(s.category);
        return {
          step: s.step,
          title,
          questions: s.questions.map(
            (q): AssessmentQuestion => ({
              id: q.id,
              step: s.step,
              stepTitle: title,
              type: q.type,
              prompt: q.prompt,
              helperText: [q.helperText, q.type === "SCALE" && q.minLabel && q.maxLabel ? `${q.min} = ${q.minLabel} · ${q.max} = ${q.maxLabel}` : null]
                .filter(Boolean)
                .join(" ") || undefined,
              options: q.options.map((o) => ({ value: o.value, label: o.label, description: o.description ?? undefined })),
              min: q.min ?? undefined,
              max: q.max ?? undefined,
              unit: q.unit ?? undefined,
              required: q.required,
            })
          ),
        };
      }),
    };
  },

  async submit(templateId: string, answers: Record<string, AnswerValue>): Promise<OnboardingResult> {
    const res = await apiClient.post<OnboardingResult>("/assessments/onboarding/submit", { templateId, answers });
    return res.data;
  },

  async getResult(): Promise<OnboardingResult> {
    const res = await apiClient.get<OnboardingResult>("/assessments/onboarding/result");
    return res.data;
  },

  async skip(): Promise<OnboardingStatusResponse> {
    const res = await apiClient.post<OnboardingStatusResponse>("/assessments/onboarding/skip");
    return res.data;
  },

  // ---- Câu trả lời đang làm dở (chỉ trong trình duyệt, theo phiên bản bài) ----
  loadDraft(templateId: string, version: number): Record<string, AnswerValue> {
    try {
      return JSON.parse(localStorage.getItem(draftKey(templateId, version)) || "{}");
    } catch {
      return {};
    }
  },
  saveDraft(templateId: string, version: number, answers: Record<string, AnswerValue>) {
    try {
      localStorage.setItem(draftKey(templateId, version), JSON.stringify(answers));
    } catch {
      // ignore
    }
  },
  clearDraft(templateId: string, version: number) {
    localStorage.removeItem(draftKey(templateId, version));
  },
};
