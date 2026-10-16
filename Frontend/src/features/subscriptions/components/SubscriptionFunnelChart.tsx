import React from "react";
import { Filter, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { SubscriptionFunnelStep } from "../types/subscription.types";

interface SubscriptionFunnelChartProps {
  funnelData: SubscriptionFunnelStep[];
  onViewExpiringTrials?: () => void;
}

export const SubscriptionFunnelChart: React.FC<SubscriptionFunnelChartProps> = ({
  funnelData,
  onViewExpiringTrials,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-[#EEF4E8] p-2 text-[#55733C] dark:bg-emerald-950/40 dark:text-emerald-300">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172019] dark:text-white">
                  Phễu chuyển đổi (Trial → Paid Conversion)
                </h3>
                <p className="text-xs text-[#687268] dark:text-zinc-400">
                  Hành trình từ đăng ký dùng thử 7 ngày đến hội viên trả phí duy trì
                </p>
              </div>
            </div>
          </div>

          {onViewExpiringTrials && (
            <button
              onClick={onViewExpiringTrials}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#55733C] hover:underline dark:text-emerald-400"
            >
              <span>Xem danh sách Trial sắp hết hạn</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Funnel Step Bars */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {funnelData.map((step, idx) => {
            const stepWidth = Math.max(25, 100 - idx * 22);
            return (
              <div
                key={step.stepName}
                className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-[#F7F8F4] p-4 relative overflow-hidden transition-all hover:border-[#7C9B5B]/60 dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                {/* Background Progress bar */}
                <div
                  className="absolute bottom-0 left-0 top-0 bg-[#EEF4E8]/60 -z-0 rounded-2xl dark:bg-emerald-950/20"
                  style={{ width: `${stepWidth}%` }}
                />

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#687268] dark:text-zinc-400">
                      BƯỚC 0{idx + 1}
                    </span>
                    {idx > 0 && (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {step.conversionRate}%
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xl font-black text-[#172019] dark:text-white">
                      {step.count.toLocaleString()}
                    </div>
                    <div className="text-xs font-semibold text-[#687268] dark:text-zinc-300 mt-0.5 leading-snug">
                      {step.label}
                    </div>
                  </div>
                </div>

                {idx < funnelData.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white p-1 shadow-sm border border-[#E3E7DF] text-[#7C9B5B] dark:bg-zinc-800 dark:border-zinc-700">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Funnel Metrics Summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F2ED] pt-3 text-xs text-[#687268] dark:border-zinc-800 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span>Tỷ lệ hoàn thành Trial: <strong className="text-[#172019] dark:text-white">42.0%</strong></span>
            <span>•</span>
            <span>Tỷ lệ nâng cấp Paid: <strong className="text-[#55733C] dark:text-emerald-400">31.0%</strong></span>
          </div>
          <div className="font-semibold text-[#172019] dark:text-white">
            Tỷ lệ thành công toàn phễu: <strong className="text-[#55733C] dark:text-emerald-400">10.8%</strong> (1,084 / 10,000 users)
          </div>
        </div>
      </div>
    </div>
  );
};
