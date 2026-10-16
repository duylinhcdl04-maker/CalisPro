import { Eye, ShieldAlert } from "lucide-react";
import type { AIAnalysis } from "../../types";
import { MOTION_SEVERITY } from "../../constants/labels";
import { Panel, StatusBadge } from "../ui";
import { rise } from "../sessions/shared";

/** What the AI saw: observations, detected errors and the likely underlying issue. */
export function ObservationPanel({ analysis }: { analysis: AIAnalysis }) {
  return (
    <Panel title="AI Observation" description="Những gì hệ thống AI Motion ghi nhận trong video" icon={Eye}>
      <ul className="space-y-2">
        {analysis.observations.map((o, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-text-primary">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-text-secondary/60" aria-hidden />
            {o}
          </li>
        ))}
      </ul>

      {analysis.errors.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-extrabold text-text-secondary">Lỗi kỹ thuật phát hiện</h3>
          <ul className="space-y-3">
            {analysis.errors.map((e, i) => (
              <li key={e.id} className="well-3d animate-rise rounded-2xl p-4" style={rise(i)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-text-primary">{e.label}</span>
                  <StatusBadge status={MOTION_SEVERITY[e.severity]} />
                  <span className="text-[11px] text-text-secondary">Vùng: {e.bodyPart}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{e.description}</p>
                {e.affectedReps.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-text-secondary">{e.affectedReps.length} rep:</span>
                    {e.affectedReps.map((r) => (
                      <span key={r} className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-text-primary">
                        #{r}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div>
          <div className="text-xs font-extrabold text-amber-700 dark:text-amber-300">Vấn đề tiềm ẩn</div>
          <p className="mt-1 text-sm leading-relaxed text-text-primary">{analysis.potentialIssue}</p>
        </div>
      </div>
    </Panel>
  );
}
