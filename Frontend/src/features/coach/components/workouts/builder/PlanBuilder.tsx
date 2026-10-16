import { CalendarRange } from "lucide-react";
import { PageHeader, Panel, StatusBadge } from "../../ui";
import { PLAN_STATUS } from "../../../constants/labels";
import { formatRelative } from "../../../lib/format";
import type { WorkoutPlan } from "../../../types";
import { ConfirmDialog } from "../ConfirmDialog";
import { BuilderActionBar } from "./BuilderActionBar";
import { PlanHeaderForm } from "./PlanHeaderForm";
import { PlanSummary } from "./PlanSummary";
import { SessionBuilder } from "./SessionBuilder";
import { usePlanBuilder } from "./usePlanBuilder";
import { WeekBoard } from "./WeekBoard";
import { WeekToolbar } from "./WeekToolbar";

interface PlanBuilderProps {
  plan: WorkoutPlan | null;
  prefillStudentId: string | null;
}

/** Workout Plan Builder screen body. Mount with a `key` per plan so state re-initialises. */
export function PlanBuilder({ plan, prefillStudentId }: PlanBuilderProps) {
  const b = usePlanBuilder(plan, prefillStudentId);
  const { state, dispatch } = b;
  const week = state.weeks[state.weekIndex];
  const selectedDay = week?.days.find((d) => d.id === state.selectedDayId) ?? null;
  const frequency = b.form.watch("frequencyPerWeek");
  const name = b.form.watch("name");

  return (
    <div className="pb-2">
      <PageHeader
        back={{ to: "/coach/plans", label: "Giáo án" }}
        title={plan ? name.trim() || plan.name : "Tạo giáo án mới"}
        description={plan ? "Chỉnh sửa cấu trúc tuần, buổi tập và bài tập." : "Thiết lập thông tin, xếp lịch tuần và chọn bài tập cho từng buổi."}
        meta={
          plan ? (
            <>
              <StatusBadge status={PLAN_STATUS[plan.status]} size="md" />
              <span className="text-xs text-text-secondary">Cập nhật {formatRelative(plan.updatedAt)}</span>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <PlanHeaderForm form={b.form} />
        <div className="xl:sticky xl:top-4 xl:self-start">
          <PlanSummary weeks={state.weeks} weekIndex={state.weekIndex} frequencyTarget={frequency} />
        </div>
      </div>

      <Panel className="mt-6" title="Cấu trúc tuần" description="Kéo buổi tập bằng tay nắm để chuyển hoặc đổi chỗ giữa các ngày." icon={CalendarRange}>
        <WeekToolbar
          weeks={state.weeks}
          weekIndex={state.weekIndex}
          onSelect={(index) => dispatch({ type: "selectWeek", index })}
          onCopyToNext={() => b.weekOp.request("copyNext")}
          onApplyToAll={() => b.weekOp.request("applyAll")}
        />
        {week && (
          <div className="mt-4">
            <WeekBoard
              week={week}
              selectedDayId={state.selectedDayId}
              onSelectDay={(dayId) => dispatch({ type: "selectDay", dayId })}
              onAddSession={(dayId) => {
                dispatch({ type: "addSession", dayId });
                dispatch({ type: "selectDay", dayId });
              }}
              onSwap={(fromDayId, toDayId) => {
                dispatch({ type: "swapDays", fromDayId, toDayId });
                dispatch({ type: "selectDay", dayId: toDayId });
              }}
            />
          </div>
        )}
      </Panel>

      <div className="mt-6">
        <SessionBuilder key={selectedDay?.id ?? "none"} day={selectedDay} weekNumber={state.weekIndex + 1} dispatch={dispatch} />
      </div>

      <BuilderActionBar
        dirty={b.dirty}
        saving={b.saving}
        keepStatusLabel={b.keepStatusLabel}
        onCancel={b.cancel}
        onSaveDraft={() => b.save("draft")}
        onSaveActive={() => b.save("active")}
      />

      <ConfirmDialog
        open={b.shrink.count !== null}
        title="Giảm số tuần?"
        description={`${b.shrink.removed} tuần cuối đang có buổi tập sẽ bị xoá khỏi giáo án. Bạn có thể huỷ để giữ nguyên ${state.weeks.length} tuần.`}
        confirmLabel="Xoá tuần"
        onConfirm={b.shrink.confirm}
        onCancel={b.shrink.cancel}
      />
      <ConfirmDialog
        open={b.weekOp.pending !== null}
        title={b.weekOp.pending === "applyAll" ? "Áp dụng cho mọi tuần?" : "Ghi đè tuần sau?"}
        description={
          b.weekOp.pending === "applyAll"
            ? `Mọi tuần khác sẽ được thay bằng cấu trúc của tuần ${state.weekIndex + 1}. Nội dung hiện có ở các tuần đó sẽ mất.`
            : `Tuần ${state.weekIndex + 2} đã có buổi tập. Nội dung đó sẽ được thay bằng bản sao của tuần ${state.weekIndex + 1}.`
        }
        confirmLabel="Ghi đè"
        tone="primary"
        onConfirm={b.weekOp.confirm}
        onCancel={b.weekOp.cancel}
      />
      <ConfirmDialog
        open={b.blocker.state === "blocked"}
        title="Rời khỏi trình soạn giáo án?"
        description="Các thay đổi chưa lưu sẽ bị mất."
        confirmLabel="Rời trang"
        cancelLabel="Ở lại"
        onConfirm={() => b.blocker.proceed?.()}
        onCancel={() => b.blocker.reset?.()}
      />
    </div>
  );
}
