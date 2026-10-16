import type { RuleSetDetail, RuleSetSummary, RuleSetUpdateInput } from "../types";
import { COACH_ENDPOINTS, api } from "./http";

/**
 * Coach soạn rule set V2 (backend: CoachRuleSetService). Chỉ tác giả sửa bản DRAFT; gửi duyệt xong bản bất biến cho tới khi Admin quyết định.
 * Luôn gọi API thật, không dùng nhánh mock: bản gửi duyệt phải tới tay Admin và tạo thông báo thật.
 */
export const ruleSetService = {
  list: (): Promise<RuleSetSummary[]> => api.get(COACH_ENDPOINTS.ruleSets),
  get: (id: number): Promise<RuleSetDetail> => api.get(COACH_ENDPOINTS.ruleSet(id)),
  clone: (id: number): Promise<RuleSetDetail> => api.post(COACH_ENDPOINTS.ruleSetClone(id)),
  update: (id: number, input: RuleSetUpdateInput): Promise<RuleSetDetail> => api.put(COACH_ENDPOINTS.ruleSet(id), input),
  submit: (id: number): Promise<RuleSetDetail> => api.post(COACH_ENDPOINTS.ruleSetSubmit(id)),
};
