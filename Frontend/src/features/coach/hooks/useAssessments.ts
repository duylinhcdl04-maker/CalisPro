import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "../services";
import type { AssessmentListParams, AssessmentReviewInput } from "../types";
import { coachKeys } from "./queryKeys";

export function useAssessments(params: AssessmentListParams) {
  return useQuery({ queryKey: coachKeys.assessmentList(params), queryFn: () => assessmentService.getAssessments(params), placeholderData: keepPreviousData });
}

export function useAssessmentCounts() {
  return useQuery({ queryKey: coachKeys.assessmentCounts(), queryFn: assessmentService.getStatusCounts });
}

export function useAssessment(id: string | undefined) {
  return useQuery({ queryKey: coachKeys.assessment(id ?? ""), queryFn: () => assessmentService.getAssessment(id!), enabled: !!id });
}

export function useSubmitAssessmentReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessmentReviewInput) => assessmentService.submitReview(input),
    onSuccess: (updated) => {
      qc.setQueryData(coachKeys.assessment(updated.id), updated);
      qc.invalidateQueries({ queryKey: coachKeys.assessments() });
      qc.invalidateQueries({ queryKey: coachKeys.dashboard() });
    },
  });
}
