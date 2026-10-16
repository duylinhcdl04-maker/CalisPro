import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { l4ReviewService, ruleSetService, safetyClearanceService } from "../services";
import type { L4DecisionInput, L4ReviewStatus, RuleSetUpdateInput, SafetyClearanceStatus, SafetyDecisionInput } from "../types";
import { coachKeys } from "./queryKeys";

// ---- Xác nhận L4 ----

export function useL4Reviews(status: L4ReviewStatus) {
  return useQuery({ queryKey: coachKeys.l4ReviewList(status), queryFn: () => l4ReviewService.list(status), placeholderData: keepPreviousData });
}

export function useL4Review(id: number | undefined) {
  return useQuery({ queryKey: coachKeys.l4Review(id ?? 0), queryFn: () => l4ReviewService.get(id!), enabled: id != null && !Number.isNaN(id) });
}

export function useDecideL4Review() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: L4DecisionInput) => l4ReviewService.decide(input),
    onSuccess: (_updated, input) => {
      qc.invalidateQueries({ queryKey: coachKeys.l4Review(input.id) });
      qc.invalidateQueries({ queryKey: coachKeys.l4Reviews() });
    },
  });
}

// ---- Bộ quy tắc (rule set) ----

export function useRuleSets() {
  return useQuery({ queryKey: coachKeys.ruleSetList(), queryFn: ruleSetService.list });
}

export function useRuleSet(id: number | undefined) {
  return useQuery({ queryKey: coachKeys.ruleSet(id ?? 0), queryFn: () => ruleSetService.get(id!), enabled: id != null && !Number.isNaN(id) });
}

export function useCloneRuleSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ruleSetService.clone(id),
    onSuccess: (created) => {
      qc.setQueryData(coachKeys.ruleSet(created.summary.id), created);
      qc.invalidateQueries({ queryKey: coachKeys.ruleSetList() });
    },
  });
}

export function useUpdateRuleSet(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RuleSetUpdateInput) => ruleSetService.update(id, input),
    onSuccess: (updated) => {
      qc.setQueryData(coachKeys.ruleSet(id), updated);
      qc.invalidateQueries({ queryKey: coachKeys.ruleSetList() });
    },
  });
}

export function useSubmitRuleSet(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ruleSetService.submit(id),
    onSuccess: (updated) => {
      qc.setQueryData(coachKeys.ruleSet(id), updated);
      qc.invalidateQueries({ queryKey: coachKeys.ruleSetList() });
    },
  });
}

// ---- Xác minh an toàn ----

export function useSafetyClearances(status: SafetyClearanceStatus) {
  return useQuery({ queryKey: coachKeys.safetyClearanceList(status), queryFn: () => safetyClearanceService.list(status), placeholderData: keepPreviousData });
}

export function useSafetyClearance(id: number | undefined) {
  return useQuery({ queryKey: coachKeys.safetyClearance(id ?? 0), queryFn: () => safetyClearanceService.get(id!), enabled: id != null && !Number.isNaN(id) });
}

export function useDecideSafetyClearance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SafetyDecisionInput) => safetyClearanceService.decide(input),
    onSuccess: (_updated, input) => {
      qc.invalidateQueries({ queryKey: coachKeys.safetyClearance(input.id) });
      qc.invalidateQueries({ queryKey: coachKeys.safetyClearances() });
    },
  });
}
