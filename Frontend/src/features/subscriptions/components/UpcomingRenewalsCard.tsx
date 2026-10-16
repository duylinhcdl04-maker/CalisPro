import React from "react";
import { CalendarClock, AlertCircle, CheckCircle2, ChevronRight, BellRing } from "lucide-react";
import { UpcomingRenewalItem } from "../types/subscription.types";

interface UpcomingRenewalsCardProps {
  renewals: UpcomingRenewalItem[];
  onRemindUser?: (renewal: UpcomingRenewalItem) => void;
  onViewAll?: () => void;
}

export const UpcomingRenewalsCard: React.FC<UpcomingRenewalsCardProps> = ({
  renewals,
  onRemindUser,
  onViewAll,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Gia hạn sắp tới (7 ngày tới)
              </h3>
              <p className="text-xs text-[#687268] dark:text-zinc-400">
                382 học viên đến hạn gia hạn kỳ tiếp theo
              </p>
            </div>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#55733C] hover:underline dark:text-emerald-400"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Table list */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0F2ED] text-[#687268] dark:border-zinc-800 dark:text-zinc-400">
                <th className="pb-2.5 font-semibold">Học viên</th>
                <th className="pb-2.5 font-semibold">Gói</th>
                <th className="pb-2.5 font-semibold text-center">Ngày gia hạn</th>
                <th className="pb-2.5 font-semibold text-center">Auto-Renewal</th>
                <th className="pb-2.5 font-semibold text-right">Số tiền</th>
                <th className="pb-2.5 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2ED] dark:divide-zinc-800">
              {renewals.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F8F4] dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2.5">
                    <div className="font-bold text-[#172019] dark:text-white">{item.userName}</div>
                    <div className="text-[11px] text-[#687268] dark:text-zinc-400">{item.userEmail}</div>
                  </td>
                  <td className="py-2.5 font-semibold text-[#172019] dark:text-zinc-200">
                    {item.planName}
                  </td>
                  <td className="py-2.5 text-center">
                    <div className="font-bold text-[#172019] dark:text-white">{item.renewalDate}</div>
                    {item.daysRemaining <= 1 ? (
                      <span className="rounded-md bg-rose-50 px-1.5 py-0.2 text-[9px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        Trong 24h
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400">Còn {item.daysRemaining} ngày</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    {item.autoRenewal ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        BẬT (ON)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        <AlertCircle className="h-3 w-3" />
                        TẮT (OFF)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[#172019] dark:text-white">
                    {item.amount.toLocaleString()}đ
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => onRemindUser && onRemindUser(item)}
                      title="Gửi email/thông báo nhắc nhở"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E3E7DF] bg-white px-2 py-1 text-[11px] font-semibold text-[#172019] hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      <BellRing className="h-3 w-3 text-[#7C9B5B]" />
                      Nhắc
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
