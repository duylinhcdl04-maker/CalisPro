import { levelName } from "../../../level/levelLabels";
import { cn } from "../../../../lib/utils";
import type { RuleLevel } from "../../types";
import type { RuleSetEdits } from "./ruleSetEdits";

/** Thang điểm tổng quan của các level: mốc điểm để lên và ngưỡng xét tụt, phản ánh cả giá trị đang gõ chưa lưu. */
export function LevelLadder({ levels, edits }: { levels: RuleLevel[]; edits: RuleSetEdits }) {
  const sorted = [...levels].sort((a, b) => a.rank - b.rank);
  const value = (l: RuleLevel, f: "promoteMin" | "regressBelow") => {
    const raw = edits.levels[l.code]?.[f];
    const n = raw !== undefined ? Number(raw) : l[f];
    return Number.isFinite(n) ? n : l[f];
  };
  return (
    <div className="mb-5 rounded-2xl border border-border/70 bg-surface-sunken/40 p-4">
      <p className="mb-3 text-xs font-bold text-text-secondary">
        Học viên lên level khi điểm tổng đạt mốc "Lên từ", và chỉ bị xét tụt khi điểm trung bình trượt xuống dưới mốc "Tụt dưới".
      </p>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {sorted.map((l) => {
          const changed = edits.levels[l.code] !== undefined;
          return (
            <li key={l.code} className={cn("rounded-xl border bg-surface px-3 py-2.5", changed ? "border-accent/50" : "border-border/70")}>
              <p className="text-sm font-black text-text-primary">{l.code}</p>
              <p className="mb-1.5 truncate text-[11px] font-semibold text-text-secondary">{levelName(l.code) || l.name}</p>
              {l.rank === 0 ? (
                <p className="text-[11px] text-text-secondary">Điểm xuất phát, không có mốc lên hay tụt.</p>
              ) : (
                <dl className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between gap-2"><dt className="text-text-secondary">Lên từ</dt><dd className="font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{value(l, "promoteMin")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-text-secondary">Tụt dưới</dt><dd className="font-extrabold tabular-nums text-rose-600 dark:text-rose-400">{value(l, "regressBelow")}</dd></div>
                </dl>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
