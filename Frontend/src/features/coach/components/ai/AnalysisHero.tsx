import { CheckCircle2, Repeat, XCircle } from "lucide-react";
import type { AIAnalysis } from "../../types";
import { Delta, Panel, ScoreBar, ScoreRing } from "../ui";
import { StatTile, rise } from "../sessions/shared";

/** AI score ring plus rep totals. */
export function AnalysisHero({ analysis }: { analysis: AIAnalysis }) {
  const delta = analysis.previousFormScore === null ? null : analysis.formScore - analysis.previousFormScore;
  return (
    <Panel className="animate-rise">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <ScoreRing value={analysis.formScore} size={124} stroke={10} label="AI Score" />
          <div>
            <div className="text-xs font-bold text-text-secondary">AI Score</div>
            <div className="mt-1 text-3xl font-black tabular-nums leading-none text-text-primary">
              {analysis.formScore}
              <span className="text-base font-bold text-text-secondary"> / 100</span>
            </div>
            {delta !== null ? (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                <Delta value={delta} suffix=" điểm" />
                <span>so với lần trước ({analysis.previousFormScore})</span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-text-secondary">Lần phân tích đầu tiên cho bài này</div>
            )}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-3">
          <StatTile icon={Repeat} label="Tổng reps" value={analysis.totalReps} style={rise(1)} />
          <StatTile icon={CheckCircle2} label="Valid" value={<span className="text-emerald-600 dark:text-emerald-400">{analysis.validReps}</span>} style={rise(2)} />
          <StatTile icon={XCircle} label="Invalid" value={<span className={analysis.invalidReps ? "text-rose-600 dark:text-rose-400" : undefined}>{analysis.invalidReps}</span>} style={rise(3)} />
          <ScoreBar
            className="col-span-3"
            value={analysis.validReps}
            max={Math.max(1, analysis.totalReps)}
            showValue={false}
            label={`${Math.round((analysis.validReps / Math.max(1, analysis.totalReps)) * 100)}% rep đạt chuẩn`}
          />
        </div>
      </div>
    </Panel>
  );
}

/** Each scored form dimension with a plain-language explanation. */
export function FormBreakdownPanel({ metrics }: { metrics: AIAnalysis["metrics"] }) {
  return (
    <Panel title="Form Breakdown" description="Điểm từng khía cạnh kỹ thuật, thang 100">
      <ul className="space-y-5">
        {metrics.map((m, i) => (
          <li key={m.key} className="animate-rise" style={rise(i)}>
            <ScoreBar value={m.score} label={m.label} />
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{m.description}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
