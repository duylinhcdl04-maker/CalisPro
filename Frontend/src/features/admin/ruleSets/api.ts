import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api/client";
import type { RuleSetDetail, RuleSetStatus, RuleSetSummary } from "../../coach/types";

/** Admin duyệt và kích hoạt bộ quy tắc đánh giá V2 do Coach soạn (backend: CoachRuleSetService.decide). */
export type RuleSetDecision = "APPROVED" | "CHANGES_REQUESTED";

const KEY = ["admin", "assessment-v2", "rule-sets"] as const;

export const adminRuleSetApi = {
  async list(status: RuleSetStatus): Promise<RuleSetSummary[]> {
    return (await apiClient.get<RuleSetSummary[]>("/admin/assessment-v2/rule-sets", { params: { status } })).data;
  },
  async get(id: number): Promise<RuleSetDetail> {
    return (await apiClient.get<RuleSetDetail>(`/admin/assessment-v2/rule-sets/${id}`)).data;
  },
  async decide(id: number, decision: RuleSetDecision, notes: string): Promise<RuleSetDetail> {
    return (await apiClient.post<RuleSetDetail>(`/admin/assessment-v2/rule-sets/${id}/decision`, { decision, notes })).data;
  },
};

export function useAdminRuleSets(status: RuleSetStatus) {
  return useQuery({ queryKey: [...KEY, "list", status], queryFn: () => adminRuleSetApi.list(status), placeholderData: keepPreviousData });
}

export function useAdminRuleSet(id: number | undefined) {
  return useQuery({ queryKey: [...KEY, "detail", id ?? 0], queryFn: () => adminRuleSetApi.get(id!), enabled: id != null && !Number.isNaN(id) });
}

export function useDecideRuleSet(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { decision: RuleSetDecision; notes: string }) => adminRuleSetApi.decide(id, v.decision, v.notes),
    onSuccess: (updated) => {
      qc.setQueryData([...KEY, "detail", id], updated);
      qc.invalidateQueries({ queryKey: [...KEY, "list"] });
    },
  });
}
