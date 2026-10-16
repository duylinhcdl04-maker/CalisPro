import { Flame, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { ScoreRing, StatusBadge, StudentAvatar, TONE_TEXT } from "../../ui";
import { MiniMeter } from "../../dashboard/MiniMeter";
import { GOAL_LABEL, LEVEL_LABEL, STUDENT_STATUS } from "../../../constants/labels";
import { formatRelative } from "../../../lib/format";
import type { Student, TrendDirection } from "../../../types";
import type { ColumnId } from "./columns";

const TREND: Record<TrendDirection, { icon: typeof TrendingUp; label: string; tone: "success" | "critical" | "neutral" }> = {
  up: { icon: TrendingUp, label: "Đang tiến bộ", tone: "success" },
  down: { icon: TrendingDown, label: "Đang giảm", tone: "critical" },
  flat: { icon: Minus, label: "Đi ngang", tone: "neutral" },
};

export function StudentIdentity({ student }: { student: Student }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <StudentAvatar name={student.name} src={student.avatarUrl} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-text-primary">{student.name}</p>
        <p className="truncate text-[11px] tabular-nums text-text-secondary">{student.code}</p>
      </div>
    </div>
  );
}

export function FitnessScoreCell({ student }: { student: Student }) {
  const trend = TREND[student.performanceTrend];
  const Icon = trend.icon;
  return (
    <div className="flex items-center gap-2">
      <ScoreRing value={student.fitnessScore} size={42} stroke={4} label="Fitness Score" />
      <span className={cn("inline-flex items-center", TONE_TEXT[trend.tone])} title={trend.label}>
        <Icon size={14} aria-hidden />
        <span className="sr-only">{trend.label}</span>
      </span>
    </div>
  );
}

export function StreakCell({ streak }: { streak: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-extrabold tabular-nums", streak > 0 ? "text-text-primary" : "text-text-secondary")}>
      <Flame size={14} className={streak > 0 ? "text-orange-500 dark:text-orange-400" : "text-text-secondary/60"} aria-hidden />
      {streak}
      <span className="text-[11px] font-semibold text-text-secondary">ngày</span>
    </span>
  );
}

export function AdherenceCell({ value }: { value: number }) {
  return <MiniMeter value={value} label={`Tuân thủ ${value}%`} className="min-w-[110px]" />;
}

/** Content for an optional column. */
export function StudentCell({ column, student }: { column: ColumnId; student: Student }) {
  switch (column) {
    case "level":
      return <span className="text-sm font-semibold text-text-primary">{LEVEL_LABEL[student.level]}</span>;
    case "goal":
      return <span className="text-sm text-text-secondary">{GOAL_LABEL[student.goal]}</span>;
    case "fitnessScore":
      return <FitnessScoreCell student={student} />;
    case "streak":
      return <StreakCell streak={student.streak} />;
    case "adherence":
      return <AdherenceCell value={student.adherence} />;
    case "lastWorkoutAt":
      return student.lastWorkoutAt ? (
        <time dateTime={student.lastWorkoutAt} className="whitespace-nowrap text-sm text-text-secondary">
          {formatRelative(student.lastWorkoutAt)}
        </time>
      ) : (
        <span className="text-sm text-text-secondary">Chưa có</span>
      );
    case "status":
      return <StatusBadge status={STUDENT_STATUS[student.status]} />;
  }
}
