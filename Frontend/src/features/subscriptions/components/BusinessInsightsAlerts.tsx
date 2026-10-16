import React from "react";
import { Sparkles, AlertTriangle, TrendingUp, Info, ChevronRight, ArrowUpRight } from "lucide-react";
import { BusinessInsightItem } from "../types/subscription.types";

interface BusinessInsightsAlertsProps {
  insights: BusinessInsightItem[];
  onActionClick?: (item: BusinessInsightItem) => void;
}

export const BusinessInsightsAlerts: React.FC<BusinessInsightsAlertsProps> = ({
  insights,
  onActionClick,
}) => {
  return (
    <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-[#EEF4E8] p-2 text-[#55733C] dark:bg-emerald-950/50 dark:text-emerald-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#172019] dark:text-white">
              Phân tích thông minh & Cảnh báo (Business Insights & Alerts)
            </h3>
            <p className="text-xs text-[#687268] dark:text-zinc-400">
              Gợi ý hành động thực tế dựa trên dữ liệu doanh thu và chu kỳ người dùng
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item) => {
          const isWarning = item.type === "warning";
          const isPositive = item.type === "positive";

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 shadow-2xs hover:shadow-sm ${
                isWarning
                  ? "border-amber-200 bg-amber-50/40 hover:border-amber-400 dark:border-amber-900/60 dark:bg-amber-950/20"
                  : isPositive
                  ? "border-emerald-200 bg-[#EEF4E8]/40 hover:border-[#7C9B5B] dark:border-emerald-900/60 dark:bg-emerald-950/20"
                  : "border-blue-200 bg-blue-50/30 hover:border-blue-400 dark:border-blue-900/60 dark:bg-blue-950/20"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isWarning
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                        : isPositive
                        ? "bg-[#EEF4E8] text-[#55733C] dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                    }`}
                  >
                    {isWarning ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                  </div>
                  <h4
                    className={`text-xs font-bold leading-snug ${
                      isWarning
                        ? "text-amber-950 dark:text-amber-200"
                        : isPositive
                        ? "text-[#172019] dark:text-emerald-200"
                        : "text-[#172019] dark:text-blue-200"
                    }`}
                  >
                    {item.title}
                  </h4>
                </div>

                <p className="text-xs text-[#687268] leading-relaxed dark:text-zinc-300 pl-0.5">
                  {item.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                <button
                  onClick={() => onActionClick && onActionClick(item)}
                  className={`inline-flex items-center gap-1 text-xs font-bold transition-all hover:translate-x-0.5 ${
                    isWarning
                      ? "text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100"
                      : isPositive
                      ? "text-[#55733C] hover:text-[#3e562a] dark:text-emerald-400 dark:hover:text-emerald-300"
                      : "text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
                  }`}
                >
                  <span>{item.actionText}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
