import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api/client";
import type { AiInfo } from "../training/api";

/** Trạng thái AI Coach của một bài (backend /exercises/{id}/ai-coach): bài đã được Coach bật tích hợp AI và đủ cấu hình đo chưa. */
export interface AiCoachInfo {
  exerciseId: number;
  code: string;
  name: string;
  ai: AiInfo;
}

export function useAiCoach(backendId: number | undefined) {
  return useQuery({
    queryKey: ["exercise-ai-coach", backendId],
    queryFn: async () => (await apiClient.get<AiCoachInfo>(`/exercises/${backendId}/ai-coach`)).data,
    enabled: backendId != null,
    retry: false,
  });
}
