import React from "react";
import {
  Flame,
  ShieldCheck,
  Zap,
  Sparkles,
  Trophy,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";
import { Tooltip } from "antd";
import { StreakData } from "../../types/streak";

interface StreakSummaryCardProps {
  data: StreakData;
  onViewAllBadges?: () => void;
}

export const StreakSummaryCard: React.FC<StreakSummaryCardProps> = ({
  data,
  onViewAllBadges,
}) => {
  const next = data.nextMilestone;
  const daysLeft = next ? next.daysRequired - data.currentStreak : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#8CA9FF]/30 bg-gradient-to-br from-white via-slate-50/70 to-[#8CA9FF]/10 p-6 md:p-8 shadow-[0_10px_30px_rgba(140,169,255,0.15)] dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800">
      {/* Decorative ambient backdrop */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-orange-400/15 via-[#8CA9FF]/20 to-transparent blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side: Fire Emblem & Big Streak Counter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-orange-400/40 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-600/10 shadow-lg shadow-orange-500/20 dark:border-orange-500/30">
            {/* Animated Ring */}
            <span className="absolute inset-0 rounded-3xl animate-pulse bg-orange-400/10" />
            <Flame className="h-12 w-12 text-orange-500 animate-bounce" style={{ animationDuration: "2s" }} />

            {/* Multiplier pill */}
            <span className="absolute -bottom-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
              {data.streakMultiplier}x XP
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#8CA9FF]/15 px-3 py-0.5 text-xs font-extrabold text-[#1e3a8a] dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
                🔥 CHUỖI TẬP HIỆN TẠI
              </span>
              {data.todayCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Hôm nay đã tập
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                {data.currentStreak}
              </h2>
              <span className="text-lg font-bold text-slate-500 dark:text-slate-400">
                ngày liên tiếp
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>🏆 Kỷ lục: <strong className="text-slate-800 dark:text-slate-200">{data.longestStreak} ngày</strong></span>
              <span>•</span>
              <Tooltip title="Khiên tự động bảo vệ chuỗi ngày nếu bạn có việc đột xuất nghỉ 1 ngày">
                <span className="inline-flex items-center gap-1 cursor-help text-[#547EFF] hover:underline">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {data.freezesRemaining}/{data.freezesMax} Khiên bảo vệ
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Right Side: Next Milestone Progress Bar & CTA */}
        {next && (
          <div className="w-full lg:max-w-xs rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mốc tiếp theo
              </span>
              <span className="rounded-full bg-[#8CA9FF]/20 px-2 py-0.5 text-[10px] font-black text-[#1e3a8a] dark:text-[#8CA9FF]">
                {next.daysRequired} Ngày
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {next.title}
              </span>
              <span className="text-xs font-black text-[#547EFF]">
                Còn {daysLeft} ngày
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] transition-all duration-500"
                style={{ width: `${(data.currentStreak / next.daysRequired) * 100}%` }}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Thưởng: <strong className="text-amber-600 dark:text-amber-400">+{next.rewardXp} XP</strong></span>
              {onViewAllBadges && (
                <button
                  onClick={onViewAllBadges}
                  className="inline-flex items-center gap-1 font-bold text-[#547EFF] hover:underline"
                >
                  Xem mốc <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7-Day Weekly Momentum Row */}
      <div className="mt-6 border-t border-slate-200/60 pt-5 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Nhật ký tuần này (7 ngày gần nhất)
          </span>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> 100% Hoàn thành
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {data.weeklyDays.map((day) => {
            return (
              <Tooltip
                key={day.fullDate}
                title={
                  <div className="text-xs p-1">
                    <div className="font-bold">{day.displayDate} - {day.dayName}</div>
                    {day.workoutTitle && <div className="text-slate-200">{day.workoutTitle}</div>}
                    {day.durationMinutes && (
                      <div className="text-slate-400">{day.durationMinutes} phút • {day.caloriesBurned} kcal</div>
                    )}
                    {day.isRestDay && <div className="text-amber-300">Phục hồi tích cực</div>}
                  </div>
                }
              >
                <div
                  className={`flex flex-col items-center justify-center rounded-2xl p-2.5 sm:p-3 text-center transition-all cursor-pointer ${
                    day.isToday
                      ? "ring-2 ring-[#547EFF] bg-white dark:bg-slate-800 shadow-md scale-105"
                      : day.isCompleted
                      ? "bg-[#8CA9FF]/15 border border-[#8CA9FF]/30 text-slate-800 dark:bg-[#8CA9FF]/10 dark:text-slate-200 hover:bg-[#8CA9FF]/25"
                      : "bg-slate-100 dark:bg-slate-800/40 text-slate-400"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {day.dayName}
                  </span>
                  <div className="my-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs">
                    <Flame className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                    {day.displayDate}
                  </span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};
