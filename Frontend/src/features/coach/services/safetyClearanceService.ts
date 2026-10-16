import { MockApiError } from "../../../services/mock/latency";
import type { SafetyClearance, SafetyClearanceDetail, SafetyClearanceStatus, SafetyDecisionInput } from "../types";
import { SAFETY_CLEARANCES } from "../mock/assessmentV2.mock";
import { COACH_ENDPOINTS, USE_MOCK_API, api, mockResponse } from "./http";

function find(id: number) {
  const found = SAFETY_CLEARANCES.find((c) => c.clearance.id === id);
  if (!found) throw new MockApiError("Không tìm thấy yêu cầu xác minh.", 404);
  return found;
}

/** Coach xác minh sàng lọc an toàn (backend: SafetyClearanceService). Nhánh mock phản ánh quy tắc của backend. */
export const safetyClearanceService = {
  async list(status: SafetyClearanceStatus = "REQUESTED"): Promise<SafetyClearance[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.safetyClearances, { status });
    return mockResponse(SAFETY_CLEARANCES.filter((c) => c.clearance.status === status).map((c) => c.clearance));
  },

  async get(id: number): Promise<SafetyClearanceDetail> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.safetyClearance(id));
    return mockResponse(find(id));
  },

  async decide({ id, decision, resultingStatus, retainedConstraints, note }: SafetyDecisionInput): Promise<SafetyClearance> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.safetyClearanceDecision(id), { decision, resultingStatus, retainedConstraints, note });
    const item = find(id);
    if (item.clearance.status !== "REQUESTED") throw new MockApiError(`Yêu cầu đã được xử lý: ${item.clearance.status}`, 409);
    if (decision === "REJECTED" && !note.trim()) throw new MockApiError("Từ chối phải kèm lý do", 400);
    if (decision === "GRANTED" && !item.options.some((o) => o.resultingStatus === resultingStatus)) {
      throw new MockApiError(`CLEARANCE_METHOD_NOT_ALLOWED: không có clearance rule cho ${item.currentStatus} → ${resultingStatus}`, 400);
    }
    item.clearance = {
      ...item.clearance,
      status: decision,
      decidedByType: "REVIEWER",
      resultingStatus: decision === "GRANTED" ? resultingStatus ?? null : null,
      reviewedAt: new Date().toISOString(),
      note: note.trim() || null,
    };
    item.canDecide = false;
    return mockResponse(item.clearance, 500);
  },
};
