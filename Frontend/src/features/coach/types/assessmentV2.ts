/** Assessment Framework V2: Coach xác nhận L4 và soạn rule set (ASSESSMENT_FRAMEWORK_V2 §32, §33). Khớp DTO của backend. */

export type L4ReviewStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "RETEST_REQUESTED" | "SUPERSEDED" | "EXPIRED";
export type L4Decision = "CONFIRM" | "REJECT" | "REQUEST_RETEST";

export interface L4ReviewSummary {
  id: number;
  userId: number;
  status: L4ReviewStatus;
  verifiedLevel: string;
  pendingLevel: string;
  createdAt: string;
  expiresAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
  confirmedLevel: string | null;
}

export interface RepEvidence {
  repNumber: number;
  valid: boolean;
  qualityScore: number | null;
  violationCodes: string | null;
}

/** videoUrl = null khi chưa có video hoặc đã hết hạn lưu. */
export interface AttemptEvidence {
  attemptId: number;
  exerciseCode: string;
  attemptNo: number;
  measurementStatus: string;
  reliability: number;
  movementSessionId: number | null;
  metrics: Record<string, number>;
  videoUrl: string | null;
  videoExpiresAt: string | null;
  reps: RepEvidence[];
}

export interface L4ReviewDetail {
  summary: L4ReviewSummary;
  overallScore: number | null;
  attempts: AttemptEvidence[];
}

export interface L4DecisionInput {
  id: number;
  decision: L4Decision;
  reason: string;
}

// ---- Rule set (Coach soạn, Admin duyệt) ----

export type RuleSetStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "ARCHIVED";

export interface RuleSetSummary {
  id: number;
  code: string;
  version: number;
  status: RuleSetStatus;
  authorId: number | null;
  createdBy: string | null;
  parentId: number | null;
  createdAt: string;
  submittedAt: string | null;
  activatedAt: string | null;
  notes: string | null;
  displayName?: string | null;
}

export interface RuleParam {
  key: string;
  value: number | null;
  text: string | null;
  sourceType: string;
  sourceReference: string | null;
}

export interface RuleRequirement {
  id: number;
  gate: string;
  competency: string | null;
  exerciseCode: string | null;
  metric: string;
  operator: string;
  value: number;
  mandatory: boolean;
  sourceType: string;
}

export interface RuleLevel {
  id: number;
  code: string;
  rank: number;
  name: string;
  promoteMin: number;
  regressBelow: number;
  minCompetencyConfidence: number;
  requirements: RuleRequirement[];
}

export interface RuleReview {
  id: number;
  reviewerId: number;
  scope: string;
  decision: "APPROVED" | "CHANGES_REQUESTED";
  notes: string | null;
  reviewedAt: string;
}

export interface RuleChange {
  id: number;
  actorId: number;
  targetType: "PARAM" | "LEVEL" | "REQUIREMENT";
  targetKey: string;
  oldValue: string | null;
  newValue: string | null;
  at: string;
}

export interface RuleSetDetail {
  summary: RuleSetSummary;
  params: RuleParam[];
  levels: RuleLevel[];
  reviews: RuleReview[];
  changes: RuleChange[];
  validationErrors: string[];
  requiredReviewScopes: string[];
}

export interface ParamUpdate {
  key: string;
  value?: number;
  text?: string;
  sourceType?: string;
  sourceReference?: string;
}

export interface LevelUpdate {
  code: string;
  promoteMin?: number;
  regressBelow?: number;
  minCompetencyConfidence?: number;
}

export interface RequirementUpdate {
  id: number;
  value: number;
}

export interface RuleSetUpdateInput {
  notes?: string;
  displayName?: string;
  params?: ParamUpdate[];
  levels?: LevelUpdate[];
  requirements?: RequirementUpdate[];
}
