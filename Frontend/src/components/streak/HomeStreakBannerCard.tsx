import React from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Zap,
  ShieldCheck,
  Trophy,
  ArrowRight,
  Sparkles,
  Award,
} from "lucide-react";
import { Tooltip, Progress } from "antd";
import { useQuery } from "@tanstack/react-query";
import { streakService } from "../../services/mock/streakService";

export const HomeStreakBannerCard: React.FC = () => {
  const { data: streakData } = useQuery({
    queryKey: ["user-streak-data"],
    queryFn: () => streakService.getStreakData(),
  });

  if (!streakData) return null;

  const next = streakData.nextMilestone;
  const daysLeft = next ? next.daysRequired - streakData.currentStreak : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#8CA9FF]/30 bg-gradient-to-br from-white via-slate-50/70 to-[#8CA9FF]/15 p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80">
      {/* Decorative flame glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-orange-400/20 blur-3xl" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left info */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-orange-400/40 bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-md shadow-orange-500/10 dark:border-orange-500/30">
            <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
            <span className="absolute -bottom-2 rounded-full bg-orange-500 px-1.5 py-0.2 text-[9px] font-black text-white">
              {streakData.streakMultiplier}x XP
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1e3a8a] dark:text-[#8CA9FF]">
                CHUỖI TẬP LUYỆN
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                16 Ngày Bất Bại 🔥
              </span>
            </div>
            <div className="mt-0.5 text-xl font-black text-slate-900 dark:text-white">
              {streakData.currentStreak} Ngày Liên Tiếp
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Mốc tới: <strong>{next?.title} ({next?.daysRequired} ngày)</strong></span>
              <span>•</span>
              <span className="text-[#547EFF] font-semibold">Còn {daysLeft} ngày</span>
            </div>
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Link
            to="/progress?tab=streak"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 hover:brightness-105 active:scale-95 transition-all"
          >
            <Trophy className="h-4 w-4" />
            <span>Xem Mốc & Huy Hiệu</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
