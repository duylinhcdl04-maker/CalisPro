import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ArrowUpRight, TrendingUp, Sparkles, Flame } from "lucide-react";
import { FitnessProgressSummary } from "../../types/fitnessProfile";
import { FITNESS_DIMENSION_COLORS } from "../../constants/fitnessConstants";

interface ProgressAnalyticsTabContentProps {
  progress: FitnessProgressSummary;
  isLoading?: boolean;
}

export const ProgressAnalyticsTabContent: React.FC<ProgressAnalyticsTabContentProps> = ({
  progress,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-[#E3E7DF] bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Total improvement */}
      <div className="rounded-2xl border border-[#8CA9FF]/30 bg-gradient-to-r from-[#8CA9FF]/10 via-[#AAC4F5]/10 to-white p-5 dark:border-[#8CA9FF]/20 dark:from-[#8CA9FF]/10 dark:via-zinc-900 dark:to-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1e3a8a] dark:text-[#8CA9FF]">
              <Sparkles className="h-4 w-4 text-[#547EFF]" />
              Tiến bộ Tổng thể (Overall Improvement)
            </span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-zinc-400 line-through dark:text-zinc-500">
                {progress.startingOverallScore}
              </span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">→</span>
              <span className="text-3xl font-extrabold text-[#547EFF] dark:text-[#8CA9FF]">
                {progress.currentOverallScore}
              </span>
              <span className="text-xs text-slate-500">/ 100 điểm</span>
            </div>
            <p className="mt-1 text-xs text-[#687268] dark:text-zinc-400">
              Ghi nhận từ {progress.startDate} đến {progress.currentDate}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-xs dark:bg-zinc-800">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                +{progress.totalImprovementPercentage}%
              </div>
              <div className="text-[11px] font-medium text-[#687268] dark:text-zinc-400">
                Tăng trưởng thể lực
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Dimension Progress Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Tiến bộ theo 6 Nhóm Thể chất
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chỉ số ban đầu và mức độ bứt phá sau chuỗi bài tập
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {progress.dimensions.map((dim) => {
            const color = FITNESS_DIMENSION_COLORS[dim.dimension] || "#547EFF";
            return (
              <div
                key={dim.dimension}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-[#8CA9FF] dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {dim.label}
                  </span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                    +{dim.changePercentage}%
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-slate-400">
                      {dim.startScore}
                    </span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {dim.currentScore}
                    </span>
                    <span className="text-[10px] text-slate-400">/ 100</span>
                  </div>
                  <span className="rounded-md bg-[#8CA9FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                    +{dim.changeValue} điểm
                  </span>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${dim.currentScore}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Timeline Chart */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Biểu đồ Tiến trình Lịch sử
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Diễn biến điểm số qua từng đợt kiểm tra thể lực
        </p>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={progress.scoreTimeline}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "10px",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="overall"
                name="Overall Score"
                stroke="#547EFF"
                strokeWidth={3}
                dot={{ r: 4, fill: "#547EFF", strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="strength"
                name="Strength"
                stroke={FITNESS_DIMENSION_COLORS.strength}
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="endurance"
                name="Endurance"
                stroke={FITNESS_DIMENSION_COLORS.endurance}
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
