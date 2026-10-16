import React, { useState } from "react";
import {
  X,
  Smartphone,
  Globe,
  Share2,
  Heart,
  Bookmark,
  Calendar,
  MapPin,
  Trophy,
  Users,
  ChevronLeft,
  ArrowRight,
  Flame,
  Sparkles,
  Gift,
} from "lucide-react";
import { ContentItem } from "../types/content.types";

interface ContentAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem | null;
}

export const ContentAppPreviewModal: React.FC<ContentAppPreviewModalProps> = ({
  isOpen,
  onClose,
  content,
}) => {
  const [deviceMode, setDeviceMode] = useState<"mobile" | "web_card">("mobile");
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-[#E3E7DF] bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3E7DF] px-6 py-4 dark:border-zinc-800 bg-[#F7F8F4] dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#EEF4E8] p-2 text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172019] dark:text-white flex items-center gap-2">
                <span>Xem trước Giao diện Người dùng (User App Preview)</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live Simulator
                </span>
              </h3>
              <p className="text-[11px] text-[#687268] dark:text-zinc-400">
                Hiển thị chính xác như học viên CalisHealth trải nghiệm trên thiết bị di động
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Mobile / Web View */}
            <div className="flex items-center rounded-xl bg-white border border-[#E3E7DF] p-0.5 dark:bg-zinc-800 dark:border-zinc-700">
              <button
                onClick={() => setDeviceMode("mobile")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  deviceMode === "mobile"
                    ? "bg-[#7C9B5B] text-white shadow-2xs"
                    : "text-[#687268] hover:text-[#172019] dark:text-zinc-400"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile App</span>
              </button>
              <button
                onClick={() => setDeviceMode("web_card")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  deviceMode === "web_card"
                    ? "bg-[#7C9B5B] text-white shadow-2xs"
                    : "text-[#687268] hover:text-[#172019] dark:text-zinc-400"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Thẻ Banner Web</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Simulator Viewport */}
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950/70">
          {deviceMode === "mobile" ? (
            /* PHONE MOCKUP FRAME */
            <div className="relative w-[375px] h-[680px] rounded-[42px] border-[8px] border-zinc-900 bg-white shadow-2xl overflow-hidden flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
              {/* Phone Dynamic Island / Speaker */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-28 bg-zinc-900 rounded-full z-30" />

              {/* Mobile App Navigation Bar */}
              <div className="flex items-center justify-between px-4 pt-6 pb-2 border-b border-zinc-100 bg-white dark:bg-zinc-900 dark:border-zinc-800 z-20">
                <button className="p-1 rounded-full text-zinc-700 dark:text-zinc-300">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">
                  {content.category}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-1 rounded-full ${isLiked ? "text-red-500" : "text-zinc-500"}`}
                  >
                    <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`p-1 rounded-full ${isSaved ? "text-[#55733C]" : "text-zinc-500"}`}
                  >
                    <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>

              {/* Mobile Screen Scroll Content */}
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Hero Banner */}
                <div className="relative h-48 w-full bg-zinc-200">
                  <img
                    src={content.coverImage}
                    alt={content.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="inline-block rounded-md bg-[#7C9B5B] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider mb-1">
                      {content.type}
                    </span>
                    <h2 className="text-sm font-black text-white leading-snug drop-shadow-md">
                      {content.title}
                    </h2>
                  </div>
                </div>

                <div className="px-4 space-y-3 pb-6">
                  {/* Author & Meta */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <img
                        src={content.author.avatar}
                        alt={content.author.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <div>
                        <span className="block text-[11px] font-bold text-zinc-900 dark:text-white">
                          {content.author.name}
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          {new Date(content.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-full bg-[#EEF4E8] px-2 py-0.5 text-[10px] font-bold text-[#55733C] dark:bg-emerald-950 dark:text-emerald-300">
                      {content.audience.targetPlan === "ALL" ? "Dành cho mọi học viên" : `Gói ${content.audience.targetPlan}`}
                    </span>
                  </div>

                  {/* Challenge / Event Specific Highlights */}
                  {content.challengeDetails && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <Trophy className="h-4 w-4 text-amber-600" />
                        <span>Mục tiêu & Giải thưởng Thử thách</span>
                      </div>
                      <div className="text-[11px] text-amber-950 dark:text-amber-300 font-medium">
                        🎯 {content.challengeDetails.targetGoal}
                      </div>
                      <div className="text-[11px] text-[#55733C] dark:text-emerald-400 font-bold">
                        🎁 {content.challengeDetails.rewardDescription}
                      </div>
                      <button className="w-full rounded-xl bg-[#7C9B5B] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all mt-1">
                        Tham gia ngay bằng AI Vision
                      </button>
                    </div>
                  )}

                  {content.eventDetails && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900/60 dark:bg-blue-950/30 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900 dark:text-blue-200">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span>{new Date(content.eventDetails.startDate).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                        <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span className="line-clamp-1">{content.eventDetails.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                        <span>Đã đăng ký: {content.eventDetails.currentParticipants}/{content.eventDetails.maxParticipants}</span>
                      </div>
                      <button className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all mt-1">
                        Đăng ký giữ chỗ miễn phí
                      </button>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                    {content.content}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {content.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* WEB CARD BANNER VIEW */
            <div className="w-full max-w-xl rounded-3xl border border-[#E3E7DF] bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <span className="text-xs font-bold text-[#687268] uppercase tracking-wider block">
                Thẻ Banner Trang Chủ (Web & Desktop Dashboard)
              </span>

              <div className="overflow-hidden rounded-2xl border border-[#E3E7DF] bg-[#F7F8F4] dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="relative h-56 w-full">
                  <img
                    src={content.coverImage}
                    alt={content.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                    {content.type}
                  </div>
                  {content.featured && (
                    <div className="absolute top-3 right-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                      <Flame className="h-3 w-3" /> Nổi bật
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#687268] dark:text-zinc-400">
                    <span>{content.category}</span>
                    <span>{new Date(content.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>

                  <h3 className="text-lg font-black text-[#172019] dark:text-white">
                    {content.title}
                  </h3>

                  <p className="text-xs text-[#687268] dark:text-zinc-300 leading-relaxed">
                    {content.shortDescription}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-[#E3E7DF] dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <img
                        src={content.author.avatar}
                        alt={content.author.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-[#172019] dark:text-white">
                        {content.author.name}
                      </span>
                    </div>

                    <button className="inline-flex items-center gap-1 text-xs font-bold text-[#55733C] hover:text-[#3e562a] dark:text-emerald-400">
                      <span>Xem chi tiết</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
