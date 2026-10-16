import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { usePerformance } from "../../../hooks";
import { FITNESS_METRIC_LABEL } from "../../../constants/labels";
import { formatDate } from "../../../lib/format";
import type { PerformanceRange } from "../../../types";
import { ProgressLineChart, type LineSeries } from "../../charts/ProgressLineChart";
import { EmptyState, ErrorState, Panel, Segmented, Skeleton } from "../../ui";
import { METRIC_KEYS, RANGE_OPTIONS, stagger } from "./detailConfig";
import { AdherencePanel, PersonalRecordsPanel } from "./ProgressStats";

type MetricKey = (typeof METRIC_KEYS)[number];
const SERIES: LineSeries<MetricKey>[] = METRIC_KEYS.map((k) => ({ key: k, label: FITNESS_METRIC_LABEL[k] }));

function ProgressSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải tiến độ">
      <div className="panel-3d space-y-4 p-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[280px] w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-[22px]" />
        <Skeleton className="h-64 w-full rounded-[22px]" />
      </div>
    </div>
  );
}

export function ProgressTab({ studentId }: { studentId: string }) {
  const [range, setRange] = useState<PerformanceRange>("12W");
  const { data, isLoading, isError, refetch, isRefetching, isPlaceholderData } = usePerformance({ studentId, range });

  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((p) => ({
        label: formatDate(p.date, "dd/MM"),
        strength: p.strength,
        endurance: p.endurance,
        mobility: p.mobility,
        core: p.core,
        balance: p.balance,
      })),
    [data?.series]
  );

  const rangePicker = <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} ariaLabel="Khoảng thời gian" size="sm" />;

  if (isLoading) return <ProgressSkeleton />;
  if (isError || !data) {
    return (
      <Panel>
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      </Panel>
    );
  }

  return (
    <div className={cn("space-y-6 transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData || undefined}>
      <Panel
        title="Chỉ số thể lực theo thời gian"
        description="5 chỉ số, thang điểm 0 đến 100"
        icon={TrendingUp}
        className="animate-rise"
        actions={<div className="hidden sm:block">{rangePicker}</div>}
      >
        <div className="mb-4 sm:hidden">{rangePicker}</div>
        {chartData.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Chưa có dữ liệu" description="Chưa có điểm thể lực trong khoảng thời gian này." />
        ) : (
          <div role="img" aria-label={`Biểu đồ đường 5 chỉ số thể lực, ${chartData.length} mốc dữ liệu`}>
            <ProgressLineChart data={chartData} series={SERIES} height={300} />
          </div>
        )}
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-rise" style={stagger(1)}>
          <PersonalRecordsPanel records={data.personalRecords} />
        </div>
        <div className="animate-rise" style={stagger(2)}>
          <AdherencePanel stats={data.adherence} />
        </div>
      </div>
    </div>
  );
}
