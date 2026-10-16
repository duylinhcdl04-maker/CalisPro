import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart3, ArrowUpRight } from "lucide-react";
import { TrainingVolumePoint } from "../types/performance.types";

interface TrainingVolumeChartProps {
  volumeData: TrainingVolumePoint[];
  isLoading?: boolean;
}

type VolumeMetricKey = "reps" | "sets" | "durationMinutes" | "workouts";

export const TrainingVolumeChart: React.FC<TrainingVolumeChartProps> = ({
  volumeData,
  isLoading,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<VolumeMetricKey>("reps");

  const metricConfigs: Record<VolumeMetricKey, { label: string; unit: string; color: string }> = {
    reps: { label: "Tổng Reps", unit: "reps", color: "#547EFF" },
    sets: { label: "Tổng Sets", unit: "sets", color: "#8CA9FF" },
    durationMinutes: { label: "Thời lượng", unit: "phút", color: "#F59E0B" },
    workouts: { label: "Số phiên tập", unit: "buổi", color: "#6366F1" },
  };

  const currentConfig = metricConfigs[selectedMetric];

  if (isLoading) {
    return (
      <div className="h-[320px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Khối lượng tập luyện (Training Volume)
            </h3>
            <span className="inline-flex items-center text-xs font-bold text-[#547EFF] dark:text-[#8CA9FF]">
              <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
              +18.4%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng volume tập luyện tích lũy của toàn bộ cộng đồng học viên
          </p>
        </div>

        {/* Metric Switcher Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(["reps", "sets", "durationMinutes", "workouts"] as VolumeMetricKey[]).map((key) => {
            const isActive = selectedMetric === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {metricConfigs[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mt-5 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={volumeData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || !payload.length) return null;
                const val = payload[0].value;
                return (
                  <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white shadow-xl">
                    <div className="font-bold text-[#8CA9FF]">{label}</div>
                    <div className="mt-1 flex items-center justify-between gap-4">
                      <span>{currentConfig.label}:</span>
                      <span className="font-bold text-white">
                        {Number(val).toLocaleString()} {currentConfig.unit}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey={selectedMetric}
              fill={currentConfig.color}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
