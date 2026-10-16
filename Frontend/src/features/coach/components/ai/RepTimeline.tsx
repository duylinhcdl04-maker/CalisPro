import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { RepResult } from "../../types";
import { Panel } from "../ui";

const INVALID_PATTERN = "repeating-linear-gradient(135deg, rgba(255,255,255,0.45) 0 2px, transparent 2px 5px)";

/**
 * One thin bar per rep (height = rep score). Invalid reps are red AND striped, and the readout
 * spells out "Chưa đạt", so validity never relies on color alone. Hover, focus or arrow keys
 * show the rep's details in the readout line below.
 */
export function RepTimeline({ reps }: { reps: RepResult[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = reps[active];
  const invalidReps = reps.filter((r) => !r.valid).map((r) => r.rep);

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: reps.length - 1 };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const clamped = Math.max(0, Math.min(reps.length - 1, next));
    setActive(clamped);
    refs.current[clamped]?.focus();
  }

  if (!reps.length) return null;

  return (
    <Panel title="Rep timeline" description="Điểm từng rep theo thứ tự thực hiện">
      <div role="group" aria-label={`Biểu đồ ${reps.length} rep. Dùng phím mũi tên để xem từng rep.`} className="well-3d flex h-28 items-end gap-[3px] rounded-2xl px-3 pb-3 pt-4">
        {reps.map((r, i) => (
          <button
            key={r.rep}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            tabIndex={i === active ? 0 : -1}
            aria-label={`Rep ${r.rep}: ${r.valid ? "đạt" : "chưa đạt"}, ${r.score} điểm, tempo ${r.tempoSeconds} giây`}
            aria-pressed={i === active}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="group relative flex h-full min-w-[3px] flex-1 flex-col items-center justify-end focus-visible:outline-none"
          >
            <span
              className={cn(
                "w-full max-w-[14px] rounded-t-[4px] transition-opacity",
                r.valid ? "bg-emerald-500" : "bg-rose-500",
                i === active ? "opacity-100 ring-2 ring-accent ring-offset-1 ring-offset-surface-sunken" : "opacity-80 group-hover:opacity-100"
              )}
              style={{ height: `${Math.max(8, r.score)}%`, backgroundImage: r.valid ? undefined : INVALID_PATTERN }}
            />
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-primary" aria-live="polite">
          {current && (
            <>
              <span className="font-extrabold tabular-nums">Rep {current.rep}</span>
              <span className={cn("mx-2 inline-flex items-center gap-0.5 text-xs font-bold", current.valid ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {current.valid ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}
                {current.valid ? "Đạt" : "Chưa đạt"}
              </span>
              <span className="text-xs tabular-nums text-text-secondary">
                {current.score} điểm · tempo {current.tempoSeconds}s
              </span>
            </>
          )}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-text-secondary" aria-hidden>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-2 rounded-sm bg-emerald-500" /> Đạt</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-2 rounded-sm bg-rose-500" style={{ backgroundImage: INVALID_PATTERN }} /> Chưa đạt</span>
        </div>
      </div>
      {invalidReps.length > 0 && (
        <p className="mt-2 text-xs text-text-secondary">
          Rep chưa đạt: <span className="font-bold tabular-nums text-text-primary">{invalidReps.join(", ")}</span>
        </p>
      )}
    </Panel>
  );
}
