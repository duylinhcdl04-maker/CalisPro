import React from "react";
import {
  Search,
  SlidersHorizontal,
  FileText,
  Calendar,
  Trophy,
  Gift,
  Users2,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  ContentType,
  ContentStatus,
  AudiencePlan,
  ContentFilterState,
} from "../types/content.types";

interface ContentFilterBarProps {
  filter: ContentFilterState;
  onFilterChange: (updates: Partial<ContentFilterState>) => void;
  typeCounts: Record<string, number>;
}

const CONTENT_TYPE_TABS: { id: ContentType | "ALL"; label: string; icon: React.ReactNode }[] = [
  { id: "ALL", label: "Tất cả nội dung", icon: <Layers className="h-3.5 w-3.5" /> },
  { id: "CHALLENGE", label: "Thử thách & Cuộc thi", icon: <Trophy className="h-3.5 w-3.5" /> },
  { id: "EVENT", label: "Sự kiện & Workshop", icon: <Calendar className="h-3.5 w-3.5" /> },
  { id: "NEWS", label: "Tin tức & Cẩm nang", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "REWARD", label: "Giải thưởng & Voucher", icon: <Gift className="h-3.5 w-3.5" /> },
  { id: "PRODUCT_UPDATE", label: "Cập nhật ứng dụng", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: "COMMUNITY", label: "Cộng đồng Meetup", icon: <Users2 className="h-3.5 w-3.5" /> },
];

export const ContentFilterBar: React.FC<ContentFilterBarProps> = ({
  filter,
  onFilterChange,
  typeCounts,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Type Tabs (Pills - No horizontal scrollbar) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E3E7DF] pb-3 dark:border-zinc-800">
        {CONTENT_TYPE_TABS.map((tab) => {
          const isActive = filter.type === tab.id;
          const count = typeCounts[tab.id] || 0;

          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange({ type: tab.id })}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#7C9B5B] text-white shadow-2xs"
                  : "border border-[#E3E7DF] bg-white text-[#687268] hover:bg-zinc-50 hover:text-[#172019] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={isActive ? "text-white" : "text-[#7C9B5B]"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#EEF4E8] text-[#55733C] dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Secondary Filter Bar: Search, Status, Audience, Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#687268] dark:text-zinc-400" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Tìm theo tiêu đề, tác giả, tag, thử thách, sự kiện..."
            className="w-full rounded-xl border border-[#E3E7DF] bg-white py-2 pl-9.5 pr-4 text-xs font-medium text-[#172019] placeholder:text-[#687268]/60 focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={filter.status}
            onChange={(e) => onFilterChange({ status: e.target.value as ContentStatus | "ALL" })}
            className="rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-semibold text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản (Published)</option>
            <option value="SCHEDULED">Hẹn giờ (Scheduled)</option>
            <option value="APPROVED">Đã duyệt (Approved)</option>
            <option value="REVIEW">Chờ duyệt (Review)</option>
            <option value="DRAFT">Bản nháp (Draft)</option>
            <option value="ARCHIVED">Lưu trữ (Archived)</option>
          </select>

          {/* Target Audience */}
          <select
            value={filter.targetPlan}
            onChange={(e) => onFilterChange({ targetPlan: e.target.value as AudiencePlan | "ALL" })}
            className="rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-semibold text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="ALL">Tất cả đối tượng</option>
            <option value="FREE">Chỉ Gói Free</option>
            <option value="PRO">Chỉ Gói Pro</option>
            <option value="PREMIUM">Chỉ Gói Premium</option>
            <option value="TRIAL">Người dùng Trial</option>
          </select>

          {/* Sort By */}
          <select
            value={filter.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-semibold text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="latest">Mới nhất trước</option>
            <option value="most_viewed">Xem nhiều nhất</option>
            <option value="engagement">Tương tác cao nhất</option>
            <option value="oldest">Cũ nhất trước</option>
          </select>
        </div>
      </div>
    </div>
  );
};
