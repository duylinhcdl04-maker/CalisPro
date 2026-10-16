import type { ReactNode } from "react";
import { cn } from "../../../../lib/utils";

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom" | "right" | "left";
  /** Hide the tooltip (e.g. when an expanded sidebar already shows the label). */
  disabled?: boolean;
  className?: string;
}

const SIDE: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  right: "left-full top-1/2 ml-3 -translate-y-1/2",
  left: "right-full top-1/2 mr-3 -translate-y-1/2",
};

/** CSS-only tooltip shown on hover and on keyboard focus. The trigger keeps its own aria-label. */
export function Tooltip({ label, children, side = "top", disabled, className }: TooltipProps) {
  if (disabled) return <>{children}</>;
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-text-primary px-2.5 py-1 text-[11px] font-bold text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          SIDE[side]
        )}
      >
        {label}
      </span>
    </span>
  );
}
