import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { TextInput } from "../ui";

interface SpecializationInputProps {
  id: string;
  describedBy: string | undefined;
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/** Chips input: type and press Enter or comma to add; Backspace on an empty field removes the last chip. */
export function SpecializationInput({ id, describedBy, value, onChange, disabled, invalid }: SpecializationInputProps) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, 40));
    onChange(next);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Enter") {
      e.preventDefault();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Chuyên môn đã thêm">
          {value.map((s) => (
            <li key={s} className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent-soft py-0.5 pl-2.5 pr-1 text-xs font-bold text-accent-strong dark:text-accent">
              {s}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== s))}
                disabled={disabled}
                aria-label={`Xoá ${s}`}
                className="grid h-5 w-5 place-items-center rounded-full hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <TextInput
        id={id}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        value={draft}
        disabled={disabled}
        placeholder="Ví dụ: Handstand, Mobility"
        onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
      />
    </div>
  );
}
