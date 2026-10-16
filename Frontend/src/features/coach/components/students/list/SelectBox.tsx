import { useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "../../../../../lib/utils";

interface SelectBoxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}

/** Native checkbox (keyboard + screen reader) with a tactile visual. */
export function SelectBox({ checked, indeterminate = false, onChange, label }: SelectBoxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const on = checked || indeterminate;
  return (
    <label className="relative inline-grid h-5 w-5 cursor-pointer place-items-center">
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="peer absolute inset-0 cursor-pointer opacity-0" />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none grid h-[18px] w-[18px] place-items-center rounded-[6px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-surface",
          on ? "border-accent-deep bg-accent text-white" : "well-3d"
        )}
      >
        {checked ? <Check size={12} strokeWidth={3} /> : indeterminate ? <Minus size={12} strokeWidth={3} /> : null}
      </span>
    </label>
  );
}
