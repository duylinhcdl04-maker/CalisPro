import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Zap,
  ShieldCheck,
  Sparkles,
  Trophy,
  Award,
  RefreshCw,
} from "lucide-react";
import { streakService } from "../../services/mock/streakService";
import { StreakMilestoneBadge } from "../../types/streak";
import { StreakBadgesShowcase } from "./StreakBadgesShowcase";
import { StreakSummaryCard } from "./StreakSummaryCard";
import { MilestoneBadgeGrid } from "./MilestoneBadgeGrid";
import { StreakHistoryHeatmap } from "./StreakHistoryHeatmap";
import { StreakBadgeDetailModal } from "./StreakBadgeDetailModal";

export const StreakMilestonesSection: React.FC = () => {
  const [selectedBadge, setSelectedBadge] = useState<StreakMilestoneBadge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: streakData, isLoading, isError, refetch } = useQuery({
    queryKey: ["user-streak-data"],
    queryFn: () => streakService.getStreakData(),
  });

  const handleOpenBadge = (badge: StreakMilestoneBadge) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !streakData) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500">Không tải được thông tin chuỗi ngày tập luyện.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#547EFF] px-4 py-2 text-xs font-bold text-white shadow-md"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 🌟 1. STREAK BADGES PREMIUM SHOWCASE (Sticker Wall & 3D Badges) */}
      <StreakBadgesShowcase />

      {/* 2. Master Streak Summary & Weekly momentum */}
      <StreakSummaryCard
        data={streakData}
        onViewAllBadges={() => {
          const el = document.getElementById("milestones-grid");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* 2. Consistency Heatmap */}
      <StreakHistoryHeatmap
        history={streakData.recentHistory}
        currentStreak={streakData.currentStreak}
        longestStreak={streakData.longestStreak}
      />

      {/* 3. Milestone Badges Grid */}
      <div id="milestones-grid">
        <MilestoneBadgeGrid
          milestones={streakData.milestones}
          onSelectBadge={handleOpenBadge}
        />
      </div>

      {/* 4. Interactive Badge Detail Modal */}
      <StreakBadgeDetailModal
        badge={selectedBadge}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
