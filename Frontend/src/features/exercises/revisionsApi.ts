import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api/client";

/** Chỉnh sửa của Coach trên động tác đã xuất bản, chờ Admin duyệt (backend /exercise-revisions). */

export interface RevisionChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface ExerciseRevision {
  id: number;
  exerciseId: number;
  exerciseCode: string;
  exerciseName: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  status: string;
  notes: string | null;
  changes: RevisionChange[];
}

export const REVISIONS_KEY = ["exercise-revisions"] as const;

/** Admin thấy mọi bản chờ duyệt, Coach chỉ thấy của mình. exerciseId lọc theo một bài. */
export function usePendingRevisions(exerciseId?: number, enabled = true) {
  return useQuery({
    queryKey: [...REVISIONS_KEY, exerciseId ?? "all"],
    queryFn: async () => (await apiClient.get<ExerciseRevision[]>("/exercise-revisions", { params: exerciseId ? { exerciseId } : {} })).data,
    retry: false,
    enabled,
    staleTime: 10_000,
  });
}

export function useDecideRevision() {
  const qc = useQueryClient();
  const done = () => { void qc.invalidateQueries({ queryKey: REVISIONS_KEY }); void qc.invalidateQueries({ queryKey: ["notifications"] }); };
  return {
    approve: useMutation({ mutationFn: async (id: number) => (await apiClient.post(`/exercise-revisions/${id}/approve`)).data, onSuccess: done }),
    reject: useMutation({ mutationFn: async (v: { id: number; notes: string }) => (await apiClient.post(`/exercise-revisions/${v.id}/reject`, { notes: v.notes })).data, onSuccess: done }),
  };
}
