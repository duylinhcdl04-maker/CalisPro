import { useMutation, useQuery } from "@tanstack/react-query";
import { onboardingApi } from "./api";
import type { AnswerValue } from "../../types";

export function useOnboardingQuestionnaireQuery(enabled = true) {
  return useQuery({
    queryKey: ["onboarding-questionnaire"],
    queryFn: onboardingApi.getQuestionnaire,
    enabled,
    retry: false,
    staleTime: 0,
  });
}

export function useOnboardingStatusQuery() {
  return useQuery({ queryKey: ["onboarding-status"], queryFn: onboardingApi.getStatus, retry: false, staleTime: 0 });
}

export function useSubmitOnboardingMutation() {
  return useMutation({
    mutationFn: ({ templateId, answers }: { templateId: string; answers: Record<string, AnswerValue> }) =>
      onboardingApi.submit(templateId, answers),
  });
}

export function useSkipOnboardingMutation() {
  return useMutation({ mutationFn: onboardingApi.skip });
}

/**
 * @deprecated Câu trả lời của bộ câu hỏi MOCK cũ (services/mock) - chỉ còn trang Hồ sơ dùng để hiển thị mục tiêu.
 * Sẽ thay bằng dữ liệu hồ sơ / mục tiêu thật khi làm bước gợi ý lộ trình.
 */
export function useSavedAnswersQuery() {
  return useQuery({
    queryKey: ["legacy-assessment-answers"],
    queryFn: () => import("../../services/mock/assessmentService").then((m) => m.assessmentService.getSavedAnswers()),
  });
}
