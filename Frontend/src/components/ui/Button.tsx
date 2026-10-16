import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
  {
    variants: {
      variant: {
        // Nền lấy màu chữ chính nên chữ phải lấy màu nền trang: cố định text-white sẽ thành trắng trên trắng ở giao diện tối
        primary: "bg-text-primary text-background hover:-translate-y-0.5 active:scale-[0.98]",
        secondary: "bg-surface text-text-primary border border-border hover:border-accent/40 active:scale-[0.98]",
        accent: "bg-accent text-white hover:-translate-y-0.5 active:scale-[0.98]",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-accent-soft",
        outline: "border border-border text-text-primary hover:border-accent/50",
        destructive: "bg-danger text-white hover:-translate-y-0.5 active:scale-[0.98]",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
);
Button.displayName = "Button";
