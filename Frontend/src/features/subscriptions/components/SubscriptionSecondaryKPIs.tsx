import React from "react";
import { UserCheck, Sparkles, UserMinus, CalendarClock, Coins } from "lucide-react";
import { SubscriptionSecondaryKPIs as ISubscriptionSecondaryKPIs } from "../types/subscription.types";

interface SubscriptionSecondaryKPIsProps {
  secondaryKPIs?: ISubscriptionSecondaryKPIs;
  isLoading?: boolean;
}

export const SubscriptionSecondaryKPIs: React.FC<SubscriptionSecondaryKPIsProps> = ({
  secondaryKPIs,
  isLoading,
}) => {
  if (isLoading || !secondaryKPIs) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-[#E3E7DF] bg-white dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Active Trials (Dùng thử)",
      value: secondaryKPIs.activeTrials.toLocaleString(),
      subtext: "Đang trong 7 ngày Free",
      icon: UserCheck,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Trial → Paid Chuyển đổi",
      value: `${secondaryKPIs.trialToPaidConversion}%`,
      subtext: "Tỷ lệ nâng cấp gói",
      icon: Sparkles,
      color: "text-[#55733C]",
      bg: "bg-[#EEF4E8] dark:bg-emerald-950/40",
    },
    {
      label: "Churn Rate (Tỷ lệ hủy)",
      value: `${secondaryKPIs.churnRate}%`,
      subtext: "Duy trì giữ chân 94.2%",
      icon: UserMinus,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/40",
    },
    {
      label: "Gia hạn trong 7 ngày tới",
      value: `${secondaryKPIs.upcomingRenewalsCount} học viên`,
      subtext: "342 Auto-Renew ON",
      icon: CalendarClock,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      label: "Doanh thu dự kiến đến hạn",
      value: `${(secondaryKPIs.expectedRenewalRevenue / 1000000).toLocaleString()} tr`,
      formattedFull: `${secondaryKPIs.expectedRenewalRevenue.toLocaleString()}đ`,
      subtext: "Dự kiến 7 ngày tới",
      icon: Coins,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it, idx) => {
        const Icon = it.icon;
        return (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-2xl border border-[#E3E7DF] bg-white p-3.5 shadow-2xs transition-all hover:border-[#7C9B5B]/40 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className={`rounded-xl p-2.5 shrink-0 ${it.bg} ${it.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#687268] block truncate dark:text-zinc-400">
                {it.label}
              </span>
              <div
                className="mt-0.5 text-base font-extrabold text-[#172019] dark:text-white truncate"
                title={it.formattedFull || it.value}
              >
                {it.value}
              </div>
              <span className="text-[10px] text-[#687268] block truncate dark:text-zinc-400">
                {it.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
