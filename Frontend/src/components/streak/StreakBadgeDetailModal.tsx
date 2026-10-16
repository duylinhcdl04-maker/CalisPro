import React from "react";
import {
  X,
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
  Gift,
  Share2,
  Calendar,
  Layers,
} from "lucide-react";
import { StreakMilestoneBadge } from "../../types/streak";
import { toast } from "sonner";

interface StreakBadgeDetailModalProps {
  badge: StreakMilestoneBadge | null;
  isOpen: boolean;
  onClose: () => void;
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

export const StreakBadgeDetailModal: React.FC<StreakBadgeDetailModalProps> = ({
  badge,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !badge) return null;

  const IconComponent = ICON_MAP[badge.iconName] || Award;
  const isUnlocked = badge.status === "unlocked";
  const isInProgress = badge.status === "in_progress";

  const handleShare = () => {
    navigator.clipboard?.writeText(
      `Tôi vừa chinh phục mốc "${badge.title}" (${badge.daysRequired} ngày Streak) trên CalisPro! 🔥`
    );
    toast.success("Đã sao chép liên kết thành tích để chia sẻ!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Ambient Top Glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: badge.badgeColor }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Badge 3D Emblem Container */}
        <div className="relative mt-2 flex flex-col items-center text-center">
          <div
            className={`relative flex h-28 w-28 items-center justify-center rounded-3xl border-2 p-4 shadow-xl transition-transform duration-300 hover:scale-105 ${badge.borderColor} bg-gradient-to-br ${badge.gradient}`}
          >
            {/* Pulsating background ring if unlocked */}
            {isUnlocked && (
              <span
                className="absolute inset-0 rounded-3xl animate-ping opacity-20"
                style={{ backgroundColor: badge.badgeColor }}
              />
            )}

            <IconComponent className="h-14 w-14" />

            {/* Status Ribbon Tag */}
            <span
              className={`absolute -bottom-3 rounded-full px-3 py-0.5 text-[11px] font-black uppercase tracking-wider shadow-md ${
                isUnlocked
                  ? "bg-emerald-500 text-white"
                  : isInProgress
                  ? "bg-[#547EFF] text-white"
                  : "bg-slate-600 text-slate-200"
              }`}
            >
              {isUnlocked ? "Đã đạt" : isInProgress ? `${badge.progressPercentage}%` : "Chưa mở"}
            </span>
          </div>

          <div className="mt-6 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mốc {badge.daysRequired} Ngày Streak • Hạng {badge.tier.toUpperCase()}
            </span>
            <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white">
              {badge.title}
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {badge.description}
            </p>
          </div>

          {/* Lore quote */}
          <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 text-xs italic text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
            "{badge.lore}"
          </div>

          {/* Progress Bar (if in progress or locked) */}
          {!isUnlocked && (
            <div className="mt-4 w-full space-y-1.5 text-left">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Tiến độ chinh phục:</span>
                <span className="text-[#547EFF] font-black">
                  {badge.currentDays} / {badge.daysRequired} Ngày
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] transition-all duration-500"
                  style={{ width: `${badge.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Rewards Section */}
          <div className="mt-5 w-full space-y-2 rounded-2xl border border-[#8CA9FF]/20 bg-gradient-to-r from-[#8CA9FF]/10 to-[#547EFF]/10 p-3.5 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a] dark:text-[#8CA9FF]">
              <Gift className="h-4 w-4 text-[#547EFF]" />
              Phần Thưởng Khi Đạt Mốc:
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="rounded-xl bg-white/80 p-2 dark:bg-slate-800/80">
                <span className="block text-[10px] text-slate-400 font-semibold">Kinh nghiệm</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  +{badge.rewardXp} XP
                </span>
              </div>
              <div className="rounded-xl bg-white/80 p-2 dark:bg-slate-800/80">
                <span className="block text-[10px] text-slate-400 font-semibold">Danh hiệu</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                  {badge.rewardTitle}
                </span>
              </div>
            </div>
            <div className="pt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              ✨ Đặc quyền: <span className="font-normal">{badge.specialPerk}</span>
            </div>
          </div>

          {/* Unlocked date info or action */}
          <div className="mt-5 flex w-full items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            {isUnlocked ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Đạt được ngày: {badge.unlockedAt}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Lock className="h-4 w-4" />
                Cần thêm {badge.daysRequired - badge.currentDays} ngày tập luyện
              </div>
            )}

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              Chia sẻ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
