import type { L4ReviewDetail, RuleSetDetail } from "../types";

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();
const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

function attempt(id: number, exerciseCode: string, metrics: Record<string, number>, withVideo: boolean, reps: [number, boolean, number | null, string | null][]) {
  return {
    attemptId: id,
    exerciseCode,
    attemptNo: 1,
    measurementStatus: "VALID",
    reliability: 0.82,
    movementSessionId: 9000 + id,
    metrics,
    videoUrl: withVideo ? SAMPLE_VIDEO : null,
    videoExpiresAt: withVideo ? iso(24) : null,
    reps: reps.map(([repNumber, valid, qualityScore, violationCodes]) => ({ repNumber, valid, qualityScore, violationCodes })),
  };
}

/** Bộ nhớ giả lập: được thay đổi bởi các hàm trong l4ReviewService (luôn trả bản sao). */
export const L4_REVIEWS: L4ReviewDetail[] = [
  {
    summary: { id: 3, userId: 1042, status: "PENDING", verifiedLevel: "L3", pendingLevel: "L4", createdAt: iso(-2), expiresAt: iso(12), decidedAt: null, decisionReason: null, confirmedLevel: null },
    overallScore: 90.6,
    attempts: [
      attempt(301, "muscle-up", { VALID_REPS: 4, TOTAL_REPS: 5, FORM_SCORE: 88, MAJOR_VIOLATIONS: 0, POSE_CONFIDENCE: 0.91, VISIBILITY: 0.88, TRACKED_RATIO: 0.97 }, true,
        [[1, true, 90, null], [2, true, 88, null], [3, false, 61, "KIPPING_EXCESS"], [4, true, 87, null], [5, true, 89, null]]),
      attempt(302, "handstand", { HOLD_SEC: 34, FORM_SCORE: 86, MAJOR_VIOLATIONS: 0, POSE_CONFIDENCE: 0.9, VISIBILITY: 0.9, TRACKED_RATIO: 0.96 }, true, []),
      attempt(303, "shoulder-flexion-test", { ANGLE_DEG: 176, POSE_CONFIDENCE: 0.93, VISIBILITY: 0.92, TRACKED_RATIO: 0.98 }, false, []),
    ],
  },
  {
    summary: { id: 2, userId: 877, status: "PENDING", verifiedLevel: "L3", pendingLevel: "L4", createdAt: iso(-9), expiresAt: iso(5), decidedAt: null, decisionReason: null, confirmedLevel: null },
    overallScore: 89.1,
    attempts: [attempt(201, "muscle-up", { VALID_REPS: 3, TOTAL_REPS: 3, FORM_SCORE: 86, MAJOR_VIOLATIONS: 0 }, false, [[1, true, 86, null], [2, true, 85, null], [3, true, 87, null]])],
  },
  {
    summary: { id: 1, userId: 512, status: "CONFIRMED", verifiedLevel: "L3", pendingLevel: "L4", createdAt: iso(-30), expiresAt: iso(-16), decidedAt: iso(-26), decisionReason: "Form ổn định ở cả 5 rep, video rõ.", confirmedLevel: "L4" },
    overallScore: 91.4,
    attempts: [attempt(101, "muscle-up", { VALID_REPS: 5, TOTAL_REPS: 5, FORM_SCORE: 90, MAJOR_VIOLATIONS: 0 }, false, [[1, true, 90, null], [2, true, 91, null]])],
  },
];

const params = (rows: [string, number | null, string | null, string, string | null][]) =>
  rows.map(([key, value, text, sourceType, sourceReference]) => ({ key, value, text, sourceType, sourceReference }));

const LEVELS = [
  { id: 1, code: "L0", rank: 0, name: "FOUNDATION", promoteMin: 0, regressBelow: 0, minCompetencyConfidence: 0.6, requirements: [] },
  { id: 2, code: "L1", rank: 1, name: "BEGINNER", promoteMin: 25, regressBelow: 17, minCompetencyConfidence: 0.6,
    requirements: [{ id: 11, gate: "COMPETENCY", competency: "PUSH", exerciseCode: null, metric: "SCORE", operator: "GTE", value: 20, mandatory: true, sourceType: "PRODUCT_RULE" }] },
  { id: 3, code: "L2", rank: 2, name: "INTERMEDIATE", promoteMin: 50, regressBelow: 42, minCompetencyConfidence: 0.6,
    requirements: [{ id: 21, gate: "COMPETENCY", competency: "PUSH", exerciseCode: null, metric: "SCORE", operator: "GTE", value: 45, mandatory: true, sourceType: "PRODUCT_RULE" }] },
  { id: 4, code: "L3", rank: 3, name: "ADVANCED", promoteMin: 72, regressBelow: 64, minCompetencyConfidence: 0.6,
    requirements: [{ id: 31, gate: "COMPETENCY", competency: "PUSH", exerciseCode: null, metric: "SCORE", operator: "GTE", value: 65, mandatory: true, sourceType: "PRODUCT_RULE" }] },
  { id: 5, code: "L4", rank: 4, name: "ELITE", promoteMin: 88, regressBelow: 80, minCompetencyConfidence: 0.6,
    requirements: [
      { id: 41, gate: "COMPETENCY", competency: "PUSH", exerciseCode: null, metric: "SCORE", operator: "GTE", value: 80, mandatory: true, sourceType: "PRODUCT_RULE" },
      { id: 42, gate: "COMPETENCY", competency: "MOBILITY", exerciseCode: null, metric: "SCORE", operator: "GTE", value: 60, mandatory: true, sourceType: "PRODUCT_RULE" },
    ] },
];

const PARAMS = params([
  ["ewma.alpha", 0.5, null, "PRODUCT_RULE", null],
  ["regression.confirmations", 2, null, "PRODUCT_RULE", null],
  ["regression.competencyMargin", 10, null, "PRODUCT_RULE", null],
  ["max_promotion_step", 1, null, "PRODUCT_RULE", null],
  ["initial.max_level_rank", 2, null, "PRODUCT_RULE", "Initial là tự khai báo: tối đa L2 (bất biến I18)"],
  ["fast_track.enabled", 1, null, "PRODUCT_RULE", null],
  ["level.L4.requiresCoachVerified", 1, null, "PRODUCT_RULE", "L4 cần Coach xác nhận"],
  ["mobility.target.shoulder-flexion-test", 180, null, "COACHING_BENCHMARK", "Góc gập vai: 180° => 100 điểm"],
  ["mobility.target.pike-fold-test", 90, null, "COACHING_BENCHMARK", "ĐỀ XUẤT KHỞI ĐIỂM - Coach xác nhận"],
  ["mobility.target.overhead-squat-test", 135, null, "COACHING_BENCHMARK", "ĐỀ XUẤT KHỞI ĐIỂM - Coach xác nhận"],
  ["mobility.capRatio", 1.5, null, "PRODUCT_RULE", null],
  ["overall.weight.PUSH", 0.2, null, "PRODUCT_RULE", null],
  ["overall.weight.PULL", 0.2, null, "PRODUCT_RULE", null],
  ["baseline.attempt_aggregation", null, "MIN", "PRODUCT_RULE", null],
]);

/** Bộ nhớ giả lập của rule set (v1 DRAFT do migration, v2 đang soạn). */
export const RULE_SETS: RuleSetDetail[] = [
  {
    summary: { id: 12, code: "LEVEL_ENGINE_V2", version: 2, status: "DRAFT", authorId: 7, createdBy: "coach@calis.pro", parentId: 3, createdAt: iso(-3), submittedAt: null, activatedAt: null, notes: "Bản sao từ v1" },
    params: structuredClone(PARAMS), levels: structuredClone(LEVELS), reviews: [], changes: [], validationErrors: [], requiredReviewScopes: ["CLEARANCE_RULES", "LADDER", "LEVEL_REQUIREMENTS", "OTHER", "SAFETY_POLICIES", "STICKY_FLAGS", "WEIGHTS"],
  },
  {
    summary: { id: 3, code: "LEVEL_ENGINE_V2", version: 1, status: "DRAFT", authorId: null, createdBy: "migration_assessment_v2_02_seed", parentId: null, createdAt: iso(-20), submittedAt: null, activatedAt: null, notes: "Giá trị khởi điểm do migration tạo" },
    params: structuredClone(PARAMS), levels: structuredClone(LEVELS), reviews: [], changes: [], validationErrors: [], requiredReviewScopes: ["CLEARANCE_RULES", "LADDER", "LEVEL_REQUIREMENTS", "OTHER", "SAFETY_POLICIES", "STICKY_FLAGS", "WEIGHTS"],
  },
];

// ---- Xác minh an toàn ----

import type { SafetyClearanceDetail } from "../types";

function clearanceDetail(id: number, userId: number, name: string, current: "REVIEW_REQUIRED" | "RESTRICTED", flags: [string, boolean][], constraints: string[]): SafetyClearanceDetail {
  return {
    clearance: { id, userId, method: "COACH_VERIFIED", status: "REQUESTED", decidedByType: null, resultingStatus: null, requestedAt: iso(-1), reviewedAt: null, note: null, evidenceRef: null, removedFlags: [] },
    userName: name,
    currentStatus: current,
    stale: false,
    validUntil: iso(170),
    activeFlags: flags.map(([code, sticky]) => ({ code, sticky, severity: current === "RESTRICTED" ? "RESTRICT" : "REVIEW" })),
    constraints,
    retainableConstraints: constraints,
    acknowledged: true,
    canDecide: true,
    options: current === "RESTRICTED"
      ? [{ resultingStatus: "REVIEW_REQUIRED", allowRetainedConstraints: true }, { resultingStatus: "CLEARED", allowRetainedConstraints: true }]
      : [{ resultingStatus: "CLEARED", allowRetainedConstraints: true }, { resultingStatus: "REVIEW_REQUIRED", allowRetainedConstraints: true }],
  };
}

export const SAFETY_CLEARANCES: SafetyClearanceDetail[] = [
  clearanceDetail(11, 1042, "Nguyễn Minh Anh", "REVIEW_REQUIRED", [["EXERTION_SYMPTOM", false], ["INJURY_SHOULDER", false]],
    ["LOAD_CAP_MODERATE", "NO_INVERSION", "NO_MAX_EFFORT_TEST", "NO_PLYOMETRIC", "REGION_LIMIT_SHOULDER"]),
  clearanceDetail(12, 1051, "Trần Quốc Bảo", "RESTRICTED", [["EXISTING_CONDITION", true]], ["LOAD_CAP_LOW", "LOW_INTENSITY_ONLY", "NO_MAX_EFFORT_TEST"]),
];
