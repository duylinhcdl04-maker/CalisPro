import React from "react";
import { Check, X, Sparkles, Users, TrendingUp, Edit3, MoreHorizontal, ShieldCheck, Eye } from "lucide-react";
import { SubscriptionPlan } from "../types/subscription.types";
import { BILLING_CYCLE_LABELS } from "../constants/subscription.constants";

interface PlanCardsGridProps {
  plans: SubscriptionPlan[];
  onEditPlan: (plan: SubscriptionPlan) => void;
  onViewPlanDetails?: (plan: SubscriptionPlan) => void;
}

export const PlanCardsGrid: React.FC<PlanCardsGridProps> = ({
  plans,
  onEditPlan,
  onViewPlanDetails,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {plans.map((plan) => {
        const isPopular = plan.badge === "POPULAR";
        const isBestValue = plan.badge === "BEST_VALUE";
        const isTrial = plan.billingCycle === "TRIAL";

        return (
          <div
            key={plan.id}
            className={`flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition-all relative ${
              isPopular
                ? "border-[#7C9B5B] ring-2 ring-[#7C9B5B]/20 dark:border-emerald-700"
                : isBestValue
                ? "border-amber-300 ring-2 ring-amber-300/30 dark:border-amber-700"
                : "border-[#E3E7DF] dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            {/* Top Badge */}
            {isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7C9B5B] px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
                ★ Phổ biến nhất (Most Popular)
              </span>
            )}
            {isBestValue && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
                ⚡ Giá tốt nhất (Best Value)
              </span>
            )}

            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#172019] dark:text-white">
                    {plan.name}
                  </h3>
                  <span className="text-xs font-mono text-zinc-400 block mt-0.5">
                    {plan.code}
                  </span>
                </div>
                <button
                  onClick={() => onEditPlan(plan)}
                  title="Chỉnh sửa gói"
                  className="rounded-xl p-1.5 text-zinc-400 hover:bg-[#EEF4E8] hover:text-[#55733C] transition-colors dark:hover:bg-zinc-800"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>

              {/* Price & Billing */}
              <div className="mt-4 pb-4 border-b border-[#F0F2ED] dark:border-zinc-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#172019] dark:text-white">
                    {plan.price === 0 ? "0đ" : `${plan.price.toLocaleString()}đ`}
                  </span>
                  <span className="text-xs text-[#687268] dark:text-zinc-400">
                    / {BILLING_CYCLE_LABELS[plan.billingCycle]}
                  </span>
                </div>
                {plan.annualSavingsText && (
                  <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1.5 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {plan.annualSavingsText}
                  </span>
                )}
              </div>

              {/* Stats snapshot */}
              <div className="grid grid-cols-2 gap-2 my-4 text-xs">
                <div className="p-2 rounded-xl bg-[#F7F8F4] dark:bg-zinc-800/60">
                  <span className="text-[10px] text-[#687268] block dark:text-zinc-400">Hội viên</span>
                  <span className="font-bold text-[#172019] dark:text-white">
                    {plan.subscriberCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#F7F8F4] dark:bg-zinc-800/60">
                  <span className="text-[10px] text-[#687268] block dark:text-zinc-400">
                    {isTrial ? "Conversion" : "MRR đóng góp"}
                  </span>
                  <span className="font-bold text-[#55733C] dark:text-emerald-400">
                    {isTrial ? `${plan.trialConversionRate}%` : `${(plan.mrr / 1000000).toFixed(1)} tr`}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2 mt-4 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#687268] block dark:text-zinc-400">
                  Tính năng bao gồm:
                </span>
                {plan.features.map((f) => (
                  <div key={f.id} className="flex items-start gap-2 text-xs">
                    {f.included ? (
                      <Check className="h-4 w-4 text-[#7C9B5B] shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5 dark:text-zinc-600" />
                    )}
                    <span
                      className={`leading-snug ${
                        f.included
                          ? "text-[#172019] dark:text-zinc-200"
                          : "text-zinc-400 line-through dark:text-zinc-600"
                      }`}
                    >
                      {f.name}
                      {f.limitLabel && (
                        <span className="text-[10px] font-semibold text-[#55733C] ml-1 bg-[#EEF4E8] px-1.5 py-0.2 rounded dark:bg-emerald-950/60 dark:text-emerald-300">
                          ({f.limitLabel})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-[#F0F2ED] flex items-center gap-2 dark:border-zinc-800">
              <button
                onClick={() => onEditPlan(plan)}
                className="flex-1 rounded-xl bg-[#7C9B5B] hover:bg-[#55733C] py-2 text-xs font-bold text-white shadow-2xs transition-colors"
              >
                Chỉnh sửa gói
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
