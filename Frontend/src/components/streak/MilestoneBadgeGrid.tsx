import React, { useState } from "react";
import {
  Flame,
  Zap,
  Shield,
  Sparkles,
  Crown,
  Trophy,
  Award,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  Gift,
} from "lucide-react";
import { StreakMilestoneBadge } from "../../types/streak";

interface MilestoneBadgeGridProps {
  milestones: StreakMilestoneBadge[];
  onSelectBadge: (badge: StreakMilestoneBadge) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Flame,
  Zap,
  Shield,
  Sparkles,
  Crown,
  Trophy,
  Award,
  Star,
};

type FilterType = "all" | "unlocked" | "in_progress" | "locked";

export const MilestoneBadgeGrid: React.FC<MilestoneBadgeGridProps> = ({
  milestones,
  onSelectBadge,
}) => {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = milestones.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  const unlockedCount = milestones.filter((b) => b.status === "unlocked").length;

  return (
    <div className="space-y-5">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Bộ Sưu Tập Huy Hiệu Chuỗi Ngày (Milestones)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chinh phục các mốc ngày tập liên tiếp để mở khóa danh hiệu, nhận XP và đặc quyền độc quyền ({unlockedCount}/{milestones.length} đã đạt).
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 shrink-0">
          {[
            { id: "all", label: `Tất cả (${milestones.length})` },
            { id: "unlocked", label: `Đã đạt (${unlockedCount})` },
            { id: "in_progress", label: "Đang làm" },
            { id: "locked", label: "Chưa mở" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as FilterType)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filter === f.id
                  ? "bg-white text-[#1e3a8a] shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((badge) => {
          const IconComponent = ICON_MAP[badge.iconName] || Award;
          const isUnlocked = badge.status === "unlocked";
          const isInProgress = badge.status === "in_progress";

          return (
            <div
              key={badge.id}
              onClick={() => onSelectBadge(badge)}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 transition-all duration-300 cursor-pointer ${
                isUnlocked
                  ? "border-emerald-400/40 bg-white hover:-translate-y-1 hover:shadow-lg dark:border-emerald-500/30 dark:bg-slate-900 dark:hover:border-emerald-400/50 dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                  : isInProgress
                  ? "border-[#8CA9FF] bg-gradient-to-b from-[#8CA9FF]/10 to-white shadow-md hover:-translate-y-1 hover:shadow-xl dark:border-[#547EFF] dark:from-blue-950/40 dark:to-slate-900 dark:shadow-[0_0_25px_rgba(84,126,255,0.2)]"
                  : "border-slate-200/80 bg-slate-50/70 opacity-75 hover:opacity-100 hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900/60"
              }`}
            >
              {/* Top Row: Milestone Day Pill & Status */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isUnlocked
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-500/30"
                      : isInProgress
                      ? "bg-[#8CA9FF]/20 text-[#1e3a8a] dark:text-[#8CA9FF] dark:bg-blue-950/80 dark:border dark:border-blue-500/30"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  Mốc {badge.daysRequired} Ngày
                </span>

                {isUnlocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Đã mở
                  </span>
                ) : isInProgress ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#547EFF] dark:text-sky-300">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "4s" }} /> {badge.progressPercentage}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Lock className="h-3 w-3" /> Khóa
                  </span>
                )}
              </div>

              {/* Center Emblem */}
              <div className="my-4 flex flex-col items-center text-center">
                <div
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 p-3 shadow-md transition-transform duration-300 group-hover:scale-110"
                  style={{
                    borderColor: isUnlocked
                      ? badge.badgeColor
                      : isInProgress
                      ? "#547EFF"
                      : "rgba(148, 163, 184, 0.25)",
                    background: isUnlocked
                      ? `radial-gradient(circle, ${badge.badgeColor}25 0%, transparent 80%)`
                      : isInProgress
                      ? "radial-gradient(circle, rgba(84, 126, 255, 0.2) 0%, transparent 80%)"
                      : "rgba(100, 116, 139, 0.08)",
                    color: isUnlocked ? badge.badgeColor : isInProgress ? "#547EFF" : "#64748B",
                  }}
                >
                  <IconComponent className="h-10 w-10 transition-transform group-hover:rotate-6 drop-shadow-sm" />
                </div>

                <h4 className="mt-3 font-display text-base font-black text-slate-900 dark:text-white">
                  {badge.title}
                </h4>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {badge.description}
                </p>
              </div>

              {/* Bottom Progress or Unlocked info */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                {isUnlocked ? (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{badge.unlockedAt}</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                      +{badge.rewardXp} XP
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{badge.currentDays}/{badge.daysRequired} Ngày</span>
                      <span className="text-amber-600 dark:text-amber-400">+{badge.rewardXp} XP</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8CA9FF] to-[#547EFF]"
                        style={{ width: `${badge.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
