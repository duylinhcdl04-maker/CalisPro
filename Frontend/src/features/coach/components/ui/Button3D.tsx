import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../../../lib/utils";

const button3d = cva("btn-3d", {
  variants: {
    variant: {
      primary: "btn-3d-primary",
      secondary: "btn-3d-secondary",
      danger: "btn-3d-danger",
      success: "btn-3d-success",
      ghost: "btn-3d-ghost",
    },
    size: {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-sm",
      icon: "h-10 w-10 p-0",
      "icon-sm": "h-8 w-8 p-0 rounded-[12px]",
    },
  },
  defaultVariants: { variant: "secondary", size: "md" },
});

export interface Button3DProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button3d> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
}

/**
 * Raised, tactile button: a solid edge under the face that compresses on press.
 * Icon-only buttons must pass `aria-label` (and should be wrapped in <Tooltip>).
 */
export const Button3D = forwardRef<HTMLButtonElement, Button3DProps>(
  ({ className, variant, size, asChild, loading, leftIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const content = asChild ? (
      children
    ) : (
      <>
        {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : leftIcon}
        {children}
      </>
    );
    return (
      <Comp
        ref={ref}
        className={cn(button3d({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...(asChild ? {} : { type: props.type ?? "button" })}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button3D.displayName = "Button3D";
