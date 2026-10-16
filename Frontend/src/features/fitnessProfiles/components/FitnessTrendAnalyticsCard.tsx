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
import { TrendingUp } from "lucide-react";
import { GlobalFitnessTrendPoint } from "../types/fitnessProfile";
import { FITNESS_DIMENSION_COLORS } from "../constants/fitnessConstants";

interface FitnessTrendAnalyticsCardProps {
  trendData: GlobalFitnessTrendPoint[];
}

export const FitnessTrendAnalyticsCard: React.FC<FitnessTrendAnalyticsCardProps> = ({
  trendData,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>("overall");
  const [timeRange, setTimeRange] = useState<string>("90d");

  const metrics = [
    { key: "overall", label: "Overall", color: "#547EFF" },
    { key: "strength", label: "Strength", color: FITNESS_DIMENSION_COLORS.strength },
    { key: "endurance", label: "Endurance", color: FITNESS_DIMENSION_COLORS.endurance },
    { key: "mobility", label: "Mobility", color: FITNESS_DIMENSION_COLORS.mobility },
    { key: "core", label: "Core", color: FITNESS_DIMENSION_COLORS.core },
    { key: "balance", label: "Balance", color: FITNESS_DIMENSION_COLORS.balance },
    { key: "skill", label: "Skill", color: FITNESS_DIMENSION_COLORS.skill },
  ];

  const currentMetric = metrics.find((m) => m.key === selectedMetric) || metrics[0];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Xu hướng thể chất
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#547EFF] dark:text-[#8CA9FF]">
                <TrendingUp className="h-3.5 w-3.5" />
                Tăng trưởng đều
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thay đổi Fitness Score trung bình theo các mốc thời gian
            </p>
          </div>

          {/* Time range pills */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {[
              { key: "30d", label: "30 ngày" },
              { key: "90d", label: "90 ngày" },
              { key: "6m", label: "6 tháng" },
              { key: "1y", label: "1 năm" },
            ].map((tr) => (
              <button
                key={tr.key}
                onClick={() => setTimeRange(tr.key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  timeRange === tr.key
                    ? "bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric select pills */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3 dark:border-slate-800">
          {metrics.map((m) => {
            const isActive = selectedMetric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Line Chart */}
        <div className="mt-4 h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                ticks={[0, 20, 40, 60, 80, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(val: unknown) => [`${val} / 100 điểm`, currentMetric.label]}
                labelFormatter={(label) => `Tháng: ${label}`}
              />

              {/* Inactive subtle background line for overall */}
              {selectedMetric !== "overall" && (
                <Line
                  type="monotone"
                  dataKey="overall"
                  stroke="#CBD5E1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}

              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={currentMetric.color}
                strokeWidth={3}
                dot={{ r: 4, fill: currentMetric.color, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, stroke: currentMetric.color, strokeWidth: 2, fill: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
