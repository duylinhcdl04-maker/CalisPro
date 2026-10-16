import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Layers } from "lucide-react";
import { RevenueAnalyticsPoint } from "../types/subscription.types";

interface RevenueAnalyticsChartProps {
  data: RevenueAnalyticsPoint[];
  isLoading?: boolean;
}

type MetricView = "both" | "revenue" | "mrr";

export const RevenueAnalyticsChart: React.FC<RevenueAnalyticsChartProps> = ({
  data,
  isLoading,
}) => {
  const [metricView, setMetricView] = useState<MetricView>("both");
  const [timeframe, setTimeframe] = useState<string>("12m");

  if (isLoading) {
    return (
      <div className="h-[380px] animate-pulse rounded-2xl border border-[#E3E7DF] bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" />
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#172019] dark:text-white">
                Doanh thu theo thời gian
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" />
                +12.8% tăng trưởng
              </span>
            </div>
            <p className="text-xs text-[#687268] dark:text-zinc-400">
              Theo dõi xu hướng tổng doanh thu thực nhận và doanh thu định kỳ (MRR)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-[#F7F8F4] p-1 dark:bg-zinc-800">
              {[
                { key: "both", label: "Tất cả" },
                { key: "revenue", label: "Doanh thu" },
                { key: "mrr", label: "MRR" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetricView(m.key as MetricView)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    metricView === m.key
                      ? "bg-white text-[#172019] shadow-xs dark:bg-zinc-700 dark:text-white"
                      : "text-[#687268] hover:text-[#172019] dark:text-zinc-400"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 rounded-xl bg-[#F7F8F4] p-1 dark:bg-zinc-800">
              {[
                { key: "30d", label: "30 ngày" },
                { key: "3m", label: "3 tháng" },
                { key: "6m", label: "6 tháng" },
                { key: "12m", label: "1 năm" },
              ].map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    timeframe === tf.key
                      ? "bg-white text-[#172019] shadow-xs dark:bg-zinc-700 dark:text-white"
                      : "text-[#687268] hover:text-[#172019] dark:text-zinc-400"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-5 text-xs text-[#687268] dark:text-zinc-400">
          {(metricView === "both" || metricView === "revenue") && (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-5 rounded-full bg-[#7C9B5B]" />
              <span className="font-semibold text-[#172019] dark:text-zinc-200">
                Tổng doanh thu thực nhận
              </span>
            </div>
          )}
          {(metricView === "both" || metricView === "mrr") && (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-5 rounded-full bg-[#55733C]" />
              <span className="font-semibold text-[#172019] dark:text-zinc-200">
                MRR (Doanh thu định kỳ)
              </span>
            </div>
          )}
        </div>

        {/* Area Chart */}
        <div className="mt-4 h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C9B5B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7C9B5B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#55733C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#55733C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2ED" vertical={false} />
              <XAxis dataKey="period" stroke="#687268" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#687268"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`}
              />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || !payload.length) return null;
                  const item = payload[0].payload as RevenueAnalyticsPoint;
                  return (
                    <div className="rounded-xl border border-zinc-700 bg-[#182018] p-3 text-xs text-white shadow-xl">
                      <div className="font-bold text-[#7C9B5B]">
                        {label} {item.isForecast ? "(Dự báo)" : ""}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-5">
                        <span className="text-zinc-300">Tổng doanh thu:</span>
                        <span className="font-bold text-white">
                          {item.revenue.toLocaleString()}đ
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-5">
                        <span className="text-zinc-400">MRR định kỳ:</span>
                        <span className="font-bold text-[#EEF4E8]">
                          {item.mrr.toLocaleString()}đ
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              {(metricView === "both" || metricView === "revenue") && (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7C9B5B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              )}
              {(metricView === "both" || metricView === "mrr") && (
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#55733C"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMRR)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
