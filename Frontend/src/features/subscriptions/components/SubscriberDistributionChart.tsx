import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Users, Sparkles } from "lucide-react";
import { PlanSubscriberDistribution } from "../types/subscription.types";

interface SubscriberDistributionChartProps {
  data: PlanSubscriberDistribution[];
  totalSubscribers?: number;
}

export const SubscriberDistributionChart: React.FC<SubscriberDistributionChartProps> = ({
  data,
  totalSubscribers = 4281,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#172019] dark:text-white flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#7C9B5B]" />
              <span>Phân bổ hội viên theo gói</span>
            </h3>
            <p className="text-xs text-[#687268] dark:text-zinc-400">
              Cơ cấu toàn bộ người dùng đang trải nghiệm Trial & Paid
            </p>
          </div>
          <span className="rounded-full bg-[#EEF4E8] px-2.5 py-0.5 text-xs font-bold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
            {totalSubscribers.toLocaleString()} Tổng
          </span>
        </div>

        {/* Donut & List */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
          <div className="sm:col-span-5 h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="subscribers"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-sub-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} học viên`, "Số lượng"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E3E7DF",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-[#687268] font-bold uppercase dark:text-zinc-400">
                Tổng Active
              </span>
              <span className="text-sm font-black text-[#172019] dark:text-white">
                4,281
              </span>
            </div>
          </div>

          <div className="sm:col-span-7 space-y-2">
            {data.map((item) => (
              <div
                key={item.planId}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#F0F2ED] bg-[#F7F8F4] dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-[#172019] dark:text-white">
                      {item.planName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-[#172019] dark:text-white">
                    {item.percentage}%
                  </span>
                  <span className="block text-[10px] text-[#687268] dark:text-zinc-400">
                    {item.subscribers.toLocaleString()} users
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
