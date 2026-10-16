import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAssignPlan, useDuplicatePlan, useUpdatePlanStatus } from "../../../hooks";
import type { PlanStatus, WorkoutPlanSummary } from "../../../types";
import { errorMessage } from "../workoutUi";

const STATUS_TOAST: Record<PlanStatus, string> = {
  ACTIVE: "Đã kích hoạt giáo án.",
  PAUSED: "Đã tạm dừng giáo án.",
  ARCHIVED: "Đã lưu trữ giáo án.",
  DRAFT: "Đã chuyển giáo án về nháp.",
};

/** Card-menu actions for the plan list, plus the modal targets they open. */
export function usePlanActions() {
  const navigate = useNavigate();
  const duplicate = useDuplicatePlan();
  const updateStatus = useUpdatePlanStatus();
  const assign = useAssignPlan();
  const [assignTarget, setAssignTarget] = useState<WorkoutPlanSummary | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<WorkoutPlanSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function onDuplicate(plan: WorkoutPlanSummary) {
    setBusyId(plan.id);
    duplicate.mutate(plan.id, {
      onSuccess: (copy) => {
        toast.success(`Đã nhân bản "${plan.name}".`);
        navigate(`/coach/plans/${copy.id}`);
      },
      onError: (err) => toast.error(errorMessage(err, "Không thể nhân bản giáo án.")),
      onSettled: () => setBusyId(null),
    });
  }

  function setStatus(plan: WorkoutPlanSummary, status: PlanStatus, onDone?: () => void) {
    setBusyId(plan.id);
    updateStatus.mutate(
      { id: plan.id, status },
      {
        onSuccess: () => {
          toast.success(STATUS_TOAST[status]);
          onDone?.();
        },
        onError: (err) => toast.error(errorMessage(err, "Không thể cập nhật trạng thái.")),
        onSettled: () => setBusyId(null),
      }
    );
  }

  function confirmAssign(studentId: string, studentName: string) {
    if (!assignTarget) return;
    assign.mutate(
      { id: assignTarget.id, studentId },
      {
        onSuccess: () => {
          toast.success(`Đã gán "${assignTarget.name}" cho ${studentName}.`);
          setAssignTarget(null);
        },
        onError: (err) => toast.error(errorMessage(err, "Không thể gán học viên.")),
      }
    );
  }

  return {
    busyId,
    onEdit: (plan: WorkoutPlanSummary) => navigate(`/coach/plans/${plan.id}`),
    onDuplicate,
    onPause: (plan: WorkoutPlanSummary) => setStatus(plan, "PAUSED"),
    onActivate: (plan: WorkoutPlanSummary) => setStatus(plan, "ACTIVE"),
    assign: { target: assignTarget, open: setAssignTarget, close: () => setAssignTarget(null), confirm: confirmAssign, pending: assign.isPending },
    archive: {
      target: archiveTarget,
      open: setArchiveTarget,
      close: () => setArchiveTarget(null),
      confirm: () => archiveTarget && setStatus(archiveTarget, "ARCHIVED", () => setArchiveTarget(null)),
      pending: updateStatus.isPending,
    },
  };
}
