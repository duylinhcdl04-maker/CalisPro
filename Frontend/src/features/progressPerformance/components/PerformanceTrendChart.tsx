import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Layers } from "lucide-react";
import { WeeklyTrendPoint } from "../types/performance.types";

interface PerformanceTrendChartProps {
  trendData: WeeklyTrendPoint[];
  isLoading?: boolean;
}

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({
  trendData,
  isLoading,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>("overall");
  const [timeframe, setTimeframe] = useState<string>("8w");

  if (isLoading) {
    return (
      <div className="h-[360px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Xu hướng hiệu suất tập luyện
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#547EFF] dark:text-[#8CA9FF]">
                <TrendingUp className="h-3.5 w-3.5" />
                +24.5% trung bình
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              So sánh hiệu suất thực tế của toàn bộ học viên qua từng tuần tập luyện
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Select */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
              <Layers className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-none dark:text-slate-200"
              >
                <option value="overall">Overall Performance</option>
                <option value="strength">Strength Performance</option>
                <option value="endurance">Endurance Performance</option>
                <option value="form">Form Quality (AI)</option>
                <option value="completion">Workout Completion</option>
                <option value="volume">Training Volume</option>
                <option value="consistency">Consistency Rate</option>
              </select>
            </div>

            {/* Timeframe Buttons */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {[
                { key: "8w", label: "8 tuần" },
                { key: "3m", label: "3 tháng" },
                { key: "6m", label: "6 tháng" },
                { key: "1y", label: "1 năm" },
              ].map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    timeframe === tf.key
                      ? "bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-6 rounded-full bg-[#547EFF]" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Kỳ hiện tại (Current Period)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-6 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Kỳ trước (Previous Period)</span>
          </div>
        </div>

        {/* Line Chart */}
        <div className="mt-4 h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[50, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || !payload.length) return null;
                  const data = payload[0].payload as WeeklyTrendPoint;
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white shadow-xl">
                      <div className="font-bold text-[#8CA9FF]">{label}</div>
                      <div className="mt-1.5 flex items-center justify-between gap-4">
                        <span className="text-slate-300">Kỳ hiện tại:</span>
                        <span className="font-bold text-white">{data.currentPeriod} điểm</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-400">
                        <span>Kỳ trước:</span>
                        <span>{data.previousPeriod} điểm</span>
                      </div>
                      <div className="mt-1 border-t border-slate-700 pt-1 flex items-center justify-between gap-4 font-bold text-[#8CA9FF]">
                        <span>Mức tăng trưởng:</span>
                        <span>+{data.difference} điểm</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="previousPeriod"
                name="Kỳ trước"
                stroke="#CBD5E1"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="currentPeriod"
                name="Kỳ hiện tại"
                stroke="#547EFF"
                strokeWidth={3}
                dot={{ r: 4, fill: "#547EFF", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#547EFF", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
