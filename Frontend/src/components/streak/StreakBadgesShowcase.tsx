import React, { useState } from "react";
import { Flame, Star, Sparkles, Trophy, CheckCircle2, Lock, X, ChevronRight, Award } from "lucide-react";
import { BadgeSticker } from "./BadgeSticker";
import {
  STREAK_MILESTONES,
  SPECIAL_SKILL_BADGES,
  StreakBadgeItem,
} from "../../services/mock/streakBadgesData";
import { toast } from "sonner";

export const StreakBadgesShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"streak" | "skills">("streak");
  const [selectedBadge, setSelectedBadge] = useState<StreakBadgeItem | null>(null);

  const unlockedCount =
    STREAK_MILESTONES.filter((b) => b.isUnlocked).length +
    SPECIAL_SKILL_BADGES.filter((b) => b.isUnlocked).length;
  const totalBadges = STREAK_MILESTONES.length + SPECIAL_SKILL_BADGES.length;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-b from-[#091122] via-[#0b152d] to-[#060c1a] p-5 sm:p-7 text-white shadow-xl">
      {/* Subtle top ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-blue-500/15 blur-3xl" />

      {/* Header bar: Title, Stats & Filter Tabs */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-sky-400 border border-blue-400/30 shadow-sm">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg sm:text-xl font-black tracking-tight text-white">
                Bộ Sưu Tập Huy Hiệu
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-sky-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-300">
                <Sparkles className="h-3 w-3" /> ELITE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mở khóa các cột mốc streak và kỹ năng calisthenics danh giá.
            </p>
          </div>
        </div>

        {/* Right: Badge Unlock Progress Pill & Tab Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 text-xs text-slate-300 font-semibold shadow-inner">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Đã mở:</span>
            <span className="font-bold text-sky-400">
              {unlockedCount}/{totalBadges}
            </span>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800">
            <button
              onClick={() => setActiveTab("streak")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "streak"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Flame className="h-3.5 w-3.5" /> Chuỗi Streak ({STREAK_MILESTONES.length})
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "skills"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Star className="h-3.5 w-3.5" /> Kỹ Năng ({SPECIAL_SKILL_BADGES.length})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏅 BADGES GRID (Tab Content) */}
      {/* ========================================================================= */}
      <div className="relative z-10 pt-5">
        {activeTab === "streak" ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-sky-400" /> Các Mốc Kỷ Lục Streak
              </span>
              <span className="text-[11px] text-slate-400">
                Nhấn vào huy hiệu để xem chi tiết
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {STREAK_MILESTONES.map((badge) => (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="group flex flex-col items-center text-center cursor-pointer p-3 rounded-2xl transition-all duration-300 hover:bg-white/[0.04] active:scale-95"
                >
                  <BadgeSticker badge={badge} size="md" />

                  <div className="mt-2.5 space-y-0.5">
                    <div className="font-display text-xs sm:text-sm font-black text-white group-hover:text-sky-300 transition-colors">
                      {badge.title}
                    </div>
                    <div className="text-[11px] font-medium text-slate-300 line-clamp-1">
                      {badge.sub1}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {badge.isUnlocked ? (
                        <span className="text-emerald-400 font-medium">✓ Đã đạt</span>
                      ) : (
                        <span>Mốc {badge.daysRequired} ngày</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-400" /> Huy Hiệu Kỹ Năng Đột Phá
              </span>
              <span className="text-[11px] text-slate-400">
                Nhấn vào huy hiệu để xem chi tiết
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {SPECIAL_SKILL_BADGES.map((badge) => (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="group flex flex-col items-center text-center cursor-pointer p-3 rounded-2xl transition-all duration-300 hover:bg-white/[0.04] active:scale-95"
                >
                  <BadgeSticker badge={badge} size="md" />

                  <div className="mt-2.5 space-y-0.5">
                    <div className="font-display text-xs sm:text-sm font-black text-white group-hover:text-sky-300 transition-colors">
                      {badge.title}
                    </div>
                    <div className="text-[11px] font-medium text-slate-300 line-clamp-1">
                      {badge.sub1}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {badge.isUnlocked ? (
                        <span className="text-emerald-400 font-medium">✓ Đã mở</span>
                      ) : (
                        <span>Chưa mở</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🔍 BADGE DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl border border-blue-400/40 bg-[#091226] p-6 shadow-2xl text-white">
            {/* Close button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Badge Centerpiece */}
            <div className="flex flex-col items-center text-center">
              <BadgeSticker
                badge={selectedBadge}
                size="lg"
                useUltra={true}
                className="my-2"
              />

              <div className="mt-3 space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                  {selectedBadge.badgeType === "streak"
                    ? `Cột Mốc ${selectedBadge.daysRequired} Ngày`
                    : "Huy Hiệu Kỹ Năng"}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black text-white">
                  {selectedBadge.title}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {selectedBadge.sub1} {selectedBadge.sub2 ? `• ${selectedBadge.sub2}` : ""}
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-blue-950/70 p-3.5 text-xs text-slate-300 border border-blue-800/40 leading-relaxed text-left w-full">
                {selectedBadge.description}
              </div>

              {/* Reward pill */}
              <div className="mt-3.5 w-full rounded-2xl border border-sky-400/30 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 p-3 text-left shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Phần thưởng:</span>
                  <span className="font-black text-amber-400 text-xs sm:text-sm">
                    +{selectedBadge.xpReward} XP
                  </span>
                </div>
                <div className="mt-1 text-xs text-sky-300">
                  ✨ Đặc quyền:{" "}
                  <span className="font-normal text-slate-200">{selectedBadge.perk}</span>
                </div>
              </div>

              {/* Status and Action */}
              <div className="mt-5 flex w-full items-center justify-between gap-3 border-t border-blue-900/50 pt-4">
                {selectedBadge.isUnlocked ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Đã mở ({selectedBadge.unlockedDate || "Mới đạt"})
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Lock className="h-4 w-4" /> Chưa mở khóa
                  </span>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `Tôi vừa xem huy hiệu "${selectedBadge.title}" trên CalisPro! 🔥`
                    );
                    toast.success("Đã sao chép liên kết thành tích!");
                  }}
                  className="rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  Chia sẻ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
