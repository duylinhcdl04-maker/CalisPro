import React from "react";
import { Bot, Sparkles, AlertTriangle, ArrowUpRight, ShieldCheck } from "lucide-react";
import { AIMotionSummary } from "../types/performance.types";

interface AIMotionPerformanceCardProps {
  summary?: AIMotionSummary;
}

export const AIMotionPerformanceCard: React.FC<AIMotionPerformanceCardProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                AI Motion Performance
              </h3>
              <p className="text-xs text-[#687268] dark:text-zinc-400">
                Chất lượng kỹ thuật động tác qua phân tích camera AI
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            <Sparkles className="h-3 w-3" />
            AI Vision 99.9%
          </span>
        </div>

        {/* Hero Score Badge */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F7F8F4] p-3.5 dark:bg-zinc-800/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#687268] dark:text-zinc-400">
              Điểm Form trung bình (Toàn hệ thống)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#172019] dark:text-white">
                {summary.averageFormScore}
              </span>
              <span className="text-xs text-zinc-400">/ 100 điểm</span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{summary.formScoreGrowth}%
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-[#8CA9FF]/15 px-3 py-1.5 text-center text-xs font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
            Đạt chuẩn kỹ thuật
          </div>
        </div>

        {/* Exercise Form Score Bars */}
        <div className="mt-4 space-y-2.5">
          {summary.exercises.map((ex) => (
            <div key={ex.exerciseName}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#172019] dark:text-zinc-200">
                  {ex.exerciseName}
                </span>
                <span className="font-bold text-[#172019] dark:text-white">
                  {ex.formScore} <span className="font-normal text-zinc-400">/100</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E3E7DF]/70 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#5B86C5] transition-all duration-500"
                  style={{ width: `${ex.formScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Common Form Issues */}
        <div className="mt-4 border-t border-[#F0F2ED] pt-3 dark:border-zinc-800">
          <span className="flex items-center gap-1 text-xs font-bold text-[#172019] dark:text-white">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Lỗi kỹ thuật phổ biến nhất (AI quét được):
          </span>
          <div className="mt-2 space-y-1.5">
            {summary.commonIssues.slice(0, 3).map((iss) => (
              <div
                key={iss.issueName}
                className="flex items-center justify-between text-[11px] rounded-lg bg-[#FAFBF9] p-2 dark:bg-zinc-800/40"
              >
                <span className="text-[#172019] dark:text-zinc-200">{iss.issueName}</span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  {iss.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
