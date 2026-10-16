import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { scoreTone, formatSigned } from "../../lib/format";
import { TONE_TEXT } from "./StatusBadge";
import type { Tone } from "../../constants/labels";

const RING_COLOR: Record<Tone, string> = {
  success: "stroke-emerald-500",
  warning: "stroke-amber-500",
  critical: "stroke-rose-500",
  info: "stroke-blue-500",
  accent: "stroke-accent",
  neutral: "stroke-text-secondary",
};

const BAR_COLOR: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
  info: "bg-blue-500",
  accent: "bg-accent",
  neutral: "bg-text-secondary/60",
};

interface ScoreRingProps {
  value: number | null;
  size?: number;
  stroke?: number;
  label?: string;
  /** Force a tone instead of the score-derived one. */
  tone?: Tone;
  className?: string;
}

/** Circular 0-100 score gauge sitting in a recessed well. */
export function ScoreRing({ value, size = 88, stroke = 8, label, tone, className }: ScoreRingProps) {
  const t = tone ?? scoreTone(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Điểm"}: ${value ?? "chưa có"} trên 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-surface-sunken" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={cn("fill-none transition-[stroke-dashoffset] duration-700 ease-out", RING_COLOR[t])}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cn("font-black tabular-nums leading-none tracking-tight text-text-primary", size >= 100 ? "text-3xl" : size >= 72 ? "text-2xl" : "text-base")}>
            {value ?? "-"}
          </div>
          {label && size >= 72 && <div className="mt-1 text-[10px] font-semibold text-text-secondary">{label}</div>}
        </div>
      </div>
    </div>
  );
}

interface ScoreBarProps {
  value: number;
  max?: number;
  tone?: Tone;
  label?: string;
  showValue?: boolean;
  className?: string;
}

/** Horizontal meter in a recessed track. */
export function ScoreBar({ value, max = 100, tone, label, showValue = true, className }: ScoreBarProps) {
  const t = tone ?? scoreTone((value / max) * 100);
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          {label && <span className="font-semibold text-text-secondary">{label}</span>}
          {showValue && <span className="font-extrabold tabular-nums text-text-primary">{value}</span>}
        </div>
      )}
      <div className="well-3d h-2.5 overflow-hidden rounded-full" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", BAR_COLOR[t])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface DeltaProps {
  value: number;
  suffix?: string;
  /** When true, a negative number is good (e.g. invalid-rep rate). */
  invert?: boolean;
  digits?: number;
  className?: string;
}

/** Signed change with arrow icon; color derived from direction. */
export function Delta({ value, suffix = "", invert, digits = 0, className }: DeltaProps) {
  const good = invert ? value < 0 : value > 0;
  const tone: Tone = value === 0 ? "neutral" : good ? "success" : "critical";
  const Icon = value === 0 ? Minus : value > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold tabular-nums", TONE_TEXT[tone], className)}>
      <Icon size={13} aria-hidden />
      {formatSigned(value, digits)}
      {suffix}
    </span>
  );
}
