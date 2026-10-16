import React from "react";
import { FileText, Eye, Trophy, Users, TrendingUp, Sparkles } from "lucide-react";
import { ContentKPIs } from "../types/content.types";

interface ContentKPIHeaderProps {
  kpis: ContentKPIs;
  isLoading?: boolean;
}

export const ContentKPIHeader: React.FC<ContentKPIHeaderProps> = ({ kpis, isLoading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng xuất bản */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
            Nội dung đã xuất bản
          </span>
          <div className="rounded-xl bg-[#EEF4E8] p-2 text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
            <FileText className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#172019] dark:text-white">
            {isLoading ? "..." : `${kpis.totalPublished} bài`}
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="h-3 w-3" /> +{kpis.publishedGrowth}%
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#687268] dark:text-zinc-400">
          Gồm Tin tức, Sự kiện, Thử thách & Giải thưởng
        </p>
      </div>

      {/* 2. Lượt xem hàng tháng */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
            Lượt xem hàng tháng (Views)
          </span>
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
            <Eye className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#172019] dark:text-white">
            {isLoading ? "..." : `${kpis.totalViewsMonthly.toLocaleString("vi-VN")}`}
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="h-3 w-3" /> +{kpis.viewsGrowth}%
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#687268] dark:text-zinc-400">
          Tương tác người dùng qua Web & User App
        </p>
      </div>

      {/* 3. Sự kiện & Thử thách Active */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
            Sự kiện & Thử thách đang mở
          </span>
          <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
            <Trophy className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#55733C] dark:text-emerald-400">
            {isLoading ? "..." : `${kpis.activeEventsAndChallenges} chương trình`}
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Live
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#687268] dark:text-zinc-400">
          Leaderboard & Workshop tương tác trực tiếp
        </p>
      </div>

      {/* 4. Tổng đăng ký & Tham gia */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
            Học viên đăng ký tham gia
          </span>
          <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#172019] dark:text-white">
            {isLoading ? "..." : `${kpis.totalRegistrations.toLocaleString("vi-VN")} lượt`}
          </span>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            (Conversion 24%)
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#687268] dark:text-zinc-400">
          Tham gia Thử thách & Workshop Calisthenics
        </p>
      </div>
    </div>
  );
};
