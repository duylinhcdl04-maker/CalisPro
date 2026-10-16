import { Activity, AlertOctagon, ScanLine, Target, UserCheck } from "lucide-react";
import type { AIOverview, Severity } from "../../types";
import { formatDate, formatSigned, scoreTone } from "../../lib/format";
import type { Tone } from "../../constants/labels";
import { ProgressLineChart } from "../charts/ProgressLineChart";
import { EmptyState, KpiCard, Panel } from "../ui";
import { rise } from "../sessions/shared";

const toSeverity = (t: Tone): Severity => (t === "success" || t === "warning" || t === "critical" ? t : "info");

type Trend = NonNullable<React.ComponentProps<typeof KpiCard>["trend"]>;

function trend(change: number, suffix: string, label: string, invert = false, digits = 0): Trend {
  return {
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    value: `${formatSigned(change, digits)}${suffix}`,
    label,
    invert,
  };
}

/** Four headline KPIs. Invalid-rep rate is "lower is better". */
export function AIKpiRow({ overview }: { overview: AIOverview }) {
  const reviewStatus: Severity = overview.studentsNeedingReview > 0 ? "warning" : "success";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={ScanLine}
        label="Buổi tập đã phân tích"
        description="Trong 14 ngày gần nhất"
        value={overview.analyzedSessions}
        status="info"
        trend={trend(overview.analyzedSessionsChange, "%", "so với 14 ngày trước")}
        style={rise(0)}
      />
      <KpiCard
        icon={Target}
        label="Form Score trung bình"
        description="Điểm kỹ thuật trên thang 100"
        value={overview.avgFormScore}
        status={toSeverity(scoreTone(overview.avgFormScore))}
        trend={trend(overview.avgFormScoreChange, " điểm", "so với kỳ trước", false, 1)}
        style={rise(1)}
      />
      <KpiCard
        icon={AlertOctagon}
        label="Tỉ lệ rep chưa đạt"
        description="Càng thấp càng tốt"
        value={`${overview.invalidRepRate}%`}
        status="warning"
        trend={trend(overview.invalidRepRateChange, "%", "so với kỳ trước", true, 1)}
        style={rise(2)}
      />
      <KpiCard
        icon={UserCheck}
        label="Học viên cần review"
        description="Có phân tích đang chờ Coach xem"
        value={overview.studentsNeedingReview}
        status={reviewStatus}
        href="/coach/ai-analysis?review=pending"
        style={rise(3)}
      />
    </div>
  );
}

export function FormScoreTrendPanel({ history }: { history: AIOverview["formScoreHistory"] }) {
  const data = history.map((p) => ({ label: formatDate(p.date, "dd/MM"), score: p.score }));
  return (
    <Panel title="Xu hướng Form Score" description="Điểm trung bình theo ngày, 14 ngày gần nhất" icon={Activity} className="animate-rise">
      {data.length ? (
        <ProgressLineChart data={data} series={[{ key: "score", label: "Form Score" }]} area yDomain={[0, 100]} height={240} />
      ) : (
        <EmptyState className="py-8" title="Chưa đủ dữ liệu để vẽ xu hướng." />
      )}
    </Panel>
  );
}

/** Horizontal bars, single hue: how often each form issue shows up. */
export function CommonErrorsPanel({ errors }: { errors: AIOverview["commonErrors"] }) {
  const max = Math.max(1, ...errors.map((e) => e.percent));
  return (
    <Panel title="Lỗi kỹ thuật thường gặp" description="Tỉ lệ buổi tập có xuất hiện lỗi" icon={AlertOctagon} className="animate-rise">
      {errors.length ? (
        <ul className="space-y-4">
          {errors.map((e) => (
            <li key={e.code}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-bold text-text-primary">{e.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-text-secondary">
                  <span className="font-extrabold text-text-primary">{e.percent}%</span> · {e.count} buổi
                </span>
              </div>
              <div className="well-3d h-2.5 overflow-hidden rounded-full" role="img" aria-label={`${e.label}: ${e.percent}% buổi tập, ${e.count} lần`}>
                <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(e.percent / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="py-8" title="Không phát hiện lỗi lặp lại." description="Form của học viên đang ổn định." />
      )}
    </Panel>
  );
}
