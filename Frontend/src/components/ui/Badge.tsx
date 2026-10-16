import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "bg-accent-soft text-text-secondary",
        accent: "bg-accent-soft text-accent-strong",
        success: "bg-accent-soft text-accent-strong",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
        dark: "bg-text-primary text-white",
        outline: "border border-border bg-surface text-text-secondary",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
