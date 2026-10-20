import { apiClient } from "../../lib/api/client";

/** API Motion Rule Engine (backend/docs/MOTION_RULE_ENGINE_DESIGN.md §10). */

export type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type RuleStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";

export interface MetricTypeDto {
  type: string;
  timing: "FRAME" | "REP";
  operators: string[];
  units: string[];
  measurementHint?: string;
  reliabilityMetric: boolean;
}
export interface LandmarkDto { index: number; code: string; name: string }
export interface CatalogDto {
  metricTypes: MetricTypeDto[];
  landmarks: LandmarkDto[];
  severities: Severity[];
  sourceTypes: string[];
  cameraViews: string[];
  statuses: RuleStatus[];
  qualityPenalties: Record<string, number>;
}

export interface MeasurementDto {
  points?: number[];
  pointsRight?: number[];
  method?: string | null;
  axis?: string | null;
  phase?: string | null;
  windowFrames?: number | null;
}
export interface PhaseDto { id: number; code: string; name: string; description?: string; sortOrder: number }
export interface ProfileDto {
  id: number; exerciseId: number; exerciseCode?: string; categoryName?: string; exerciseName: string; profileName: string; version: string; status: string;
  cameraView?: string; movementType: "REPS" | "HOLD"; repMetric?: MeasurementDto;
  repTopThreshold?: number; repBottomThreshold?: number; repDirection: string;
  debounceTimeMs?: number; minRepDurationMs?: number; maxRepDurationMs?: number;
  minPoseConfidence: number; minLandmarkVisibility: number;
  voiceWarningEnabled: boolean; textWarningEnabled: boolean; phases: PhaseDto[]; issues: string[];
}
export type ProfileUpsertRequest = Partial<Omit<ProfileDto, "id" | "exerciseId" | "exerciseCode" | "categoryName" | "exerciseName" | "status" | "phases" | "issues">>;

export interface BandDto { severity: Severity; min?: number | null; max?: number | null; minInclusive?: boolean; maxInclusive?: boolean }
export interface LegacyDto {
  metricType?: string; operator?: string; thresholdMin?: number; thresholdMax?: number; feedbackMessage?: string; voicePrompt?: string;
}
export interface RuleDto {
  id: number; profileId: number; code: string; version: number; name: string; description?: string; status: RuleStatus;
  phase: string; metricType: string; measurement?: MeasurementDto; unit?: string; operator: string;
  target?: number; normalMin?: number; normalMax?: number; normalMinInclusive: boolean; normalMaxInclusive: boolean;
  bands: BandDto[]; severity: Severity; priority: number; invalidRep: boolean; invalidRepMinSeverity?: Severity;
  stopExercise: boolean; persistenceType: "FRAME" | "TIME"; persistenceValue: number; cooldownMs: number;
  evaluationIntervalMs: number; feedbackCode?: string; cameraView?: string; sourceType?: string; sourceReference?: string;
  changeNote?: string; previousVersionId?: number; expected?: string; createdBy?: string; updatedBy?: string;
  submittedBy?: string; submittedAt?: string; approvedBy?: string; approvedAt?: string; lastTestedAt?: string;
  updatedAt?: string; testedSinceLastChange: boolean; errors: string[]; warnings: string[]; legacy?: LegacyDto;
}
export interface RuleUpsertRequest {
  code?: string; name?: string; description?: string; phase?: string; metricType?: string; measurement?: MeasurementDto;
  unit?: string; operator?: string; target?: number | null; normalMin?: number | null; normalMax?: number | null;
  normalMinInclusive?: boolean; normalMaxInclusive?: boolean; bands?: BandDto[]; severity?: Severity; priority?: number;
  invalidRep?: boolean; invalidRepMinSeverity?: Severity | null; stopExercise?: boolean; persistenceType?: "FRAME" | "TIME";
  persistenceValue?: number; cooldownMs?: number; evaluationIntervalMs?: number; feedbackCode?: string; cameraView?: string;
  sourceType?: string; sourceReference?: string; changeNote?: string;
}
export interface RuleVersionDto {
  id: number; version: number; status: RuleStatus; changeNote?: string; updatedBy?: string; updatedAt?: string;
  approvedBy?: string; approvedAt?: string;
}
export interface AuditDto { id: number; action: string; userEmail?: string; reason?: string; oldValue?: string; newValue?: string; createdAt: string }

export interface TestSample { t: number; value: number | null }
export interface TestStepDto {
  t: number; observed?: number; evaluated?: number; status: string; confirmedSeverity?: Severity;
  violationFired: boolean; feedbackSpoken: boolean; note?: string;
}
export interface RuleTestResponse {
  status?: string; observed?: number; evaluated?: number; expected?: string; band?: string; feedbackCode?: string;
  uiText?: string; voiceText?: string; invalidRep: boolean; stopExercise: boolean; steps: TestStepDto[];
  errors: string[]; warnings: string[];
}

export type AudioStatus = "GENERATED" | "NOT_GENERATED" | "OUTDATED" | "NO_VOICE_TEXT";
export interface FeedbackTemplateDto {
  id: number; profileId?: number; feedbackCode: string; language: string; uiText: string; voiceText?: string;
  active: boolean; audioStatus: AudioStatus; audioUrl?: string; usedByRules: string[]; updatedAt?: string;
}
export interface FeedbackTemplateRequest { feedbackCode: string; language?: string; uiText: string; voiceText?: string; active?: boolean }

export interface ProfileSummaryDto {
  id: number; exerciseId: number; exerciseCode: string; exerciseName: string; profileName: string; version: string; status: string;
  cameraView: string | null; movementType: string | null; publishedRules: number; draftRules: number;
}

/** status: CREATED (đã lưu bản nháp) | DUPLICATE (trùng rule đã có của bài) | INVALID (không hợp lệ theo bộ kiểm tra của engine). */
export interface GeneratedRuleOutcome {
  status: "CREATED" | "DUPLICATE" | "INVALID";
  code: string | null;
  name: string | null;
  reason: string | null;
  errors: string[];
  ruleId: number | null;
  rationale: string | null;
}

export interface GenerateRulesResponse {
  aiAvailable: boolean;
  message: string;
  created: number;
  duplicates: number;
  invalid: number;
  outcomes: GeneratedRuleOutcome[];
}

const A = "/admin";

export const motionRulesApi = {
  catalog: async () => (await apiClient.get<CatalogDto>(`${A}/motion/catalog`)).data,
  profiles: async () => (await apiClient.get<ProfileSummaryDto[]>(`${A}/motion-profiles`)).data,
  profile: async (id: number) => (await apiClient.get<ProfileDto>(`${A}/motion-profiles/${id}`)).data,
  updateProfile: async (id: number, req: ProfileUpsertRequest) => (await apiClient.put<ProfileDto>(`${A}/motion-profiles/${id}`, req)).data,
  updatePhase: async (id: number, code: string, name: string, description?: string) =>
    (await apiClient.put<ProfileDto>(`${A}/motion-profiles/${id}/phases`, { code, name, description })).data,

  /** AI soạn rule cho bài (Gemini có thể chạy tới ~100 giây). Chỉ lưu bản nháp hợp lệ và không trùng. */
  generateRules: async (profileId: number, req: { count?: number; focus?: string }) =>
    (await apiClient.post<GenerateRulesResponse>(`${A}/motion-profiles/${profileId}/ai-rules`, req, { timeout: 130_000 })).data,
  aiRulesPrompt: async (profileId: number, count?: number, focus?: string) =>
    (await apiClient.get<{ version: string; prompt: string }>(`${A}/motion-profiles/${profileId}/ai-rules/prompt`, { params: { count, focus } })).data,

  rules: async (profileId: number) => (await apiClient.get<RuleDto[]>(`${A}/motion-profiles/${profileId}/rules`)).data,
  rule: async (id: number) => (await apiClient.get<RuleDto>(`${A}/motion-rules/${id}`)).data,
  createRule: async (profileId: number, req: RuleUpsertRequest) =>
    (await apiClient.post<RuleDto>(`${A}/motion-profiles/${profileId}/rules`, req)).data,
  updateRule: async (id: number, req: RuleUpsertRequest) => (await apiClient.put<RuleDto>(`${A}/motion-rules/${id}`, req)).data,
  deleteRule: async (id: number) => { await apiClient.delete(`${A}/motion-rules/${id}`); },
  test: async (id: number, body: { value?: number; samples?: TestSample[] }) =>
    (await apiClient.post<RuleTestResponse>(`${A}/motion-rules/${id}/test`, body)).data,
  workflow: async (id: number, action: "submit-review" | "reject" | "publish" | "archive", note?: string) =>
    (await apiClient.post<RuleDto>(`${A}/motion-rules/${id}/${action}`, { note })).data,
  versions: async (id: number) => (await apiClient.get<RuleVersionDto[]>(`${A}/motion-rules/${id}/versions`)).data,
  audit: async (id: number) => (await apiClient.get<AuditDto[]>(`${A}/motion-rules/${id}/audit`)).data,

  templates: async (profileId: number) =>
    (await apiClient.get<FeedbackTemplateDto[]>(`${A}/motion-profiles/${profileId}/feedback-templates`)).data,
  saveTemplate: async (profileId: number, req: FeedbackTemplateRequest, id?: number) =>
    id
      ? (await apiClient.put<FeedbackTemplateDto>(`${A}/motion-profiles/${profileId}/feedback-templates/${id}`, req)).data
      : (await apiClient.post<FeedbackTemplateDto>(`${A}/motion-profiles/${profileId}/feedback-templates`, req)).data,
  generateAudio: async (templateId: number) =>
    (await apiClient.post<FeedbackTemplateDto>(`${A}/motion-feedback-templates/${templateId}/generate-audio`)).data,
};

/** Lấy thông báo lỗi từ ApiError của backend. */
export function errorMessage(e: unknown, fallback = "Có lỗi xảy ra"): string {
  const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return m || (e as Error)?.message || fallback;
}

export const SEVERITY_STYLE: Record<string, string> = {
  NORMAL: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  INFO: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  WARNING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  ERROR: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  CRITICAL: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  UNCLASSIFIED: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
  UNRELIABLE: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30",
  SKIPPED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export const STATUS_STYLE: Record<RuleStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30",
  PENDING_REVIEW: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  ARCHIVED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export const STATUS_LABEL: Record<RuleStatus, string> = {
  DRAFT: "Nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đang chạy",
  ARCHIVED: "Lưu trữ",
};

export const OPERATOR_LABEL: Record<string, string> = {
  BETWEEN: "Nằm trong khoảng",
  OUTSIDE: "Nằm ngoài khoảng",
  MINIMUM_REQUIRED: "Tối thiểu (≥)",
  MAXIMUM_ALLOWED: "Tối đa (≤)",
  GREATER_THAN: "Lớn hơn (>)",
  GREATER_THAN_OR_EQUAL: "Lớn hơn hoặc bằng (≥)",
  LESS_THAN: "Nhỏ hơn (<)",
  LESS_THAN_OR_EQUAL: "Nhỏ hơn hoặc bằng (≤)",
  DEVIATION_FROM_TARGET: "Lệch khỏi mục tiêu tối đa",
  EQUAL: "Bằng",
  NOT_EQUAL: "Khác",
};

export const METRIC_LABEL: Record<string, string> = {
  ANGLE_3_POINT: "Góc 3 điểm",
  DISTANCE: "Khoảng cách",
  ROM: "Biên độ (ROM)",
  ALIGNMENT: "Căn thẳng",
  SYMMETRY: "Đối xứng trái/phải",
  VELOCITY: "Vận tốc",
  ACCELERATION: "Gia tốc",
  TEMPO: "Nhịp (tempo)",
  DURATION: "Thời gian giữ",
  STABILITY: "Độ ổn định",
  LANDMARK_VISIBILITY: "Độ rõ landmark",
  POSE_CONFIDENCE: "Độ tin cậy tư thế",
  REP_SEQUENCE: "Chuỗi pha của rep",
  REP_VALIDATION: "Thời lượng rep hợp lệ",
};

/** Toán tử cần ô nào của vùng chuẩn. */
export function normalFields(op: string): { min: boolean; max: boolean; target: boolean } {
  switch (op) {
    case "BETWEEN":
    case "OUTSIDE":
      return { min: true, max: true, target: op === "BETWEEN" };
    case "MINIMUM_REQUIRED":
    case "GREATER_THAN":
    case "GREATER_THAN_OR_EQUAL":
      return { min: true, max: false, target: false };
    case "MAXIMUM_ALLOWED":
    case "LESS_THAN":
    case "LESS_THAN_OR_EQUAL":
      return { min: false, max: true, target: false };
    case "DEVIATION_FROM_TARGET":
      return { min: false, max: true, target: true };
    case "EQUAL":
    case "NOT_EQUAL":
      return { min: false, max: false, target: true };
    default:
      return { min: true, max: true, target: false };
  }
}
