import React from "react";
import {
  X,
  BarChart2,
  Eye,
  MousePointerClick,
  Share2,
  Heart,
  Users,
  TrendingUp,
  ArrowRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { ContentItem } from "../types/content.types";

interface ContentAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem | null;
}

export const ContentAnalyticsDrawer: React.FC<ContentAnalyticsDrawerProps> = ({
  isOpen,
  onClose,
  content,
}) => {
  if (!isOpen || !content) return null;

  const views = content.analytics.views;
  const clicks = content.analytics.clicks;
  const registrations = content.analytics.registrations || Math.round(clicks * 0.28);
  const completions = Math.round(registrations * 0.65);

  const clickRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";
  const regRate = clicks > 0 ? ((registrations / clicks) * 100).toFixed(1) : "0";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-zinc-900 border-l border-[#E3E7DF] dark:border-zinc-800 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3E7DF] px-6 py-4 dark:border-zinc-800 bg-[#F7F8F4] dark:bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#EEF4E8] p-2 text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172019] dark:text-white">
                Báo cáo Hiệu suất & Phễu Chuyển đổi
              </h3>
              <p className="text-[11px] text-[#687268] dark:text-zinc-400">
                Phân tích mức độ quan tâm của học viên đối với nội dung này
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Content summary card */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#E3E7DF] bg-[#F7F8F4] p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <img
              src={content.coverImage}
              alt={content.title}
              className="h-14 w-20 rounded-xl object-cover border border-[#E3E7DF] dark:border-zinc-700 shrink-0"
            />
            <div className="min-w-0">
              <span className="inline-block rounded bg-[#7C9B5B] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase mb-0.5">
                {content.type}
              </span>
              <h4 className="text-xs font-bold text-[#172019] dark:text-white line-clamp-1">
                {content.title}
              </h4>
              <p className="text-[10px] text-[#687268] dark:text-zinc-400 mt-0.5">
                Xuất bản: {new Date(content.createdAt).toLocaleDateString("vi-VN")} • Tác giả: {content.author.name}
              </p>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between text-xs text-[#687268] dark:text-zinc-400">
                <span>Tổng Lượt xem (Views)</span>
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-2 text-xl font-black text-[#172019] dark:text-white">
                {content.analytics.views.toLocaleString("vi-VN")}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">
                {content.analytics.uniqueViews.toLocaleString("vi-VN")} người xem duy nhất
              </span>
            </div>

            <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between text-xs text-[#687268] dark:text-zinc-400">
                <span>Tỷ lệ Tương tác</span>
                <TrendingUp className="h-4 w-4 text-[#7C9B5B]" />
              </div>
              <div className="mt-2 text-xl font-black text-[#55733C] dark:text-emerald-400">
                {content.analytics.engagementRate}%
              </div>
              <span className="text-[10px] text-[#687268] dark:text-zinc-400">
                Cao hơn 12.4% so với TB
              </span>
            </div>

            <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between text-xs text-[#687268] dark:text-zinc-400">
                <span>Lượt Nhấp (Clicks)</span>
                <MousePointerClick className="h-4 w-4 text-purple-500" />
              </div>
              <div className="mt-2 text-xl font-black text-[#172019] dark:text-white">
                {content.analytics.clicks.toLocaleString("vi-VN")}
              </div>
              <span className="text-[10px] text-purple-600 font-medium">
                CTR đạt {clickRate}%
              </span>
            </div>

            <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between text-xs text-[#687268] dark:text-zinc-400">
                <span>Chia sẻ & Yêu thích</span>
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <div className="mt-2 text-xl font-black text-[#172019] dark:text-white">
                {(content.analytics.likes + content.analytics.shares).toLocaleString("vi-VN")}
              </div>
              <span className="text-[10px] text-[#687268] dark:text-zinc-400">
                {content.analytics.likes} tim • {content.analytics.shares} share
              </span>
            </div>
          </div>

          {/* 4-Stage Conversion Funnel */}
          <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h4 className="text-xs font-bold text-[#172019] dark:text-white flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-[#7C9B5B]" />
              <span>Phễu Hành động Học viên (Engagement Funnel)</span>
            </h4>

            <div className="space-y-3">
              {/* Step 1: Views */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#172019] dark:text-white">
                  <span>1. Lượt xem bài viết / Sự kiện</span>
                  <span>{views.toLocaleString("vi-VN")} (100%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-full" />
                </div>
              </div>

              {/* Step 2: Clicks */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#172019] dark:text-white">
                  <span>2. Nhấp xem chi tiết / Link đăng ký</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {clicks.toLocaleString("vi-VN")} ({clickRate}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min(Number(clickRate) * 2, 100)}%` }}
                  />
                </div>
              </div>

              {/* Step 3: Registration / Joined */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#172019] dark:text-white">
                  <span>3. Đăng ký tham gia / Nhận voucher</span>
                  <span className="text-[#55733C] dark:text-emerald-400">
                    {registrations.toLocaleString("vi-VN")} ({regRate}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-[#7C9B5B] rounded-full"
                    style={{ width: `${Math.min(Number(regRate) * 1.5, 100)}%` }}
                  />
                </div>
              </div>

              {/* Step 4: Completion */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#172019] dark:text-white">
                  <span>4. Hoàn thành Thử thách / Check-in Workshop</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {completions.toLocaleString("vi-VN")} (65.0%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: "45%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown by Member Tier */}
          <div className="rounded-2xl border border-[#E3E7DF] bg-[#F7F8F4] p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
            <h4 className="text-xs font-bold text-[#172019] dark:text-white">
              Tỷ lệ Người xem theo Gói Hội viên
            </h4>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded-xl bg-white p-2 border border-[#E3E7DF] dark:bg-zinc-900 dark:border-zinc-800">
                <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Hội viên Free</span>
                <span className="text-xs font-black text-[#172019] dark:text-white">42.5%</span>
              </div>
              <div className="rounded-xl bg-white p-2 border border-[#E3E7DF] dark:bg-zinc-900 dark:border-zinc-800">
                <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Gói Pro</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">36.1%</span>
              </div>
              <div className="rounded-xl bg-white p-2 border border-[#E3E7DF] dark:bg-zinc-900 dark:border-zinc-800">
                <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Gói Premium</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">21.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
