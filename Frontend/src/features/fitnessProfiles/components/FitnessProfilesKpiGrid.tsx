import React from "react";
import { Users, Activity, TrendingUp, CalendarClock, ArrowUpRight } from "lucide-react";
import { FitnessKpiData } from "../types/fitnessProfile";

interface FitnessProfilesKpiGridProps {
  data?: FitnessKpiData;
  isLoading?: boolean;
  onFilterOverdue?: () => void;
  onFilterImproving?: () => void;
}

export const FitnessProfilesKpiGrid: React.FC<FitnessProfilesKpiGridProps> = ({
  data,
  isLoading,
  onFilterOverdue,
  onFilterImproving,
}) => {
  if (isLoading || !data) {
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

  const kpis = [
    {
      id: "total",
      label: "TỔNG HỒ SƠ",
      value: data.totalProfiles.toLocaleString(),
      subtext: `${data.activeProfiles.toLocaleString()} hồ sơ đang hoạt động`,
      icon: Users,
      iconBg: "bg-[#8CA9FF]/15 text-[#547EFF] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]",
      trendText: "+148 tuần này",
      trendPositive: true,
      onClick: undefined,
    },
    {
      id: "average",
      label: "ĐIỂM THỂ CHẤT TRUNG BÌNH",
      value: `${data.averageScore} / 100`,
      subtext: `↑ ${data.averageScoreTrend}% so với tháng trước`,
      icon: Activity,
      iconBg: "bg-[#AAC4F5]/20 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      trendText: `+${data.averageScoreTrend}%`,
      trendPositive: true,
      onClick: undefined,
    },
    {
      id: "improving",
      label: "ĐANG TIẾN BỘ",
      value: data.improvingCount.toLocaleString(),
      subtext: `${data.improvingPercentage}% học viên`,
      icon: TrendingUp,
      iconBg: "bg-[#8CA9FF]/15 text-[#547EFF] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]",
      trendText: "Tích cực",
      trendPositive: true,
      onClick: onFilterImproving,
    },
    {
      id: "reassessment",
      label: "CẦN ĐÁNH GIÁ LẠI",
      value: data.reassessmentDueCount.toLocaleString(),
      subtext: `${data.reassessmentDuePercentage}% tổng số học viên`,
      icon: CalendarClock,
      iconBg: "bg-[#FFF2C6] text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      trendText: "Cần xử lý",
      trendPositive: false,
      onClick: onFilterOverdue,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            onClick={kpi.onClick}
            className={`group relative flex flex-col justify-between rounded-[18px] border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8CA9FF] hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
              kpi.onClick ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  {kpi.label}
                </span>
                <div className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {kpi.value}
                </div>
              </div>
              <div className={`rounded-xl p-2.5 ${kpi.iconBg}`}>
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400">{kpi.subtext}</span>
              {kpi.trendText && (
                <span
                  className={`inline-flex items-center text-[11px] font-semibold ${
                    kpi.trendPositive ? "text-[#547EFF] dark:text-[#8CA9FF]" : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {kpi.trendPositive && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
                  {kpi.trendText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
