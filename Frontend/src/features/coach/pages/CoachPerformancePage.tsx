import { useState } from "react";
import { usePerformance } from "../hooks";
import type { PerformanceMetric, PerformanceRange } from "../types";
import { ErrorState, PageHeader, PageSkeleton, Panel } from "../components/ui";
import { cn } from "../../../lib/utils";
import { PerformanceFilters } from "../components/performance/PerformanceFilters";
import { PerformanceSummary } from "../components/performance/PerformanceSummary";
import { MetricTrendPanel } from "../components/performance/MetricTrendPanel";
import { PersonalRecordsPanel } from "../components/performance/PersonalRecordsPanel";
import { AdherencePanel } from "../components/performance/AdherencePanel";
import { errorStatus } from "../components/assessments/assessmentUtils";

export default function CoachPerformancePage() {
  const [studentId, setStudentId] = useState<string>("ALL");
  const [range, setRange] = useState<PerformanceRange>("12W");
  const [metric, setMetric] = useState<PerformanceMetric>("overall");
  const [compareAll, setCompareAll] = useState(false);

  const query = usePerformance({ studentId, range });
  const report = query.data;
  const cohort = studentId === "ALL";
  const refreshing = query.isFetching && !query.isLoading;

  return (
    <div>
      <PageHeader
        title="Tiến độ & hiệu suất"
        description="Theo dõi điểm thể lực, kỷ lục cá nhân và mức độ tuân thủ của từng học viên hoặc toàn bộ nhóm."
      />

      <PerformanceFilters
        studentId={studentId}
        range={range}
        metric={metric}
        fetching={refreshing}
        onStudentChange={setStudentId}
        onRangeChange={setRange}
        onMetricChange={(m) => {
          setMetric(m);
          setCompareAll(false);
        }}
      />

      {query.isLoading ? (
        <PageSkeleton kpis={4} />
      ) : query.isError && !report ? (
        <Panel>
          <ErrorState
            title={errorStatus(query.error) === 404 ? "Không tìm thấy học viên." : undefined}
            description={errorStatus(query.error) === 404 ? "Học viên có thể đã rời nhóm. Chọn học viên khác hoặc xem toàn bộ nhóm." : undefined}
            onRetry={() => query.refetch()}
            retrying={query.isFetching}
          />
        </Panel>
      ) : report ? (
        <div aria-busy={refreshing} className={cn("space-y-6 transition-opacity duration-200", refreshing && "opacity-70")}>
          <PerformanceSummary report={report} metric={metric} range={range} />
          <MetricTrendPanel series={report.series} metric={metric} range={range} compareAll={compareAll} onCompareAllChange={setCompareAll} cohort={cohort} />
          <div className="grid gap-6 xl:grid-cols-2">
            <PersonalRecordsPanel records={report.personalRecords} cohort={report.studentId === "ALL"} />
            <AdherencePanel adherence={report.adherence} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
