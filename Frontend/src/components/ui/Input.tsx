import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-sm border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-secondary/60",
        "transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

/** Input with a leading icon slot - used on premium/marketing-adjacent forms
 * (auth) where the extra visual weight earns its place. The plain Input
 * above stays icon-less for dense app forms (onboarding, profile). */
export const IconInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode }
>(({ className, icon, ...props }, ref) => (
  <div className="relative">
    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary/70">
      {icon}
    </span>
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-md border border-border bg-surface pl-11 pr-4 text-sm text-text-primary placeholder:text-text-secondary/50",
        "transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15",
        className
      )}
      {...props}
    />
  </div>
));
IconInput.displayName = "IconInput";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-text-primary", className)} {...props} />;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-danger">{children}</p>;
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-text-secondary">{children}</p>;
}
