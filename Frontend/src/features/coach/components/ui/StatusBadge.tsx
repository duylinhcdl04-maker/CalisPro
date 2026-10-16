import type { ReactNode } from "react";
import { cn } from "../../../../lib/utils";
import type { LabelTone, Tone } from "../../constants/labels";

export const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
  warning: "bg-amber-500/14 text-amber-700 border-amber-500/30 dark:text-amber-300",
  critical: "bg-rose-500/12 text-rose-700 border-rose-500/25 dark:text-rose-300",
  info: "bg-blue-500/12 text-blue-700 border-blue-500/25 dark:text-blue-300",
  accent: "bg-accent-soft text-accent-strong border-accent/25 dark:text-accent",
  neutral: "bg-surface-sunken text-text-secondary border-border",
};

export const TONE_TEXT: Record<Tone, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-rose-600 dark:text-rose-400",
  info: "text-blue-600 dark:text-blue-400",
  accent: "text-accent-strong dark:text-accent",
  neutral: "text-text-secondary",
};

export const TONE_BG_SOLID: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
  info: "bg-blue-500",
  accent: "bg-accent",
  neutral: "bg-text-secondary/60",
};

interface StatusBadgeProps {
  tone?: Tone;
  children?: ReactNode;
  /** Shortcut: pass a {label, tone} entry from constants/labels. */
  status?: LabelTone;
  icon?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/** Semantic pill. Color never carries meaning alone: it always shows a text label. */
export function StatusBadge({ tone, children, status, icon, size = "sm", className }: StatusBadgeProps) {
  const t = status?.tone ?? tone ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border font-bold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        TONE_CLASSES[t],
        className
      )}
    >
      {icon}
      {status?.label ?? children}
    </span>
  );
}
