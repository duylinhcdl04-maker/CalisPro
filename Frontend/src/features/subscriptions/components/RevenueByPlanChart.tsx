import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon, Users, ArrowUpRight } from "lucide-react";
import { PlanRevenueDistribution } from "../types/subscription.types";

interface RevenueByPlanChartProps {
  data: PlanRevenueDistribution[];
  onSelectPlan?: (planId: string) => void;
}

export const RevenueByPlanChart: React.FC<RevenueByPlanChartProps> = ({
  data,
  onSelectPlan,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalSubscribers = data.reduce((sum, item) => sum + item.subscribers, 0);

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#172019] dark:text-white flex items-center gap-1.5">
              <PieIcon className="h-4 w-4 text-[#7C9B5B]" />
              <span>Doanh thu theo gói (Revenue by Plan)</span>
            </h3>
            <p className="text-xs text-[#687268] dark:text-zinc-400 mt-0.5">
              Tỷ trọng đóng góp doanh thu của các gói dịch vụ trả phí
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#EEF4E8] px-2.5 py-0.5 text-[11px] font-bold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
            {data.length} gói
          </span>
        </div>

        {/* Layout: Chart & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 pt-1">
          {/* Donut Chart with Center Label */}
          <div className="sm:col-span-5 h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="revenue"
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.4}
                      className="cursor-pointer transition-opacity duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString("vi-VN")} ₫`,
                    "Doanh thu",
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E3E7DF",
                    backgroundColor: "#FFFFFF",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central KPI */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
              <span className="text-[10px] uppercase font-bold text-[#687268] dark:text-zinc-400 tracking-wider">
                {activeItem ? activeItem.planName : "Top 1 Gói"}
              </span>
              <span className="text-base font-black text-[#55733C] dark:text-emerald-400 mt-0.5">
                {activeItem ? `${activeItem.percentage}%` : `${data[0]?.percentage || 0}%`}
              </span>
              <span className="text-[9px] text-[#687268] dark:text-zinc-400 font-medium">
                {activeItem
                  ? `${(activeItem.revenue / 1000000).toFixed(1)} tr ₫`
                  : `${(data[0]?.revenue / 1000000 || 0).toFixed(1)} tr ₫`}
              </span>
            </div>
          </div>

          {/* Plan Breakdown List */}
          <div className="sm:col-span-7 space-y-2.5">
            {data.map((item, index) => {
              const isHovered = hoveredIndex === index;
              return (
                <div
                  key={item.planId}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectPlan && onSelectPlan(item.planId)}
                  className={`group relative overflow-hidden rounded-xl border p-2.5 transition-all cursor-pointer ${
                    isHovered
                      ? "border-[#7C9B5B] bg-[#EEF4E8]/50 shadow-2xs dark:border-emerald-600 dark:bg-emerald-950/30"
                      : "border-[#F0F2ED] bg-[#F7F8F4] hover:border-[#7C9B5B]/50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Left: Indicator & Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#172019] truncate dark:text-white group-hover:text-[#55733C] dark:group-hover:text-emerald-400">
                          {item.planName}
                        </div>
                        <div className="text-[10px] text-[#687268] dark:text-zinc-400 flex items-center gap-1">
                          <Users className="h-3 w-3 inline text-zinc-400" />
                          <span>{item.subscribers.toLocaleString("vi-VN")} học viên</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Percent & Revenue (No Wrapping) */}
                    <div className="text-right shrink-0 whitespace-nowrap pl-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs font-black text-[#172019] dark:text-white">
                          {item.percentage}%
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#55733C] dark:text-emerald-400 block whitespace-nowrap">
                        {(item.revenue / 1000000).toFixed(1)} tr ₫
                      </span>
                    </div>
                  </div>

                  {/* Visual Share Bar */}
                  <div className="mt-2 h-1 w-full bg-black/5 rounded-full overflow-hidden dark:bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Total Summary */}
      <div className="mt-4 pt-3 border-t border-[#F0F2ED] dark:border-zinc-800 flex items-center justify-between text-xs">
        <span className="text-[#687268] dark:text-zinc-400">
          Tổng: <strong className="text-[#172019] dark:text-white">{totalSubscribers.toLocaleString("vi-VN")}</strong> học viên
        </span>
        <span className="font-bold text-[#55733C] dark:text-emerald-400">
          {(totalRevenue / 1000000).toFixed(1)} tr ₫
        </span>
      </div>
    </div>
  );
};
