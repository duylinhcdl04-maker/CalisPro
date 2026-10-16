import { Check, Columns3 } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Button3D, Popover } from "../../ui";
import { COLUMNS, type ColumnId } from "./columns";

interface ColumnMenuProps {
  isVisible: (id: ColumnId) => boolean;
  onToggle: (id: ColumnId) => void;
  onReset: () => void;
}

export function ColumnMenu({ isVisible, onToggle, onReset }: ColumnMenuProps) {
  return (
    <div className="hidden md:block">
      <Popover
        kind="dialog"
        width="w-60"
        trigger={({ toggle, open: _open, ...aria }) => (
          <Button3D variant="secondary" leftIcon={<Columns3 size={16} aria-hidden />} onClick={toggle} {...aria}>
            Cột hiển thị
          </Button3D>
        )}
      >
        {() => (
          <fieldset>
            <legend className="px-2 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-text-secondary">Hiển thị cột</legend>
            <ul>
              {COLUMNS.map((c) => {
                const checked = isVisible(c.id);
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-sm font-semibold text-text-primary hover:bg-accent-soft/50 focus-within:bg-accent-soft/50">
                      <input type="checkbox" checked={checked} onChange={() => onToggle(c.id)} className="peer sr-only" />
                      <span
                        className={cn(
                          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent",
                          checked ? "border-accent-deep bg-accent text-white" : "well-3d"
                        )}
                        aria-hidden
                      >
                        {checked && <Check size={12} strokeWidth={3} />}
                      </span>
                      {c.label}
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="mt-1.5 border-t border-border/70 pt-1.5">
              <button type="button" onClick={onReset} className="w-full rounded-[12px] px-2 py-1.5 text-left text-xs font-bold text-accent-strong hover:bg-accent-soft/50 focus-visible:outline-2 focus-visible:outline-accent dark:text-accent">
                Hiện tất cả cột
              </button>
            </div>
          </fieldset>
        )}
      </Popover>
    </div>
  );
}
