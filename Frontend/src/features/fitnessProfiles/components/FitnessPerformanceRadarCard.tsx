import React, { useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { Sparkles, Layers } from "lucide-react";

interface FitnessPerformanceRadarCardProps {
  studentData?: {
    strength: number;
    endurance: number;
    mobility: number;
    core: number;
    balance: number;
    skill: number;
  };
  showComparisonDropdown?: boolean;
}

const COMPARISON_PRESETS: Record<
  string,
  { label: string; strength: number; endurance: number; mobility: number; core: number; balance: number; skill: number }
> = {
  overall: { label: "Overall Average", strength: 72, endurance: 81, mobility: 54, core: 63, balance: 58, skill: 47 },
  beginner: { label: "Beginner Benchmark", strength: 48, endurance: 58, mobility: 50, core: 46, balance: 52, skill: 30 },
  intermediate: { label: "Intermediate Benchmark", strength: 70, endurance: 78, mobility: 60, core: 66, balance: 62, skill: 55 },
  advanced: { label: "Advanced Benchmark", strength: 88, endurance: 88, mobility: 75, core: 86, balance: 82, skill: 80 },
  elite: { label: "Elite Athlete Benchmark", strength: 95, endurance: 94, mobility: 84, core: 94, balance: 90, skill: 92 },
};

export const FitnessPerformanceRadarCard: React.FC<FitnessPerformanceRadarCardProps> = ({
  studentData,
  showComparisonDropdown = true,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("overall");

  const baseValues = studentData || COMPARISON_PRESETS[selectedPreset];
  const benchmarkValues = studentData ? COMPARISON_PRESETS[selectedPreset] : COMPARISON_PRESETS.intermediate;

  const chartData = [
    {
      dimension: "Strength",
      vietnamese: "Sức mạnh",
      value: baseValues.strength,
      benchmark: benchmarkValues.strength,
      fullMark: 100,
    },
    {
      dimension: "Endurance",
      vietnamese: "Sức bền",
      value: baseValues.endurance,
      benchmark: benchmarkValues.endurance,
      fullMark: 100,
    },
    {
      dimension: "Mobility",
      vietnamese: "Linh hoạt",
      value: baseValues.mobility,
      benchmark: benchmarkValues.mobility,
      fullMark: 100,
    },
    {
      dimension: "Core",
      vietnamese: "Cơ bụng",
      value: baseValues.core,
      benchmark: benchmarkValues.core,
      fullMark: 100,
    },
    {
      dimension: "Balance",
      vietnamese: "Thăng bằng",
      value: baseValues.balance,
      benchmark: benchmarkValues.balance,
      fullMark: 100,
    },
    {
      dimension: "Skill",
      vietnamese: "Kỹ năng",
      value: baseValues.skill,
      benchmark: benchmarkValues.skill,
      fullMark: 100,
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Fitness Performance
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#8CA9FF]/15 px-2 py-0.5 text-[11px] font-semibold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
              <Sparkles className="h-3 w-3 text-[#547EFF] dark:text-[#8CA9FF]" />
              Radar Analysis
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            So sánh tổng quan 6 chỉ số thể chất Calisthenics
          </p>
        </div>

        {showComparisonDropdown && (
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="overall">Overall Average</option>
              <option value="beginner">Beginner Benchmark</option>
              <option value="intermediate">Intermediate Benchmark</option>
              <option value="advanced">Advanced Benchmark</option>
              <option value="elite">Elite Benchmark</option>
            </select>
          </div>
        )}
      </div>

      <div className="mt-4 flex h-[280px] w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#E2E8F0" tick={{ fontSize: 9 }} />
            
            {studentData && (
              <Radar
                name="So sánh chuẩn"
                dataKey="benchmark"
                stroke="#94A3B8"
                fill="#94A3B8"
                fillOpacity={0.15}
                strokeDasharray="4 4"
              />
            )}

            <Radar
              name="Chỉ số hiện tại"
              dataKey="value"
              stroke="#547EFF"
              fill="#8CA9FF"
              fillOpacity={0.4}
              strokeWidth={2}
            />

            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white shadow-lg">
                    <div className="font-bold text-[#8CA9FF]">{data.dimension} ({data.vietnamese})</div>
                    <div className="mt-1 flex items-center justify-between gap-4">
                      <span>Điểm số:</span>
                      <span className="font-bold text-white">{data.value} / 100</span>
                    </div>
                    {studentData && (
                      <div className="flex items-center justify-between gap-4 text-slate-400">
                        <span>Chuẩn so sánh:</span>
                        <span>{data.benchmark} / 100</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Dimension summary chips */}
      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center sm:grid-cols-6 dark:border-slate-800">
        {chartData.map((d) => (
          <div key={d.dimension} className="rounded-lg bg-slate-50 border border-slate-100/80 p-1.5 dark:bg-slate-800/50 dark:border-slate-800">
            <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {d.dimension}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
