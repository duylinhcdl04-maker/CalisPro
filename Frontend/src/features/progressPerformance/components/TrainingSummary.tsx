import React from "react";
import { Dumbbell, Clock, Users, Flame, Activity, Zap } from "lucide-react";
import { PerformanceKPIs } from "../types/performance.types";

interface TrainingSummaryProps {
  kpis?: PerformanceKPIs;
  isLoading?: boolean;
}

export const TrainingSummary: React.FC<TrainingSummaryProps> = ({ kpis, isLoading }) => {
  if (isLoading || !kpis) {
    return (
      <div className="h-[360px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  const items = [
    {
      label: "TOTAL WORKOUTS",
      value: kpis.totalWorkouts.toLocaleString(),
      subtext: "Phiên tập đã hoàn thành",
      icon: Dumbbell,
      color: "text-[#547EFF] dark:text-[#8CA9FF]",
      bg: "bg-[#8CA9FF]/15 dark:bg-[#8CA9FF]/20",
    },
    {
      label: "TOTAL REPS",
      value: kpis.totalReps.toLocaleString(),
      subtext: "Số rep Calisthenics tích lũy",
      icon: Zap,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-[#FFF2C6] dark:bg-amber-950/40",
    },
    {
      label: "TRAINING TIME",
      value: `${kpis.trainingTimeHours.toLocaleString()} hrs`,
      subtext: "Thời lượng luyện tập toàn hệ thống",
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-[#AAC4F5]/20 dark:bg-blue-950/40",
    },
    {
      label: "ACTIVE STUDENTS",
      value: kpis.activeStudents.toLocaleString(),
      subtext: "Học viên duy trì lịch tập",
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      label: "AVERAGE WORKOUT / WEEK",
      value: `${kpis.averageWorkoutsPerWeek} buổi`,
      subtext: "Tần suất tập luyện trung bình",
      icon: Flame,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tổng quan tập luyện
          </h3>
          <span className="rounded-full bg-[#8CA9FF]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
            Hệ thống CalisHealth
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Chỉ số hoạt động và khối lượng vận động thực tế
        </p>

        <div className="mt-4 space-y-2.5">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.label}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3 transition-colors hover:border-[#8CA9FF]/60 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2 ${it.bg} ${it.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {it.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {it.subtext}
                    </div>
                  </div>
                </div>

                <div className="text-right font-extrabold text-slate-900 dark:text-white text-sm">
                  {it.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
