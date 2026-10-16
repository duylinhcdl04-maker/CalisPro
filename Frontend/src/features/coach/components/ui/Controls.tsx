import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "../../../../lib/utils";

/* ------------------------------ Segmented tabs ------------------------------ */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

/** Sunken track with a raised active chip. Keyboard: arrow keys move between options. */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel, size = "md", className }: SegmentedProps<T>) {
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  }
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("well-3d inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl p-1 scrollbar-thin", className)}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            data-active={active}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "seg-3d-item inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl font-bold text-text-secondary transition-all hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent",
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[10px] tabular-nums", active ? "bg-accent text-white" : "bg-border/70 text-text-secondary")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Inputs ---------------------------------- */

const fieldBase =
  "well-3d w-full rounded-[14px] px-3.5 text-sm font-medium text-text-primary placeholder:text-text-secondary/70 transition focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-rose-500/15";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (v: string) => void;
  label: string;
}

export function SearchInput({ value, onChange, label, className, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
      <input type="search" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cn(fieldBase, "h-10 pl-10 pr-9")} {...props} />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Xoá tìm kiếm" className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-secondary hover:bg-border/60 hover:text-text-primary">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />
));
TextInput.displayName = "TextInput";

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "min-h-[96px] resize-y py-2.5 leading-relaxed", className)} {...props} />
));
TextArea.displayName = "TextArea";

export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className={cn("relative", className)}>
    <select ref={ref} className={cn(fieldBase, "h-10 cursor-pointer appearance-none pr-9")} {...props}>
      {children}
    </select>
    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
  </div>
));
SelectField.displayName = "SelectField";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
  className?: string;
}

/** Label above, control, then hint/error below. Wires aria-describedby automatically. */
export function Field({ label, error, hint, required, children, className }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-bold text-text-secondary">
        {label}
        {required && <span className="ml-0.5 text-rose-500" aria-hidden>*</span>}
      </label>
      {children(id, error || hint ? msgId : undefined)}
      {error ? (
        <p id={msgId} className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p id={msgId} className="text-[11px] text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------------- Toggle ---------------------------------- */

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50",
        checked ? "border-accent-deep bg-accent" : "well-3d"
      )}
    >
      <span className={cn("inline-block h-[18px] w-[18px] rounded-full bg-white shadow-[0_2px_0_0_hsl(214_30%_75%),0_2px_6px_rgba(0,0,0,0.2)] transition-transform", checked ? "translate-x-[22px]" : "translate-x-[3px]")} />
    </button>
  );
}

/* -------------------------------- Pagination -------------------------------- */

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "btn-3d btn-3d-secondary h-8 w-8 p-0 rounded-[12px]";
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-3 text-xs text-text-secondary">
      <span className="tabular-nums">
        {from}-{to} / {total}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Trang trước">
          <ChevronLeft size={15} />
        </button>
        <span className="min-w-[56px] text-center font-bold tabular-nums text-text-primary">
          {page} / {totalPages}
        </span>
        <button type="button" className={btn} onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Trang sau">
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
