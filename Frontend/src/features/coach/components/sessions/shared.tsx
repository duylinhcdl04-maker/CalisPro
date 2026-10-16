import type { ComponentType, ReactNode } from "react";
import { cn } from "../../../../lib/utils";
import { scoreTone } from "../../lib/format";
import { StatusBadge } from "../ui";

/** True when a query failed because the resource does not exist (mock or REST). */
export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: unknown; response?: { status?: unknown } };
  return e.status === 404 || e.response?.status === 404;
}

/** 0-100 form score pill; "-" when the session has no AI score. */
export function FormScoreBadge({ score, size = "sm" }: { score: number | null; size?: "sm" | "md" }) {
  if (score === null) return <span className="text-sm font-bold text-text-secondary" aria-label="Chưa có Form Score">-</span>;
  return (
    <StatusBadge tone={scoreTone(score)} size={size} className="tabular-nums">
      {score}
    </StatusBadge>
  );
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ size?: number; className?: string }>;
  className?: string;
  style?: React.CSSProperties;
}

/** Compact recessed stat tile used in summaries (large tabular number + label). */
export function StatTile({ label, value, hint, icon: Icon, className, style }: StatTileProps) {
  return (
    <div className={cn("well-3d flex min-w-0 flex-col justify-between gap-2 rounded-2xl p-4 animate-rise", className)} style={style}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
        {Icon && <Icon size={14} className="shrink-0" aria-hidden />}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-2xl font-black tabular-nums leading-none tracking-tight text-text-primary">{value}</div>
      {hint && <div className="text-[11px] text-text-secondary">{hint}</div>}
    </div>
  );
}

/** Stagger helper for animate-rise children. */
export const rise = (index: number, step = 45): React.CSSProperties => ({ animationDelay: `${index * step}ms` });
