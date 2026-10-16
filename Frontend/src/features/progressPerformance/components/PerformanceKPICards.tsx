import React from "react";
import { Trophy, TrendingUp, Flame, CheckCircle2, ArrowUpRight } from "lucide-react";
import { PerformanceKPIs } from "../types/performance.types";

interface PerformanceKPICardsProps {
  kpis?: PerformanceKPIs;
  isLoading?: boolean;
}

export const PerformanceKPICards: React.FC<PerformanceKPICardsProps> = ({
  kpis,
  isLoading,
}) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[128px] animate-pulse rounded-[18px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "prs",
      label: "KỶ LỤC CÁ NHÂN",
      value: `${kpis.personalRecordsCount.toLocaleString()} PRs`,
      subtext: `+${kpis.personalRecordsGrowth}% so với tháng trước`,
      icon: Trophy,
      iconBg: "bg-[#FFF2C6] text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      trendText: `+${kpis.personalRecordsGrowth}%`,
      trendPositive: true,
    },
    {
      id: "performance",
      label: "MỨC TĂNG HIỆU SUẤT TB",
      value: `+${kpis.averagePerformanceGrowth}%`,
      subtext: "Trong 8 tuần gần nhất",
      icon: TrendingUp,
      iconBg: "bg-[#8CA9FF]/15 text-[#547EFF] dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]",
      trendText: "Tăng trưởng cao",
      trendPositive: true,
    },
    {
      id: "streak",
      label: "TỶ LỆ DUY TRÌ CHUỖI",
      value: `${kpis.streakRetentionRate}%`,
      subtext: "Học viên tập ≥ 3 buổi/tuần",
      icon: Flame,
      iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
      trendText: "Kỷ luật tốt",
      trendPositive: true,
    },
    {
      id: "completion",
      label: "TỶ LỆ HOÀN THÀNH",
      value: `${kpis.workoutCompletionRate}%`,
      subtext: `+${kpis.completionGrowth}% so với tháng trước`,
      icon: CheckCircle2,
      iconBg: "bg-[#AAC4F5]/20 text-[#2563eb] dark:bg-blue-950/40 dark:text-blue-300",
      trendText: `+${kpis.completionGrowth}%`,
      trendPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="group relative flex flex-col justify-between rounded-[18px] border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8CA9FF] hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  {c.label}
                </span>
                <div className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {c.value}
                </div>
              </div>
              <div className={`rounded-xl p-2.5 ${c.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400">{c.subtext}</span>
              {c.trendText && (
                <span className="inline-flex items-center text-[11px] font-bold text-[#547EFF] dark:text-[#8CA9FF]">
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  {c.trendText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
