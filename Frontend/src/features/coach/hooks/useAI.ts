import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiService } from "../services";
import type { AIAnalysis, AIAnalysisListParams, AIFeedbackInput, RecommendationStatus } from "../types";
import { coachKeys } from "./queryKeys";

export function useAISystemStatus() {
  return useQuery({ queryKey: coachKeys.aiStatus(), queryFn: aiService.getSystemStatus, refetchInterval: 60_000 });
}

export function useAIOverview() {
  return useQuery({ queryKey: coachKeys.aiOverview(), queryFn: aiService.getOverview });
}

export function useAIAnalyses(params: AIAnalysisListParams) {
  return useQuery({ queryKey: coachKeys.aiList(params), queryFn: () => aiService.getAnalyses(params) });
}

export function useAIAnalysis(id: string | undefined) {
  return useQuery({ queryKey: coachKeys.aiAnalysis(id ?? ""), queryFn: () => aiService.getAnalysis(id!), enabled: !!id });
}

function useAnalysisMutation<TVars>(fn: (vars: TVars) => Promise<AIAnalysis>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (analysis) => {
      qc.setQueryData(coachKeys.aiAnalysis(analysis.id), analysis);
      qc.invalidateQueries({ queryKey: coachKeys.ai() });
      qc.invalidateQueries({ queryKey: coachKeys.aiStatus() });
      qc.invalidateQueries({ queryKey: coachKeys.sessions() });
    },
  });
}

export const useUpdateRecommendation = () =>
  useAnalysisMutation(({ analysisId, recommendationId, status }: { analysisId: string; recommendationId: string; status: RecommendationStatus }) =>
    aiService.updateRecommendation(analysisId, recommendationId, status)
  );
export const useSubmitAIFeedback = () => useAnalysisMutation((input: AIFeedbackInput) => aiService.submitFeedback(input));
export const useMarkAnalysisReviewed = () => useAnalysisMutation((id: string) => aiService.markReviewed(id));
