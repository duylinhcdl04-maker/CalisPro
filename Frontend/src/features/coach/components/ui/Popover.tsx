import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../../../lib/utils";

interface PopoverProps {
  /** Render prop for the trigger so it can receive aria props + toggle. */
  trigger: (props: { open: boolean; toggle: () => void; "aria-expanded": boolean; "aria-haspopup": "menu" | "dialog" }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: string;
  kind?: "menu" | "dialog";
}

/** Lightweight dropdown: closes on outside click and Escape, returns focus to the trigger. */
export function Popover({ trigger, children, align = "right", width = "w-72", kind = "menu" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        (ref.current?.querySelector("[aria-expanded]") as HTMLElement | null)?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": kind })}
      {open && (
        <div role={kind} className={cn("panel-3d absolute top-full z-50 mt-2 animate-rise overflow-hidden p-2", align === "right" ? "right-0" : "left-0", width)}>
          {children(close)}
        </div>
      )}
    </div>
  );
}
