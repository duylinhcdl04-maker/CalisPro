import type { ComponentType } from "react";
import { AlertTriangle, CalendarCheck, CheckCircle2, Clock, Dumbbell, Layers } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Panel } from "../../ui";
import type { PlanWeek } from "../../../types";
import { weekStats } from "./planModel";

interface PlanSummaryProps {
  weeks: PlanWeek[];
  weekIndex: number;
  frequencyTarget: number;
}

function Metric({ icon: Icon, label, value, tone }: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: string; tone?: "warning" }) {
  return (
    <div className="well-3d flex items-center gap-3 rounded-2xl px-3 py-2.5">
      <span className={cn("icon-tile-3d h-8 w-8 shrink-0", tone === "warning" ? "bg-amber-500/14 text-amber-700 dark:text-amber-300" : "bg-accent-soft text-accent-strong dark:text-accent")}>
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-text-secondary">{label}</p>
        <p className="text-sm font-black tabular-nums text-text-primary">{value}</p>
      </div>
    </div>
  );
}

/** Live numbers for the selected week plus a plan-wide frequency check. */
export function PlanSummary({ weeks, weekIndex, frequencyTarget }: PlanSummaryProps) {
  const stats = weekStats(weeks[weekIndex]);
  const target = Number.isFinite(frequencyTarget) ? frequencyTarget : 0;
  const mismatch = target > 0 && stats.trainingDays !== target;
  const offWeeks = target > 0 ? weeks.filter((w) => weekStats(w).trainingDays !== target).length : 0;
  const totalSessions = weeks.reduce((n, w) => n + weekStats(w).trainingDays, 0);

  return (
    <Panel title={`Tổng quan tuần ${weekIndex + 1}`} description={`${weeks.length} tuần, ${totalSessions} buổi tập toàn giáo án`} icon={Layers}>
      <div className="grid grid-cols-2 gap-2.5">
        <Metric icon={CalendarCheck} label="Ngày tập / mục tiêu" value={`${stats.trainingDays} / ${target || "-"}`} tone={mismatch ? "warning" : undefined} />
        <Metric icon={Dumbbell} label="Tổng bài tập" value={String(stats.exercises)} />
        <Metric icon={Clock} label="Phút / tuần (ước tính)" value={String(stats.minutes)} />
        <Metric icon={Layers} label="Ngày nghỉ" value={String(7 - stats.trainingDays)} />
      </div>
      <div
        role="status"
        className={cn(
          "mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold",
          mismatch || offWeeks > 0
            ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
            : "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
        )}
      >
        {mismatch || offWeeks > 0 ? <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden /> : <CheckCircle2 size={14} className="mt-px shrink-0" aria-hidden />}
        <span>
          {mismatch
            ? `Tuần này có ${stats.trainingDays} buổi, mục tiêu là ${target} buổi/tuần.`
            : offWeeks > 0
              ? `Tuần này đạt mục tiêu. Còn ${offWeeks} tuần khác chưa khớp ${target} buổi/tuần.`
              : "Mọi tuần đều khớp tần suất mục tiêu."}
        </span>
      </div>
    </Panel>
  );
}
