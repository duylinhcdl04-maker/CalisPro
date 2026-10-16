import { useState } from "react";
import { Camera, Check, Minus, Plus } from "lucide-react";
import type { SetResult, TodayExercise } from "./api";

/** Tự nhập kết quả một hiệp (không dùng camera). Kết quả tự khai, chỉ để theo dõi, không có điểm form. */
export function ManualSetPanel({ exercise, setNumber, totalSets, onDone, onUseAi }: {
  exercise: TodayExercise; setNumber: number; totalSets: number; onDone: (r: SetResult) => void; onUseAi?: () => void;
}) {
  const hold = exercise.holdSec != null && exercise.repMax == null;
  const initial = hold ? exercise.holdSec ?? 15 : exercise.repMax ?? exercise.repMin ?? 10;
  const [value, setValue] = useState(initial);
  const step = hold ? 5 : 1;
  const unit = hold ? "giây" : "lần";

  return (
    <div className="rounded-3xl border border-border bg-surface p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Hiệp {setNumber}/{totalSets} · Tự nhập</p>
      <p className="mt-1 text-sm text-text-secondary">Nhập số {unit} bạn đã {hold ? "giữ được" : "thực hiện đúng kỹ thuật"} trong hiệp này.</p>
      <div className="mt-5 flex items-center justify-center gap-5">
        <button type="button" aria-label={`Giảm ${step} ${unit}`} onClick={() => setValue((v) => Math.max(1, v - step))} className="grid h-12 w-12 place-items-center rounded-full border border-border bg-background text-text-primary transition hover:border-accent active:scale-95"><Minus size={18} /></button>
        <div className="text-center">
          <div className="text-6xl font-black tabular-nums text-text-primary">{value}</div>
          <div className="text-xs font-bold uppercase tracking-wide text-text-secondary">{unit}</div>
        </div>
        <button type="button" aria-label={`Tăng ${step} ${unit}`} onClick={() => setValue((v) => Math.min(hold ? 600 : 100, v + step))} className="grid h-12 w-12 place-items-center rounded-full border border-border bg-background text-text-primary transition hover:border-accent active:scale-95"><Plus size={18} /></button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {onUseAi ? <button type="button" onClick={onUseAi} className="inline-flex items-center gap-1.5 text-xs font-bold text-accent underline"><Camera size={14} aria-hidden />Dùng AI cho hiệp này</button> : <span />}
        <button type="button" onClick={() => onDone({ setNumber, reps: hold ? null : value, durationSeconds: hold ? value : null, restSeconds: exercise.restSec, source: "MANUAL", movementSessionId: null })}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-black text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"><Check size={16} aria-hidden />Hoàn thành hiệp {setNumber}</button>
      </div>
    </div>
  );
}
