import React, { useState } from "react";
import { Flame, Calendar, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { ConsistencyHeatmapDay } from "../types/performance.types";

interface TrainingConsistencyHeatmapProps {
  heatmapData: ConsistencyHeatmapDay[];
  currentStreakDays?: number;
  longestStreakDays?: number;
  averageWeeklyWorkouts?: number;
}

export const TrainingConsistencyHeatmap: React.FC<TrainingConsistencyHeatmapProps> = ({
  heatmapData,
  currentStreakDays = 21,
  longestStreakDays = 34,
  averageWeeklyWorkouts = 3.8,
}) => {
  const [hoveredDay, setHoveredDay] = useState<ConsistencyHeatmapDay | null>(null);

  const getColorClass = (level: 0 | 1 | 2 | 3) => {
    switch (level) {
      case 3:
        return "bg-[#3563E9] dark:bg-[#547EFF] hover:ring-2 hover:ring-[#8CA9FF]";
      case 2:
        return "bg-[#688DFF] dark:bg-[#446CE0] hover:ring-2 hover:ring-[#8CA9FF]";
      case 1:
        return "bg-[#AAC4F5] dark:bg-[#1E3A5F] hover:ring-2 hover:ring-[#8CA9FF]";
      case 0:
      default:
        return "bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-slate-400";
    }
  };

  const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const months = ["Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9"];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mức độ duy trì tập luyện (Consistency Heatmap)
              </h3>
              <span className="rounded-full bg-[#FFF2C6] px-2.5 py-0.5 text-[11px] font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                Chuỗi 21 ngày
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ma trận tần suất tập luyện toàn hệ thống trong 16 tuần qua
            </p>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>Chuỗi hiện tại: <strong>{currentStreakDays} ngày</strong></span>
            </div>
            <span>•</span>
            <div className="text-slate-500 dark:text-slate-400">
              Kỷ lục: <strong>{longestStreakDays} ngày</strong>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[480px]">
            {/* Month Labels */}
            <div className="flex justify-between pl-7 pr-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              {months.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>

            {/* Matrix (7 rows for Mon-Sun) */}
            <div className="flex gap-2">
              {/* Day Labels */}
              <div className="flex flex-col justify-between text-[9px] font-semibold text-slate-500 dark:text-slate-400 py-0.5">
                {daysOfWeek.map((d) => (
                  <span key={d} className="h-3.5 leading-3.5">
                    {d}
                  </span>
                ))}
              </div>

              {/* Columns of weeks */}
              <div className="grid grid-flow-col grid-rows-7 gap-1.5 flex-1">
                {heatmapData.map((day, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`h-3.5 w-3.5 rounded-xs transition-all cursor-pointer ${getColorClass(
                      day.level
                    )}`}
                  />
                ))}
              </div>
            </div>

            {/* Hover Tooltip display */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <div>
                {hoveredDay ? (
                  <span className="font-semibold text-slate-900 dark:text-white">
                    📅 {hoveredDay.date}:{" "}
                    <strong className="text-[#547EFF] dark:text-[#8CA9FF]">
                      {hoveredDay.workoutsCount} buổi tập
                    </strong>{" "}
                    ({hoveredDay.activeStudentsCount} học viên)
                  </span>
                ) : (
                  <span>Di chuột vào ô để xem số lượng buổi tập theo ngày</span>
                )}
              </div>

              {/* Intensity legend */}
              <div className="flex items-center gap-1">
                <span>Ít</span>
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-200 dark:bg-slate-800" />
                <span className="h-2.5 w-2.5 rounded-xs bg-[#AAC4F5]" />
                <span className="h-2.5 w-2.5 rounded-xs bg-[#688DFF]" />
                <span className="h-2.5 w-2.5 rounded-xs bg-[#3563E9]" />
                <span>Nhiều</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
