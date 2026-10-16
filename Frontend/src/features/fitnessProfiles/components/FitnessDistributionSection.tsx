import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, ShieldCheck } from "lucide-react";
import { FitnessLevelDistribution } from "../types/fitnessProfile";

interface FitnessDistributionSectionProps {
  distribution: FitnessLevelDistribution[];
  globalDimensions: {
    dimension: string;
    label: string;
    score: number;
    trend: number;
    color: string;
  }[];
  onSelectLevel?: (level: string) => void;
  onSelectDimension?: (dimension: string) => void;
}

export const FitnessDistributionSection: React.FC<FitnessDistributionSectionProps> = ({
  distribution,
  globalDimensions,
  onSelectLevel,
  onSelectDimension,
}) => {
  const totalStudents = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT: Phân bố cấp độ thể lực (Donut Chart) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Phân bố cấp độ thể lực
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân loại học viên theo chuẩn Fitness Score
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#8CA9FF]/15 px-2.5 py-1 text-[11px] font-semibold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
              Chuẩn CalisHealth
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
            {/* Donut Chart with Center Text */}
            <div className="relative flex h-[190px] items-center justify-center sm:col-span-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="count"
                    cursor="pointer"
                    onClick={(entry: any) => onSelectLevel && onSelectLevel(entry?.level || entry?.name)}
                  >
                    {distribution.map((entry) => (
                      <Cell key={entry.level} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => [
                      `${Number(value).toLocaleString()} học viên`,
                      "Số lượng",
                    ]}
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderRadius: "10px",
                      border: "1px solid #334155",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {totalStudents.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Học viên
                </span>
              </div>
            </div>

            {/* Legend breakdown list */}
            <div className="space-y-2 sm:col-span-6">
              {distribution.map((item) => (
                <div
                  key={item.level}
                  onClick={() => onSelectLevel && onSelectLevel(item.level)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-2 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="w-9 text-right text-xs font-bold text-slate-900 dark:text-white">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Fitness Dimensions (6 Horizontal Progress Bars) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Fitness Dimensions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Điểm thể chất trung bình theo 6 chỉ số nền tảng
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Activity className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
              Thang điểm 100
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {globalDimensions.map((dim) => {
              const isPositive = dim.trend >= 0;
              return (
                <div
                  key={dim.dimension}
                  onClick={() => onSelectDimension && onSelectDimension(dim.dimension)}
                  className="group cursor-pointer rounded-xl p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {dim.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {dim.score} <span className="text-[11px] font-normal text-slate-400">/ 100</span>
                      </span>

                      <span
                        className={`inline-flex items-center text-[11px] font-semibold ${
                          isPositive
                            ? "text-[#547EFF] dark:text-[#8CA9FF]"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="mr-0.5 h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="mr-0.5 h-3 w-3" />
                        )}
                        {isPositive ? `+${dim.trend}%` : `${dim.trend}%`}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:opacity-90"
                      style={{
                        width: `${dim.score}%`,
                        backgroundColor: dim.color || "#547EFF",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
