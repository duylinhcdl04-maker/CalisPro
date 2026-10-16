import axios from 'axios';
import { apiClient } from '../../../lib/api/client';
import { Assessment, Question, AssessmentStatus } from '../types';
import { MOCK_RESULTS_ANALYTICS } from '../mock/assessmentMockData';
import { ASSESSMENT_TYPE_CONFIGS, AssessmentTypeConfig } from '../constants/assessmentTypes';

const LOCAL_STORAGE_KEY_TYPES = 'calishealth_assessment_types_v1';
const LOCAL_STORAGE_KEY_LEVELS = 'calishealth_target_levels_v1';
const LOCAL_STORAGE_KEY_GOALS = 'calishealth_training_goals_v1';

export interface TargetLevelConfig {
  code: string;
  label: string;
  isSystem?: boolean;
}

export interface TrainingGoalConfig {
  code: string;
  label: string;
  isSystem?: boolean;
}

export const DEFAULT_TARGET_LEVELS: TargetLevelConfig[] = [
  { code: 'BEGINNER', label: 'Beginner (Người mới bắt đầu)', isSystem: true },
  { code: 'INTERMEDIATE', label: 'Intermediate (Trung cấp)', isSystem: true },
  { code: 'ADVANCED', label: 'Advanced (Nâng cao)', isSystem: true },
  { code: 'ELITE', label: 'Elite (Bậc thầy / VĐV)', isSystem: true },
];

export const DEFAULT_TRAINING_GOALS: TrainingGoalConfig[] = [
  { code: 'GENERAL_FITNESS', label: 'Thể lực & Sức khỏe chung', isSystem: true },
  { code: 'STRENGTH', label: 'Phát triển Sức mạnh (Strength)', isSystem: true },
  { code: 'MUSCLE_BUILDING', label: 'Tăng cơ bắp (Hypertrophy)', isSystem: true },
  { code: 'SKILL', label: 'Chinh phục Kỹ năng (Skill)', isSystem: true },
  { code: 'MOBILITY', label: 'Dẻo dai & Linh hoạt khớp', isSystem: true },
  { code: 'ENDURANCE', label: 'Sức bền cơ & Tim mạch', isSystem: true },
];

function getStoredTargetLevels(): TargetLevelConfig[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LEVELS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_TARGET_LEVELS;
}

function saveStoredTargetLevels(items: TargetLevelConfig[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVELS, JSON.stringify(items));
  } catch {}
}

function getStoredTrainingGoals(): TrainingGoalConfig[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_GOALS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_TRAINING_GOALS;
}

function saveStoredTrainingGoals(items: TrainingGoalConfig[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_GOALS, JSON.stringify(items));
  } catch {}
}

function getStoredAssessmentTypes(): AssessmentTypeConfig[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_TYPES);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return ASSESSMENT_TYPE_CONFIGS.map(t => ({ ...t, isSystem: true }));
}

function saveStoredAssessmentTypes(items: AssessmentTypeConfig[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_TYPES, JSON.stringify(items));
  } catch {
    // ignore
  }
}


export const assessmentsApi = {
  async getTargetLevels(): Promise<TargetLevelConfig[]> {
    await new Promise((r) => setTimeout(r, 80));
    return getStoredTargetLevels();
  },

  async saveTargetLevel(item: TargetLevelConfig): Promise<TargetLevelConfig[]> {
    await new Promise((r) => setTimeout(r, 120));
    const list = getStoredTargetLevels();
    const idx = list.findIndex(l => l.code === item.code);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push({ ...item, isSystem: false });
    }
    saveStoredTargetLevels(list);
    return list;
  },

  async deleteTargetLevel(code: string): Promise<TargetLevelConfig[]> {
    await new Promise((r) => setTimeout(r, 100));
    const list = getStoredTargetLevels().filter(l => l.code !== code);
    saveStoredTargetLevels(list);
    return list;
  },

  async resetTargetLevels(): Promise<TargetLevelConfig[]> {
    await new Promise((r) => setTimeout(r, 100));
    saveStoredTargetLevels(DEFAULT_TARGET_LEVELS);
    return DEFAULT_TARGET_LEVELS;
  },

  async getTrainingGoals(): Promise<TrainingGoalConfig[]> {
    await new Promise((r) => setTimeout(r, 80));
    return getStoredTrainingGoals();
  },

  async saveTrainingGoal(item: TrainingGoalConfig): Promise<TrainingGoalConfig[]> {
    await new Promise((r) => setTimeout(r, 120));
    const list = getStoredTrainingGoals();
    const idx = list.findIndex(g => g.code === item.code);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push({ ...item, isSystem: false });
    }
    saveStoredTrainingGoals(list);
    return list;
  },

  async deleteTrainingGoal(code: string): Promise<TrainingGoalConfig[]> {
    await new Promise((r) => setTimeout(r, 100));
    const list = getStoredTrainingGoals().filter(g => g.code !== code);
    saveStoredTrainingGoals(list);
    return list;
  },

  async resetTrainingGoals(): Promise<TrainingGoalConfig[]> {
    await new Promise((r) => setTimeout(r, 100));
    saveStoredTrainingGoals(DEFAULT_TRAINING_GOALS);
    return DEFAULT_TRAINING_GOALS;
  },
  async getAssessmentTypes(): Promise<AssessmentTypeConfig[]> {
    await new Promise((r) => setTimeout(r, 100));
    return getStoredAssessmentTypes();
  },

  async saveAssessmentType(typeConfig: AssessmentTypeConfig): Promise<AssessmentTypeConfig[]> {
    await new Promise((r) => setTimeout(r, 200));
    const list = getStoredAssessmentTypes();
    const existingIndex = list.findIndex(t => t.type === typeConfig.type);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...typeConfig };
    } else {
      list.push({ ...typeConfig, isSystem: false });
    }
    saveStoredAssessmentTypes(list);
    return list;
  },

  async deleteAssessmentType(typeCode: string): Promise<AssessmentTypeConfig[]> {
    await new Promise((r) => setTimeout(r, 150));
    const list = getStoredAssessmentTypes().filter(t => t.type !== typeCode);
    saveStoredAssessmentTypes(list);
    return list;
  },

  async resetAssessmentTypes(): Promise<AssessmentTypeConfig[]> {
    await new Promise((r) => setTimeout(r, 150));
    const defaults = ASSESSMENT_TYPE_CONFIGS.map(t => ({ ...t, isSystem: true }));
    saveStoredAssessmentTypes(defaults);
    return defaults;
  },
  // ======================================================================
  // BÀI ĐÁNH GIÁ & NGÂN HÀNG CÂU HỎI (backend: /api/v1/admin/assessment-*)
  // ======================================================================

  async getAssessments(): Promise<Assessment[]> {
    const res = await apiClient.get<Assessment[]>('/admin/assessment-templates');
    return res.data;
  },

  async getAssessmentById(id: string): Promise<Assessment | null> {
    try {
      const res = await apiClient.get<Assessment>(`/admin/assessment-templates/${id}`);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) return null;
      throw err;
    }
  },

  async getQuestionsBank(): Promise<Question[]> {
    const res = await apiClient.get<Question[]>('/admin/assessment-questions');
    return res.data;
  },

  async getQuestionById(id: string): Promise<Question | null> {
    try {
      const res = await apiClient.get<Question>(`/admin/assessment-questions/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },

  /**
   * Tạo mới / cập nhật bài. Kết quả có thể kèm:
   *  - idMap: id tạm của câu hỏi mới tạo trong bài -> id thật (cần cập nhật lại form)
   *  - forkedFromId: bài đang là bài test đầu vào nên backend đã tạo PHIÊN BẢN MỚI (id khác)
   */
  async saveDraft(assessment: Partial<Assessment>): Promise<Assessment> {
    const res = await apiClient.post<Assessment>('/admin/assessment-templates', assessment);
    return res.data;
  },

  /** Coach gửi bài nháp cho Admin duyệt; Admin nhận thông báo realtime. */
  async submitReview(id: string): Promise<void> {
    await apiClient.post(`/admin/assessment-templates/${id}/submit-review`);
  },

  async publishAssessment(id: string): Promise<Assessment> {
    const res = await apiClient.post<Assessment>(`/admin/assessment-templates/${id}/publish`);
    return res.data;
  },

  async updateStatus(id: string, status: AssessmentStatus): Promise<Assessment> {
    const res = await apiClient.patch<Assessment>(`/admin/assessment-templates/${id}/status`, { status });
    return res.data;
  },

  async duplicateAssessment(id: string): Promise<Assessment> {
    const res = await apiClient.post<Assessment>(`/admin/assessment-templates/${id}/duplicate`);
    return res.data;
  },

  /** Bài đã có người làm sẽ được lưu trữ thay vì xóa hẳn (giữ kết quả). */
  async deleteAssessment(id: string): Promise<void> {
    await apiClient.delete(`/admin/assessment-templates/${id}`);
  },

  async validateAssessment(id: string, forOnboarding = false): Promise<AssessmentValidationResult> {
    const res = await apiClient.get<AssessmentValidationResult>(`/admin/assessment-templates/${id}/validation`, {
      params: { onboarding: forOnboarding },
    });
    return res.data;
  },

  async saveQuestionToBank(question: Partial<Question>): Promise<Question> {
    // id tạm phía giao diện (vd. "q-...") -> tạo mới
    const payload = { ...question, id: question.id && /^\d+$/.test(question.id) ? question.id : undefined };
    const res = await apiClient.post<Question>('/admin/assessment-questions', payload);
    return res.data;
  },

  /** Câu hỏi đang được bài nào dùng sẽ bị ẩn khỏi ngân hàng thay vì xóa hẳn. */
  async deleteQuestionFromBank(id: string): Promise<Question[]> {
    await apiClient.delete(`/admin/assessment-questions/${id}`);
    return this.getQuestionsBank();
  },

  /** Ngân hàng câu hỏi lưu ở backend, không còn dữ liệu mẫu để "khôi phục" -> tải lại danh sách. */
  async resetQuestionsBank(): Promise<Question[]> {
    return this.getQuestionsBank();
  },

  /** Thống kê tính từ dữ liệu thật của các bài đánh giá. */
  async getStatsSummary() {
    const list = await this.getAssessments();
    const totalAttempts = list.reduce((sum, a) => sum + (a.attemptsCount || 0), 0);
    const weightedScore = list.reduce((sum, a) => sum + (a.averageScore || 0) * (a.attemptsCount || 0), 0);
    return {
      totalAssessments: list.length,
      publishedAssessments: list.filter((a) => a.status === 'PUBLISHED').length,
      draftAssessments: list.filter((a) => a.status === 'DRAFT').length,
      archivedAssessments: list.filter((a) => a.status === 'ARCHIVED').length,
      totalAttempts,
      attemptsGrowthMonthPercent: 0,
      averageScore: totalAttempts ? Math.round(weightedScore / totalAttempts) : 0,
      levelDistribution: { beginner: 0, intermediate: 0, advanced: 0 },
      reassessmentDueCount: 0,
    };
  },

  // Phân tích kết quả chi tiết: chưa có API (sẽ làm cùng bước gợi ý lộ trình) -> dữ liệu minh họa
  async getResultsAnalytics(assessmentId: string) {
    await new Promise((r) => setTimeout(r, 250));
    return {
      assessmentId,
      ...MOCK_RESULTS_ANALYTICS,
    };
  },

  // ======================================================================
  // BÀI TEST ĐẦU VÀO (onboarding)
  // ======================================================================

  async getOnboardingSettings(): Promise<OnboardingSettings> {
    const res = await apiClient.get<OnboardingSettings>('/admin/assessment-onboarding');
    return res.data;
  },

  /** activeTemplateId: id bài / "" để tắt / undefined để giữ nguyên */
  async updateOnboardingSettings(update: {
    activeTemplateId?: string;
    mandatory?: boolean;
    blockWhenMissing?: boolean;
  }): Promise<OnboardingSettings> {
    const res = await apiClient.put<OnboardingSettings>('/admin/assessment-onboarding', update);
    return res.data;
  },

  async requireOnboardingRetake(): Promise<OnboardingSettings> {
    const res = await apiClient.post<OnboardingSettings>('/admin/assessment-onboarding/require-retake');
    return res.data;
  },
};

export interface AssessmentValidationResult {
  valid: boolean;
  errors: string[];
}

export interface OnboardingSettings {
  activeTemplateId: string | null;
  activeTemplateName: string | null;
  activeTemplateVersion: number | null;
  activeTemplateStatus: string | null;
  mandatory: boolean;
  blockWhenMissing: boolean;
  round: number;
  updatedAt: string | null;
  updatedBy: string | null;
  completedCount: number;
  validation: AssessmentValidationResult | null;
}

/** Lấy thông báo lỗi do backend trả về (vd. lý do không thể xuất bản). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
  }
  return fallback;
}
