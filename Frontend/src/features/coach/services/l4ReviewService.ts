import { MockApiError } from "../../../services/mock/latency";
import type { L4DecisionInput, L4ReviewDetail, L4ReviewStatus, L4ReviewSummary } from "../types";
import { L4_REVIEWS } from "../mock/assessmentV2.mock";
import { COACH_ENDPOINTS, USE_MOCK_API, api, mockResponse } from "./http";

const DECISION_STATUS = { CONFIRM: "CONFIRMED", REJECT: "REJECTED", REQUEST_RETEST: "RETEST_REQUESTED" } as const;

function find(id: number) {
  const found = L4_REVIEWS.find((r) => r.summary.id === id);
  if (!found) throw new MockApiError("Không tìm thấy gói xác nhận.", 404);
  return found;
}

/** Coach xác nhận L4 (backend: L4ReviewService). Nhánh mock phản ánh đúng các quy tắc của backend để thử giao diện không cần bật V2. */
export const l4ReviewService = {
  async list(status: L4ReviewStatus = "PENDING"): Promise<L4ReviewSummary[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.l4Reviews, { status });
    return mockResponse(L4_REVIEWS.filter((r) => r.summary.status === status).map((r) => r.summary));
  },

  async get(id: number): Promise<L4ReviewDetail> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.l4Review(id));
    return mockResponse(find(id));
  },

  async decide({ id, decision, reason }: L4DecisionInput): Promise<L4ReviewSummary> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.l4ReviewDecision(id), { decision, reason });
    const review = find(id);
    if (review.summary.status !== "PENDING") throw new MockApiError(`REVIEW_NOT_PENDING: gói đang ở trạng thái ${review.summary.status}`, 409);
    if (decision !== "CONFIRM" && !reason.trim()) throw new MockApiError("REASON_REQUIRED: cần ghi lý do khi từ chối hoặc yêu cầu đo lại", 400);
    if (decision === "CONFIRM" && !review.attempts.some((a) => a.videoUrl)) {
      throw new MockApiError("VIDEO_EVIDENCE_REQUIRED: không có video còn hạn để xác nhận - hãy yêu cầu đo lại", 409);
    }
    review.summary = {
      ...review.summary,
      status: DECISION_STATUS[decision],
      decidedAt: new Date().toISOString(),
      decisionReason: reason.trim() || null,
      confirmedLevel: decision === "CONFIRM" ? review.summary.pendingLevel : null,
    };
    return mockResponse(review.summary, 500);
  },
};
