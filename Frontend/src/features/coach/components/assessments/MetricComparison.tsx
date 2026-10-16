import { cn } from "../../../../lib/utils";
import { FITNESS_METRIC_LABEL } from "../../constants/labels";
import { formatDate } from "../../lib/format";
import type { AssessmentDetail, AssessmentMetricComparison } from "../../types";
import { Delta, Panel, ScoreBar, ScoreRing } from "../ui";
import { metricDelta } from "./assessmentUtils";

const ORDER: AssessmentMetricComparison["key"][] = ["strength", "endurance", "mobility", "core", "balance", "overall"];

/** Overall score hero: current ring, previous ring and the change between them. */
export function OverallHero({ assessment }: { assessment: AssessmentDetail }) {
  const overall = assessment.metrics.find((m) => m.key === "overall");
  const delta = overall ? metricDelta(overall) : null;
  return (
    <Panel className="animate-rise" bodyClassName="p-6 sm:p-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <ScoreRing value={overall?.current ?? null} size={112} stroke={10} label="Hiện tại" />
          <div className="flex flex-col items-center gap-1">
            <ScoreRing value={overall?.previous ?? null} size={72} stroke={6} tone="neutral" label="Trước đó" />
          </div>
        </div>
        <div className="min-w-0 flex-1 sm:border-l sm:border-border sm:pl-6">
          <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Điểm thể lực tổng thể</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-black tabular-nums tracking-tight text-text-primary">
              {overall?.previous ?? "-"} <span className="text-text-secondary/60">→</span> {overall?.current ?? "-"}
            </span>
            {delta !== null && <Delta value={delta} className="text-sm" />}
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            {assessment.previousAssessmentDate
              ? `So với lần đánh giá ngày ${formatDate(assessment.previousAssessmentDate)}`
              : "Bài đánh giá đầu tiên, chưa có dữ liệu so sánh."}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function MetricCard({ m, index }: { m: AssessmentMetricComparison; index: number }) {
  const delta = metricDelta(m);
  const isOverall = m.key === "overall";
  return (
    <li
      className={cn("panel-3d animate-rise p-4", isOverall && "ring-1 ring-accent/25")}
      style={{ animationDelay: `${80 + index * 40}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-text-secondary">{FITNESS_METRIC_LABEL[m.key]}</h3>
        {delta !== null ? <Delta value={delta} /> : <span className="text-[11px] font-semibold text-text-secondary">Lần đầu</span>}
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-text-primary" aria-label={`${FITNESS_METRIC_LABEL[m.key]}: trước ${m.previous ?? "chưa có"}, hiện tại ${m.current ?? "chưa có"}`}>
        {m.previous !== null && (
          <>
            <span className="text-text-secondary">{m.previous}</span>
            <span className="mx-1.5 text-base text-text-secondary/60" aria-hidden>→</span>
          </>
        )}
        {m.current ?? "-"}
      </p>
      {m.current !== null && <ScoreBar value={m.current} showValue={false} label={undefined} className="mt-3" />}
    </li>
  );
}

/** Six metric cards: Strength, Endurance, Mobility, Core, Balance, Overall. */
export function MetricCards({ metrics }: { metrics: AssessmentMetricComparison[] }) {
  const sorted = ORDER.map((k) => metrics.find((m) => m.key === k)).filter((m): m is AssessmentMetricComparison => !!m);
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" aria-label="So sánh 6 chỉ số thể lực">
      {sorted.map((m, i) => (
        <MetricCard key={m.key} m={m} index={i} />
      ))}
    </ul>
  );
}
