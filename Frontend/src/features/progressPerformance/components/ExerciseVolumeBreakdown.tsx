import React, { useState } from "react";
import { ArrowUpRight, Flame, Dumbbell, Activity, Shield, TrendingUp, Users } from "lucide-react";
import { TopExerciseVolume } from "../types/performance.types";

interface ExerciseVolumeBreakdownProps {
  exercises: TopExerciseVolume[];
}

export const ExerciseVolumeBreakdown: React.FC<ExerciseVolumeBreakdownProps> = ({ exercises }) => {
  const [sortBy, setSortBy] = useState<"volume" | "students" | "growth">("volume");

  const sortedList = [...exercises].sort((a, b) => {
    if (sortBy === "students") return b.activeStudentsCount - a.activeStudentsCount;
    if (sortBy === "growth") return b.growthPercentage - a.growthPercentage;
    return b.volumeNumber - a.volumeNumber;
  });

  const maxVolume = Math.max(...exercises.map((e) => e.volumeNumber), 1);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Top bài tập theo khối lượng
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Các động tác có volume thực hiện nhiều nhất trong kỳ
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "volume" | "students" | "growth")}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="volume">Khối lượng (Volume)</option>
              <option value="students">Số người tập</option>
              <option value="growth">Tăng trưởng (%)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          {sortedList.map((ex, idx) => {
            const percentageOfMax = Math.round((ex.volumeNumber / maxVolume) * 100);

            return (
              <div key={ex.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8CA9FF]/15 text-[10px] font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
                      0{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ex.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Users className="h-3 w-3 text-slate-400" />
                      {ex.activeStudentsCount.toLocaleString()} người
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {ex.volumeLabel}
                    </span>
                    <span className="inline-flex items-center text-[11px] font-bold text-[#547EFF] dark:text-[#8CA9FF]">
                      <ArrowUpRight className="mr-0.5 h-3 w-3" />
                      +{ex.growthPercentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] transition-all duration-500"
                    style={{ width: `${percentageOfMax}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
