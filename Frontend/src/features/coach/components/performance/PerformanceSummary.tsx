import { Activity, CalendarCheck, Flame, Gauge } from "lucide-react";
import { FITNESS_METRIC_LABEL } from "../../constants/labels";
import { formatSigned } from "../../lib/format";
import type { PerformanceMetric, PerformanceRange, PerformanceReport } from "../../types";
import { KpiCard } from "../ui";
import { RANGE_LABEL, adherenceSeverity, summarizeMetric } from "./performanceUtils";

interface PerformanceSummaryProps {
  report: PerformanceReport;
  metric: PerformanceMetric;
  range: PerformanceRange;
}

/** Four headline tiles: selected metric, adherence, streak, frequency. */
export function PerformanceSummary({ report, metric, range }: PerformanceSummaryProps) {
  const s = summarizeMetric(report.series, metric);
  const a = report.adherence;
  const cohort = report.studentId === "ALL";
  const direction = s.change === null || s.change === 0 ? "flat" : s.change > 0 ? "up" : "down";
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KpiCard
        label={FITNESS_METRIC_LABEL[metric]}
        value={s.current ?? "-"}
        description={cohort ? "Điểm trung bình nhóm" : "Điểm hiện tại"}
        icon={Gauge}
        status="info"
        trend={s.change !== null ? { direction, value: formatSigned(s.change), label: `trong ${RANGE_LABEL[range]}` } : null}
      />
      <KpiCard
        label="Tỷ lệ tuân thủ"
        value={`${a.adherencePercent}%`}
        description={`${a.sessionsCompleted}/${a.sessionsPlanned} buổi hoàn thành`}
        icon={CalendarCheck}
        status={adherenceSeverity(a.adherencePercent)}
        style={{ animationDelay: "40ms" }}
      />
      <KpiCard
        label="Chuỗi tập hiện tại"
        value={`${a.currentStreak}`}
        description={`ngày liên tiếp · dài nhất ${a.longestStreak} ngày`}
        icon={Flame}
        status="info"
        style={{ animationDelay: "80ms" }}
      />
      <KpiCard
        label="Tần suất tập"
        value={a.trainingFrequency.toLocaleString("vi-VN")}
        description="buổi mỗi tuần"
        icon={Activity}
        status="info"
        style={{ animationDelay: "120ms" }}
      />
    </div>
  );
}
