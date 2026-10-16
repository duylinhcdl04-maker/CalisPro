import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

/** Dark-glass form primitives scoped to the auth pages, so they can match
 * the violet marketing home without touching the shared Input/Button/Checkbox
 * used across the light-themed authenticated app. */

export const AuthInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; rightElement?: ReactNode }
>(({ className, icon, rightElement, ...props }, ref) => (
  <div className="relative">
    {icon && (
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/35">
        {icon}
      </span>
    )}
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-11 pr-4 text-sm text-white placeholder:text-white/25",
        "transition duration-200 focus:border-[#8b5cf6]/80 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/25",
        "aria-[invalid=true]:border-rose-400/60 aria-[invalid=true]:ring-rose-400/15",
        rightElement && "pr-11",
        !icon && "pl-4",
        className
      )}
      {...props}
    />
    {rightElement && (
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {rightElement}
      </div>
    )}
  </div>
));
AuthInput.displayName = "AuthInput";

export const AuthButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#d946ef] text-sm font-semibold text-white",
        "shadow-[0_10px_25px_-5px_rgba(168,85,247,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-5px_rgba(168,85,247,0.55)] active:scale-[0.98]",
        "disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
AuthButton.displayName = "AuthButton";

export function AuthCheckbox({ className, ...props }: CheckboxPrimitive.CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border border-white/20 bg-white/[0.04] transition",
        "data-[state=checked]:border-transparent data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#8b5cf6] data-[state=checked]:to-[#c026d3]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/30",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check size={13} className="text-white" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export function AuthLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-white/70", className)} {...props} />;
}

export function AuthFieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-rose-400">{children}</p>;
}
