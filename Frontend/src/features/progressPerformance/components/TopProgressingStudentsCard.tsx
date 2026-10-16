import React from "react";
import { ArrowUpRight, Flame, Trophy, Eye, ChevronRight } from "lucide-react";
import { StudentPerformanceRecord } from "../types/performance.types";
import { PERFORMANCE_FITNESS_LEVEL_STYLES } from "../constants/performance.constants";

interface TopProgressingStudentsCardProps {
  students: StudentPerformanceRecord[];
  onOpenDrawer: (student: StudentPerformanceRecord) => void;
  onViewAll?: () => void;
}

export const TopProgressingStudentsCard: React.FC<TopProgressingStudentsCardProps> = ({
  students,
  onOpenDrawer,
  onViewAll,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-base font-bold text-slate-900 dark:text-white">
            <span>🚀</span>
            <span>Học viên tiến bộ nhanh nhất</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Top học viên có tỷ lệ bứt phá hiệu suất cao nhất trong kỳ đánh giá
          </p>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#547EFF] hover:underline dark:text-[#8CA9FF]"
          >
            Xem tất cả
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="w-12 pb-3 text-center font-semibold">Hạng</th>
              <th className="pb-3 font-semibold">Học viên</th>
              <th className="pb-3 text-center font-semibold">Cấp độ</th>
              <th className="pb-3 text-center font-semibold">Điểm hiệu suất</th>
              <th className="pb-3 text-center font-semibold">Tăng trưởng</th>
              <th className="pb-3 text-center font-semibold">Chuỗi Streak</th>
              <th className="pb-3 text-center font-semibold">Kỷ lục PRs</th>
              <th className="pb-3 text-center font-semibold">Tập gần nhất</th>
              <th className="pb-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map((st, idx) => {
              const levelStyle = PERFORMANCE_FITNESS_LEVEL_STYLES[st.fitnessLevel];
              return (
                <tr
                  key={st.id}
                  onClick={() => onOpenDrawer(st)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                >
                  <td className="py-3 text-center">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                        idx === 0
                          ? "bg-[#FFF2C6] text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                          : idx === 1
                          ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                          : idx === 2
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      0{idx + 1}
                    </span>
                  </td>

                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8CA9FF]/15 font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                        {st.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-[#547EFF] dark:text-white dark:group-hover:text-[#8CA9FF]">
                          {st.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {st.studentCode}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                    >
                      {st.fitnessLevel}
                    </span>
                  </td>

                  <td className="py-3 text-center">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {st.performanceScore} <span className="font-normal text-slate-400">/100</span>
                    </span>
                  </td>

                  <td className="py-3 text-center">
                    <span className="inline-flex items-center font-black text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                      +{st.improvementPercentage}%
                    </span>
                  </td>

                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      <Flame className="h-3 w-3 text-amber-500" />
                      {st.currentStreakDays} ngày
                    </span>
                  </td>

                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-300">
                      <Trophy className="h-3 w-3 text-indigo-500" />
                      {st.personalRecordsCount} PRs
                    </span>
                  </td>

                  <td className="py-3 text-center text-slate-500 dark:text-slate-400">
                    {st.lastWorkoutDate}
                  </td>

                  <td className="py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDrawer(st);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#547EFF]" />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
