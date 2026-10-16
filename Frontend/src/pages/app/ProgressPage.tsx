import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  History,
  Trophy,
  Activity,
  Calendar,
  Sparkles,
  Flame,
} from "lucide-react";
import type { ProgressMetricKey } from "../../types";
import { usePersonalRecordsQuery, useProgressMetricsQuery } from "../../features/progress/hooks";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { CardSkeleton, ChartSkeleton } from "../../components/ui/Skeleton";
import { ProgressChart } from "../../components/progress/ProgressChart";
import { MetricSwitcher, METRIC_META, RANGE_META, type RangeKey } from "../../components/progress/MetricSwitcher";
import { PersonalRecordCard } from "../../components/progress/PersonalRecordCard";
import { WorkoutHistoryView } from "../../components/progress/WorkoutHistoryView";
import { MOCK_WORKOUT_HISTORY } from "../../services/mock/workoutHistoryData";
import { StreakMilestonesSection } from "../../components/streak/StreakMilestonesSection";

type ProgressTabMode = "analytics" | "streak" | "history";

export default function ProgressPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as ProgressTabMode) || "analytics";
  const [tabMode, setTabMode] = useState<ProgressTabMode>(
    initialTab === "streak" || initialTab === "history" ? initialTab : "analytics"
  );
  const [metric, setMetric] = useState<ProgressMetricKey>("strength");
  const [range, setRange] = useState<RangeKey>("3M");

  useEffect(() => {
    const tab = searchParams.get("tab") as ProgressTabMode;
    if (tab && (tab === "analytics" || tab === "streak" || tab === "history")) {
      setTabMode(tab);
    }
  }, [searchParams]);

  const handleTabChange = (mode: ProgressTabMode) => {
    setTabMode(mode);
    setSearchParams({ tab: mode });
  };

  const metricsQuery = useProgressMetricsQuery();
  const recordsQuery = usePersonalRecordsQuery();

  const isLoading = metricsQuery.isLoading || recordsQuery.isLoading;
  const isError = metricsQuery.isError || recordsQuery.isError;

  const series = metricsQuery.data?.[metric] ?? [];
  const visibleSeries = useMemo(() => {
    const points = RANGE_META[range].points;
    return series.slice(Math.max(0, series.length - points));
  }, [series, range]);

  function handleRetry() {
    metricsQuery.refetch();
    recordsQuery.refetch();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      {/* 🌟 TOP HEADER WITH SELECTION TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            {tabMode === "analytics"
              ? "Tiến độ & Chỉ số"
              : tabMode === "streak"
              ? "Chuỗi ngày & Mốc thành tích (Streak)"
              : "Lịch sử luyện tập"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {tabMode === "analytics"
              ? "Theo dõi sự cải thiện sức mạnh, sức bền và độ linh hoạt theo thời gian."
              : tabMode === "streak"
              ? "Theo dõi chuỗi ngày tập liên tục, giữ vững kỷ luật và mở khóa huy hiệu danh giá."
              : "Nhật ký lưu trữ tất cả các bài tập và buổi tập Calisthenics đã hoàn thành."}
          </p>
        </div>

        {/* PRIMARY SELECTION MODES */}
        <div className="flex items-center rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-1 border border-border shadow-xs shrink-0 flex-wrap gap-1">
          <button
            type="button"
            onClick={() => handleTabChange("analytics")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
              tabMode === "analytics"
                ? "bg-white dark:bg-slate-800 text-[#1e3a8a] dark:text-[#8CA9FF] font-extrabold shadow-xs border border-[#8CA9FF]/30"
                : "text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5"
            }`}
          >
            <TrendingUp size={15} />
            Biểu đồ & Kỷ lục
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("streak")}
            className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
              tabMode === "streak"
                ? "bg-white dark:bg-slate-800 text-[#1e3a8a] dark:text-[#8CA9FF] font-extrabold shadow-xs border border-[#8CA9FF]/30"
                : "text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5"
            }`}
          >
            <Flame size={15} className="text-orange-500" />
            Chuỗi ngày & Mốc
            <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.2 text-[10px] font-black shadow-2xs">
              16 Ngày
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("history")}
            className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
              tabMode === "history"
                ? "bg-white dark:bg-slate-800 text-[#1e3a8a] dark:text-[#8CA9FF] font-extrabold shadow-xs border border-[#8CA9FF]/30"
                : "text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5"
            }`}
          >
            <History size={15} />
            Lịch sử
            <span className="rounded-full bg-[#8CA9FF]/20 text-[#1d3d9e] dark:text-[#8CA9FF] px-1.5 py-0.2 text-[10px] font-extrabold border border-[#8CA9FF]/30">
              {MOCK_WORKOUT_HISTORY.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📈 TAB 1: ANALYTICS & PERSONAL RECORDS */}
      {/* ========================================================= */}
      {tabMode === "analytics" && (
        <div className="space-y-8">
          {isLoading ? (
            <div className="space-y-6">
              <ChartSkeleton />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          ) : isError ? (
            <Card className="py-12 text-center">
              <p className="text-sm text-text-secondary">Không tải được dữ liệu tiến độ. Vui lòng thử lại.</p>
              <Button variant="outline" className="mt-4" onClick={handleRetry}>
                Thử lại
              </Button>
            </Card>
          ) : (
            <>
              <Card className="shadow-elevated border-border/80">
                <MetricSwitcher metric={metric} onMetricChange={setMetric} range={range} onRangeChange={setRange} />
                <div className="mt-6">
                  {visibleSeries.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-sm text-text-secondary md:h-80">
                      Chưa có dữ liệu cho khoảng thời gian này.
                    </div>
                  ) : (
                    <ProgressChart data={visibleSeries} unit={METRIC_META[metric].unit} />
                  )}
                </div>
              </Card>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={16} className="text-amber-500" />
                  <h2 className="font-display text-base font-bold text-text-primary">Kỷ lục cá nhân (Personal Records)</h2>
                </div>
                {!recordsQuery.data || recordsQuery.data.length === 0 ? (
                  <Card className="py-8 text-center text-sm text-text-secondary">
                    Hoàn thành buổi tập đầu tiên để bắt đầu ghi nhận kỷ lục cá nhân.
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {recordsQuery.data.map((record) => (
                      <PersonalRecordCard key={record.exercise} record={record} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 🔥 TAB 2: STREAK & MILESTONE BADGES */}
      {/* ========================================================= */}
      {tabMode === "streak" && <StreakMilestonesSection />}

      {/* ========================================================= */}
      {/* 📜 TAB 3: WORKOUT HISTORY (LỊCH SỬ BÀI TẬP ĐÃ HOÀN THÀNH) */}
      {/* ========================================================= */}
      {tabMode === "history" && <WorkoutHistoryView />}
    </div>
  );
}
