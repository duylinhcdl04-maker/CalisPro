import { apiClient } from "../../lib/api/client";
import type { CompetencyDto, EvaluationDto } from "./api";

/** API quản trị Level Engine: rule set có version, mô phỏng, ma trận độ phủ giáo án. */

export interface RuleSetSummary {
  id: string;
  code: string;
  version: number;
  status: "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "ARCHIVED";
  parentId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  activatedAt?: string | null;
  /** id người soạn bản DRAFT và thời điểm gửi duyệt (quy trình Coach soạn, Admin duyệt) */
  authorId?: number | null;
  submittedAt?: string | null;
}

export interface ParamDto { key: string; value: number; sourceType: string; sourceReference?: string | null }
export interface LadderNodeDto {
  competency: string; exerciseId: string; exerciseCode: string; exerciseName: string; order: number; metric: string;
  base: number; span: number; target: number; entry: number; sourceType: string; sourceReference?: string | null;
}
export interface RequirementDto {
  gate: string; competency?: string | null; exerciseId?: string | null; exerciseCode?: string | null; metric?: string | null;
  operator: string; value: number; mandatory: boolean; sourceType: string; sourceReference?: string | null;
}
export interface LevelConfigDto {
  code: string; rank: number; name: string; promoteMin: number; regressBelow: number; minConfidence: number;
  description?: string | null; colorScheme?: string | null; requirements: RequirementDto[];
}
export interface ConsistencyRuleDto { code: string; conditionJson: string; severity: string; affectedCompetencies: string[]; message: string }

export interface RuleSetDetail {
  ruleSet: RuleSetSummary;
  params: ParamDto[];
  ladders: LadderNodeDto[];
  levels: LevelConfigDto[];
  consistencyRules: ConsistencyRuleDto[];
}

export interface SimulateRequest {
  ruleSetId?: string;
  currentLevel: string;
  status?: string;
  previousEwma?: number;
  competencies: Record<string, number>;
  tests: { exerciseCode: string; totalReps?: number; validReps?: number; holdSec?: number; formScore?: number }[];
  nodeStatus?: Record<string, string>;
  baseline?: boolean;
  coachVerified?: boolean;
}

export interface SimulateResponse { overallScore: number | null; evaluation: EvaluationDto; competencies: CompetencyDto[] }

export const levelAdminApi = {
  list: () => apiClient.get<RuleSetSummary[]>("/admin/level-engine/rule-sets").then((r) => r.data),
  detail: (id: string) => apiClient.get<RuleSetDetail>(`/admin/level-engine/rule-sets/${id}`).then((r) => r.data),
  clone: (id: string) => apiClient.post<RuleSetDetail>(`/admin/level-engine/rule-sets/${id}/clone`).then((r) => r.data),
  update: (id: string, d: Omit<RuleSetDetail, "ruleSet"> & { notes?: string | null }) =>
    apiClient.put<RuleSetDetail>(`/admin/level-engine/rule-sets/${id}`, d).then((r) => r.data),
  validate: (id: string) => apiClient.get<{ valid: boolean; errors: string[] }>(`/admin/level-engine/rule-sets/${id}/validate`).then((r) => r.data),
  /** Coach gửi bản DRAFT của mình cho Admin duyệt (Admin nhận thông báo realtime). */
  submit: (id: string) => apiClient.post<RuleSetDetail>(`/admin/level-engine/rule-sets/${id}/submit`).then((r) => r.data),
  /** Tác giả rút lại yêu cầu duyệt để sửa tiếp. */
  withdraw: (id: string) => apiClient.post<RuleSetDetail>(`/admin/level-engine/rule-sets/${id}/withdraw`).then((r) => r.data),
  /** Admin: APPROVED = kích hoạt làm bản chính; CHANGES_REQUESTED = trả về Coach kèm lý do (bắt buộc). */
  decide: (id: string, decision: "APPROVED" | "CHANGES_REQUESTED", notes?: string) =>
    apiClient.post<RuleSetDetail>(`/admin/level-engine/rule-sets/${id}/decision`, { decision, notes }).then((r) => r.data),
  activate: (id: string) => apiClient.post<RuleSetDetail>(`/admin/level-engine/rule-sets/${id}/activate`).then((r) => r.data),
  simulate: (req: SimulateRequest) => apiClient.post<SimulateResponse>("/admin/level-engine/simulate", req).then((r) => r.data),
};
