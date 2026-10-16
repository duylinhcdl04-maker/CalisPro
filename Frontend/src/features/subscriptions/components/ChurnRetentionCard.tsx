import React from "react";
import { UserMinus, ArrowDownRight, ShieldAlert } from "lucide-react";
import { ChurnReasonItem } from "../types/subscription.types";

interface ChurnRetentionCardProps {
  churnRate?: number;
  retentionRate?: number;
  reasons: ChurnReasonItem[];
}

export const ChurnRetentionCard: React.FC<ChurnRetentionCardProps> = ({
  churnRate = 5.8,
  retentionRate = 94.2,
  reasons,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-orange-50 p-2 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <UserMinus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Churn & Retention (Duy trì & Tỷ lệ hủy)
              </h3>
              <p className="text-xs text-[#687268] dark:text-zinc-400">
                Tỷ lệ giữ chân người dùng và nguyên nhân hủy gói hội viên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              Retention {retentionRate}%
            </span>
            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
              Churn {churnRate}%
            </span>
          </div>
        </div>

        {/* Churn Reasons Bar List */}
        <div className="mt-5 space-y-3">
          <span className="text-xs font-bold text-[#172019] uppercase tracking-wider block dark:text-zinc-300">
            Lý do hủy gia hạn phổ biến (Khảo sát người dùng)
          </span>

          {reasons.map((item) => (
            <div key={item.reason} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#172019] dark:text-zinc-200">{item.reason}</span>
                <span className="font-black text-[#172019] dark:text-white">
                  {item.percentage}% <span className="font-normal text-zinc-400">({item.count} lượt)</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E3E7DF] dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#E07A5F]"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
