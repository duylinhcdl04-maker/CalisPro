import { cn } from "../../../../lib/utils";
import { TONE_BG_SOLID } from "../ui";
import { scoreTone } from "../../lib/format";

interface MiniMeterProps {
  /** 0-100 */
  value: number;
  label: string;
  className?: string;
}

/**
 * Compact percentage meter: recessed track + value. Unlike ScoreBar, the label is
 * only announced to assistive tech, so it fits in table cells.
 */
export function MiniMeter({ value, label, className }: MiniMeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="well-3d h-2 min-w-[56px] flex-1 overflow-hidden rounded-full" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", TONE_BG_SOLID[scoreTone(value)])} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-text-primary">{value}%</span>
    </div>
  );
}
