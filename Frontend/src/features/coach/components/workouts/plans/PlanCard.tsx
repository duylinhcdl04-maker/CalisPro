import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { Archive, CalendarDays, Copy, Loader2, MoreHorizontal, Pause, Pencil, Play, UserPlus, UserRound } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Button3D, Popover, ScoreBar, StatusBadge, StudentAvatar } from "../../ui";
import { GOAL_LABEL, LEVEL_LABEL, PLAN_STATUS } from "../../../constants/labels";
import { formatRelative } from "../../../lib/format";
import type { WorkoutPlanSummary } from "../../../types";

export interface PlanCardActions {
  onEdit: (p: WorkoutPlanSummary) => void;
  onDuplicate: (p: WorkoutPlanSummary) => void;
  onAssign: (p: WorkoutPlanSummary) => void;
  onPause: (p: WorkoutPlanSummary) => void;
  onActivate: (p: WorkoutPlanSummary) => void;
  onArchive: (p: WorkoutPlanSummary) => void;
}

interface PlanCardProps extends PlanCardActions {
  plan: WorkoutPlanSummary;
  busy: boolean;
}

type Item = { label: string; icon: ComponentType<{ size?: number }>; run: () => void; danger?: boolean };

/** One plan in the list grid: identity, assignment, schedule, progress and a management menu. */
export function PlanCard({ plan, busy, ...a }: PlanCardProps) {
  const items: Item[] = [
    { label: "Chỉnh sửa", icon: Pencil, run: () => a.onEdit(plan) },
    { label: "Nhân bản", icon: Copy, run: () => a.onDuplicate(plan) },
    { label: plan.studentId ? "Đổi học viên" : "Gán học viên", icon: UserPlus, run: () => a.onAssign(plan) },
    ...(plan.status === "ACTIVE" ? [{ label: "Tạm dừng", icon: Pause, run: () => a.onPause(plan) }] : []),
    ...(plan.status === "PAUSED" || plan.status === "ARCHIVED" ? [{ label: "Kích hoạt lại", icon: Play, run: () => a.onActivate(plan) }] : []),
    ...(plan.status === "DRAFT" ? [{ label: "Kích hoạt", icon: Play, run: () => a.onActivate(plan) }] : []),
    ...(plan.status !== "ARCHIVED" ? [{ label: "Lưu trữ", icon: Archive, run: () => a.onArchive(plan), danger: true }] : []),
  ];
  const week = Math.min(plan.currentWeek, plan.durationWeeks);

  return (
    <article className={cn("panel-3d panel-3d-interactive relative flex flex-col gap-4 p-5", plan.status === "ARCHIVED" && "opacity-80")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/coach/plans/${plan.id}`}
            className="line-clamp-2 rounded-md text-[15px] font-extrabold leading-snug text-text-primary transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-accent"
          >
            {plan.name}
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge status={PLAN_STATUS[plan.status]} />
            <StatusBadge tone="accent">{GOAL_LABEL[plan.goal]}</StatusBadge>
            <StatusBadge tone="neutral">{LEVEL_LABEL[plan.level]}</StatusBadge>
          </div>
        </div>
        <Popover
          width="w-56"
          trigger={({ toggle, open: _open, ...aria }) => (
            <Button3D size="icon-sm" variant="ghost" onClick={toggle} aria-label={`Tuỳ chọn cho ${plan.name}`} disabled={busy} {...aria}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={16} />}
            </Button3D>
          )}
        >
          {(close) => (
            <div className="flex flex-col">
              {items.map(({ label, icon: Icon, run, danger }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    run();
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-none",
                    danger ? "text-rose-600 dark:text-rose-400" : "text-text-primary"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </Popover>
      </div>

      <div className="flex items-center gap-2.5">
        {plan.studentName ? (
          <>
            <StudentAvatar name={plan.studentName} src={plan.studentAvatar} size="xs" />
            <span className="truncate text-sm font-bold text-text-primary">{plan.studentName}</span>
          </>
        ) : (
          <>
            <span className="well-3d grid h-7 w-7 shrink-0 place-items-center rounded-full text-text-secondary">
              <UserRound size={13} aria-hidden />
            </span>
            <span className="text-sm font-semibold text-text-secondary">Chưa gán học viên</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
        <CalendarDays size={13} aria-hidden />
        <span className="tabular-nums">
          {plan.durationWeeks} tuần × {plan.frequencyPerWeek} buổi/tuần
        </span>
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-secondary">{plan.status === "DRAFT" ? "Chưa bắt đầu" : `Tuần ${week}/${plan.durationWeeks}`}</span>
          <span className="font-extrabold tabular-nums text-text-primary">{plan.progressPercent}%</span>
        </div>
        <ScoreBar value={plan.progressPercent} showValue={false} tone={plan.status === "ACTIVE" ? "accent" : "neutral"} />
        <p className="text-[11px] text-text-secondary">Cập nhật {formatRelative(plan.updatedAt)}</p>
      </div>
    </article>
  );
}
