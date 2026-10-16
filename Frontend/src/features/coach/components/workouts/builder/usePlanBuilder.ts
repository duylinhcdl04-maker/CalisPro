import { useEffect, useReducer, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBlocker, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDebouncedValue, useSavePlan } from "../../../hooks";
import type { PlanStatus, WorkoutPlan, WorkoutPlanInput } from "../../../types";
import { errorMessage } from "../workoutUi";
import { builderReducer, initBuilderState } from "./builderReducer";
import { emptyWeeks, findStructureIssue, MAX_WEEKS, serializeWeeks, weekHasContent } from "./planModel";
import { planHeaderSchema, type PlanHeaderValues } from "./planSchema";

export type SaveMode = "draft" | "active";
export type WeekOp = "copyNext" | "applyAll";

const DEFAULT_WEEKS = 4;

function headerDefaults(plan: WorkoutPlan | null, prefillStudentId: string | null): PlanHeaderValues {
  if (plan) {
    const { name, studentId, goal, level, durationWeeks, frequencyPerWeek, description } = plan;
    return { name, studentId: studentId ?? "", goal, level, durationWeeks, frequencyPerWeek, description };
  }
  return { name: "", studentId: prefillStudentId ?? "", goal: "STRENGTH", level: "BEGINNER", durationWeeks: DEFAULT_WEEKS, frequencyPerWeek: 3, description: "" };
}

/**
 * All builder state in one place: header form (RHF + zod), week/session structure (reducer),
 * lossy-action confirmations, save flow and leave-page protection.
 */
export function usePlanBuilder(plan: WorkoutPlan | null, prefillStudentId: string | null) {
  const navigate = useNavigate();
  const savePlan = useSavePlan();
  const form = useForm<PlanHeaderValues>({ resolver: zodResolver(planHeaderSchema), defaultValues: headerDefaults(plan, prefillStudentId), mode: "onTouched" });
  const [state, dispatch] = useReducer(builderReducer, plan?.weeks ?? emptyWeeks(DEFAULT_WEEKS), initBuilderState);
  const [saving, setSaving] = useState<SaveMode | null>(null);
  const [pendingShrink, setPendingShrink] = useState<number | null>(null);
  const [pendingWeekOp, setPendingWeekOp] = useState<WeekOp | null>(null);
  const allowLeave = useRef(false);

  const dirty = state.dirty || form.formState.isDirty;

  /* ---------------- duration <-> weeks sync (debounced while typing) ---------------- */
  const duration = useDebouncedValue(form.watch("durationWeeks"), 450);
  useEffect(() => {
    if (duration !== form.getValues("durationWeeks")) return; // still typing, or reverted
    if (!Number.isInteger(duration) || duration < 1 || duration > MAX_WEEKS || duration === state.weeks.length) return;
    if (duration < state.weeks.length && state.weeks.slice(duration).some(weekHasContent)) setPendingShrink(duration);
    else dispatch({ type: "resizeWeeks", count: duration });
  }, [duration, state.weeks, form]);

  const shrink = {
    count: pendingShrink,
    removed: pendingShrink === null ? 0 : state.weeks.length - pendingShrink,
    confirm() {
      if (pendingShrink !== null) dispatch({ type: "resizeWeeks", count: pendingShrink });
      setPendingShrink(null);
    },
    cancel() {
      form.setValue("durationWeeks", state.weeks.length, { shouldValidate: true });
      setPendingShrink(null);
    },
  };

  /* ---------------------------- week-level copy ops ---------------------------- */
  function runWeekOp(op: WeekOp) {
    const i = state.weekIndex;
    dispatch(op === "copyNext" ? { type: "copyWeekToNext", index: i } : { type: "applyWeekToAll", index: i });
    toast.success(op === "copyNext" ? `Đã nhân bản tuần ${i + 1} sang tuần ${i + 2}.` : `Đã áp dụng tuần ${i + 1} cho mọi tuần.`);
  }
  const weekOp = {
    pending: pendingWeekOp,
    request(op: WeekOp) {
      const i = state.weekIndex;
      const targets = op === "copyNext" ? state.weeks.slice(i + 1, i + 2) : state.weeks.filter((_, j) => j !== i);
      if (targets.some(weekHasContent)) setPendingWeekOp(op);
      else runWeekOp(op);
    },
    confirm() {
      if (pendingWeekOp) runWeekOp(pendingWeekOp);
      setPendingWeekOp(null);
    },
    cancel: () => setPendingWeekOp(null),
  };

  /* ---------------------------------- saving ---------------------------------- */
  function focusIssue(weekIndex: number, dayId: string) {
    dispatch({ type: "selectWeek", index: weekIndex });
    if (dayId) dispatch({ type: "selectDay", dayId });
  }

  function save(mode: SaveMode) {
    return form.handleSubmit(
      async (values) => {
        const activating = mode === "active";
        if (activating && !values.studentId) {
          form.setError("studentId", { message: "Cần chọn học viên để áp dụng giáo án." }, { shouldFocus: true });
          toast.error("Chọn học viên trước khi áp dụng giáo án.");
          return;
        }
        const issue = findStructureIssue(state.weeks, activating);
        if (issue) {
          focusIssue(issue.weekIndex, issue.dayId);
          toast.error(issue.message);
          return;
        }
        const keep = plan && plan.status !== "DRAFT";
        const status: PlanStatus = activating ? "ACTIVE" : keep ? plan.status : "DRAFT";
        const input: WorkoutPlanInput = {
          id: plan?.id,
          name: values.name.trim(),
          description: values.description.trim(),
          studentId: values.studentId || null,
          goal: values.goal,
          level: values.level,
          durationWeeks: state.weeks.length,
          frequencyPerWeek: values.frequencyPerWeek,
          status,
          weeks: serializeWeeks(state.weeks),
        };
        setSaving(mode);
        try {
          const saved = await savePlan.mutateAsync(input);
          toast.success(activating ? "Đã lưu và áp dụng giáo án." : keep ? "Đã lưu thay đổi." : "Đã lưu nháp giáo án.");
          form.reset(headerDefaults(saved, null));
          dispatch({ type: "load", weeks: saved.weeks });
          if (!plan) {
            allowLeave.current = true;
            navigate(`/coach/plans/${saved.id}`, { replace: true });
          }
        } catch (err) {
          toast.error(errorMessage(err, "Không thể lưu giáo án."));
        } finally {
          setSaving(null);
        }
      },
      () => {
        toast.error("Vui lòng kiểm tra lại thông tin giáo án.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    )();
  }

  /* --------------------------- leave-page protection --------------------------- */
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !allowLeave.current && currentLocation.pathname !== nextLocation.pathname);

  return {
    form,
    state,
    dispatch,
    dirty,
    saving,
    save,
    shrink,
    weekOp,
    blocker,
    keepStatusLabel: plan && plan.status !== "DRAFT" ? "Lưu thay đổi" : null,
    cancel: () => navigate("/coach/plans"),
  };
}
