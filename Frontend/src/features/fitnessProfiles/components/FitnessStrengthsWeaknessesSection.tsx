import React from "react";
import { ArrowUpRight, ArrowDownRight, Award, AlertTriangle, ChevronRight } from "lucide-react";

interface FitnessStrengthsWeaknessesSectionProps {
  onViewImprovementStudents?: (dimension: string) => void;
}

export const FitnessStrengthsWeaknessesSection: React.FC<FitnessStrengthsWeaknessesSectionProps> = ({
  onViewImprovementStudents,
}) => {
  const strengths = [
    { rank: 1, dimension: "Endurance (Sức bền)", score: 81, trend: "+12.4%", badge: "Vượt trội" },
    { rank: 2, dimension: "Strength (Sức mạnh)", score: 72, trend: "+8.2%", badge: "Tốt" },
    { rank: 3, dimension: "Core (Cơ trung tâm)", score: 63, trend: "+5.7%", badge: "Ổn định" },
  ];

  const weaknesses = [
    { rank: 1, dimension: "Skill (Kỹ năng thăng bằng)", score: 47, trend: "+7.8%", badge: "Mức báo động", dimKey: "skill" },
    { rank: 2, dimension: "Mobility (Linh hoạt khớp vai/hông)", score: 54, trend: "+2.1%", badge: "Cần chú ý", dimKey: "mobility" },
    { rank: 3, dimension: "Balance (Thăng bằng)", score: 58, trend: "-1.2%", badge: "Giảm nhẹ", dimKey: "balance" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* LEFT: Điểm mạnh */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#8CA9FF]/15 p-2 text-[#547EFF] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Điểm mạnh</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Top 3 chỉ số phát triển tốt nhất</p>
              </div>
            </div>
            <span className="rounded-full bg-[#8CA9FF]/15 px-2.5 py-0.5 text-xs font-semibold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
              Chỉ số dẫn đầu
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {strengths.map((item) => (
              <div
                key={item.rank}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-[#8CA9FF]/50 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#547EFF] shadow-xs dark:bg-slate-800 dark:text-[#8CA9FF]">
                    {item.rank}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.dimension}
                    </span>
                    <span className="ml-2 inline-flex items-center text-[11px] font-semibold text-[#547EFF] dark:text-[#8CA9FF]">
                      <ArrowUpRight className="mr-0.5 h-3 w-3" />
                      {item.trend}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.score} <span className="text-[11px] font-normal text-slate-400">/100</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Cần cải thiện */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#FFF2C6] p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cần cải thiện</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Top 3 chỉ số có nhiều học viên dưới chuẩn</p>
              </div>
            </div>
            <span className="rounded-full bg-[#FFF2C6] px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              Ưu tiên huấn luyện
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {weaknesses.map((item) => (
              <div
                key={item.rank}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-amber-200 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-amber-700 shadow-xs dark:bg-slate-800 dark:text-amber-300">
                    {item.rank}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.dimension}
                    </span>
                    <span
                      className={`ml-2 inline-flex items-center text-[11px] font-semibold ${
                        item.trend.startsWith("-")
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {item.trend.startsWith("-") ? (
                        <ArrowDownRight className="mr-0.5 h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="mr-0.5 h-3 w-3" />
                      )}
                      {item.trend}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.score} <span className="text-[11px] font-normal text-slate-400">/100</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            onClick={() => onViewImprovementStudents && onViewImprovementStudents("mobility")}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-[#8CA9FF] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Xem danh sách học viên cần can thiệp
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
