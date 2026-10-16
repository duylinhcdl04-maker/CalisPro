import React from "react";
import { Users, TrendingUp, Wallet, RefreshCw, ArrowUpRight } from "lucide-react";
import { SubscriptionMainKPIs } from "../types/subscription.types";

interface SubscriptionMainKPICardsProps {
  kpis?: SubscriptionMainKPIs;
  isLoading?: boolean;
}

export const SubscriptionMainKPICards: React.FC<SubscriptionMainKPICardsProps> = ({
  kpis,
  isLoading,
}) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[128px] animate-pulse rounded-[18px] border border-[#E3E7DF] bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "active-subs",
      label: "HỘI VIÊN ĐANG HOẠT ĐỘNG",
      value: kpis.activeSubscribers.toLocaleString(),
      subtext: `+${kpis.activeSubscribersGrowth}% so với tháng trước`,
      icon: Users,
      iconBg: "bg-[#EEF4E8] text-[#55733C] dark:bg-emerald-950/40 dark:text-emerald-300",
      trendText: `+${kpis.activeSubscribersGrowth}%`,
      trendPositive: true,
    },
    {
      id: "mrr",
      label: "MRR (DOANH THU ĐỊNH KỲ)",
      value: `${(kpis.mrr / 1000000).toLocaleString()} tr`,
      formattedFull: `${kpis.mrr.toLocaleString()}đ`,
      subtext: `+${kpis.mrrGrowth}% so với tháng trước`,
      icon: TrendingUp,
      iconBg: "bg-emerald-50 text-[#7C9B5B] dark:bg-emerald-950/40 dark:text-emerald-400",
      trendText: `+${kpis.mrrGrowth}%`,
      trendPositive: true,
    },
    {
      id: "revenue-month",
      label: "DOANH THU THÁNG NÀY",
      value: `${(kpis.revenueThisMonth / 1000000).toLocaleString()} tr`,
      formattedFull: `${kpis.revenueThisMonth.toLocaleString()}đ`,
      subtext: `+${kpis.revenueGrowth}% so với tháng trước`,
      icon: Wallet,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      trendText: `+${kpis.revenueGrowth}%`,
      trendPositive: true,
    },
    {
      id: "renewal-rate",
      label: "TỈ LỆ GIA HẠN",
      value: `${kpis.renewalRate}%`,
      subtext: `+${kpis.renewalGrowth}% so với tháng trước`,
      icon: RefreshCw,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
      trendText: `+${kpis.renewalGrowth}%`,
      trendPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="group relative flex flex-col justify-between rounded-[18px] border border-[#E3E7DF] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7C9B5B]/50 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-[#687268] uppercase dark:text-zinc-400">
                  {c.label}
                </span>
                <div
                  className="mt-1.5 text-2xl font-black tracking-tight text-[#172019] dark:text-white"
                  title={c.formattedFull || c.value}
                >
                  {c.value}
                </div>
              </div>
              <div className={`rounded-xl p-2.5 ${c.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#F0F2ED] pt-3 dark:border-zinc-800/80">
              <span className="text-xs text-[#687268] dark:text-zinc-400">{c.subtext}</span>
              {c.trendText && (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  {c.trendText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
