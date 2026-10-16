import React from "react";
import {
  Eye,
  MousePointerClick,
  Users,
  Smartphone,
  BarChart2,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  Send,
  Archive,
  MoreVertical,
  Trophy,
  Calendar,
  FileText,
  Gift,
  Sparkles,
  Users2,
  Flame,
} from "lucide-react";
import { ContentItem, ContentStatus, ContentType } from "../types/content.types";

interface ContentTableProps {
  contents: ContentItem[];
  isLoading?: boolean;
  onPreview: (content: ContentItem) => void;
  onViewAnalytics: (content: ContentItem) => void;
  onEdit: (content: ContentItem) => void;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onDelete: (id: string) => void;
}

const TYPE_CONFIG: Record<
  ContentType,
  { label: string; icon: React.ReactNode; bg: string; text: string }
> = {
  CHALLENGE: {
    label: "Thử thách",
    icon: <Trophy className="h-3 w-3" />,
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
  },
  EVENT: {
    label: "Sự kiện",
    icon: <Calendar className="h-3 w-3" />,
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-300",
  },
  NEWS: {
    label: "Tin tức",
    icon: <FileText className="h-3 w-3" />,
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  REWARD: {
    label: "Giải thưởng",
    icon: <Gift className="h-3 w-3" />,
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-700 dark:text-purple-300",
  },
  PRODUCT_UPDATE: {
    label: "Cập nhật",
    icon: <Sparkles className="h-3 w-3" />,
    bg: "bg-teal-50 dark:bg-teal-950/60",
    text: "text-teal-700 dark:text-teal-300",
  },
  COMMUNITY: {
    label: "Cộng đồng",
    icon: <Users2 className="h-3 w-3" />,
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-300",
  },
};

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  PUBLISHED: {
    label: "Đã xuất bản",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  SCHEDULED: {
    label: "Hẹn giờ",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-300",
  },
  APPROVED: {
    label: "Đã duyệt",
    dot: "bg-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/60",
    text: "text-teal-700 dark:text-teal-300",
  },
  REVIEW: {
    label: "Chờ duyệt",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
  },
  DRAFT: {
    label: "Bản nháp",
    dot: "bg-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-300",
  },
  ARCHIVED: {
    label: "Lưu trữ",
    dot: "bg-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-500 dark:text-zinc-400",
  },
};

export const ContentTable: React.FC<ContentTableProps> = ({
  contents,
  isLoading,
  onPreview,
  onViewAnalytics,
  onEdit,
  onStatusChange,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#7C9B5B] border-r-transparent" />
        <p className="mt-3 text-xs text-[#687268] dark:text-zinc-400">Đang tải danh sách nội dung...</p>
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <FileText className="mx-auto h-12 w-12 text-[#687268]/40 dark:text-zinc-600" />
        <h4 className="mt-3 text-sm font-bold text-[#172019] dark:text-white">Không tìm thấy nội dung phù hợp</h4>
        <p className="mt-1 text-xs text-[#687268] dark:text-zinc-400">Hãy thử điều chỉnh bộ lọc hoặc tạo bài viết/thử thách mới.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E3E7DF] bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E3E7DF] bg-[#F7F8F4] text-[11px] font-bold text-[#687268] uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
              <th className="py-3.5 px-4">Nội dung & Phân loại</th>
              <th className="py-3.5 px-4">Đối tượng (Audience)</th>
              <th className="py-3.5 px-4">Trạng thái Workflow</th>
              <th className="py-3.5 px-4 text-center">Hiệu suất (Views & Action)</th>
              <th className="py-3.5 px-4">Tác giả & Ngày tạo</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3E7DF] text-xs dark:divide-zinc-800">
            {contents.map((item) => {
              const typeCfg = TYPE_CONFIG[item.type];
              const statusCfg = STATUS_CONFIG[item.status];

              return (
                <tr
                  key={item.id}
                  className="group hover:bg-[#F7F8F4]/80 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  {/* 1. Thumbnail + Title */}
                  <td className="py-3.5 px-4 max-w-[320px]">
                    <div className="flex items-start gap-3">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E3E7DF] bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.featured && (
                          <div className="absolute top-1 left-1 rounded-md bg-amber-500 p-0.5 text-white shadow-xs">
                            <Flame className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${typeCfg.bg} ${typeCfg.text}`}
                          >
                            {typeCfg.icon}
                            {typeCfg.label}
                          </span>
                          <span className="text-[10px] text-[#687268] dark:text-zinc-400">
                            • {item.category}
                          </span>
                        </div>

                        <h4 className="font-bold text-[#172019] line-clamp-1 dark:text-white group-hover:text-[#55733C] dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#687268] line-clamp-1 mt-0.5 dark:text-zinc-400">
                          {item.shortDescription}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 2. Target Audience */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.audience.targetPlan === "ALL"
                            ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            : item.audience.targetPlan === "PREMIUM"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {item.audience.targetPlan === "ALL"
                          ? "Tất cả học viên"
                          : `Gói ${item.audience.targetPlan}`}
                      </span>
                      {item.audience.targetLevel !== "ALL" && (
                        <span className="block text-[10px] text-[#687268] dark:text-zinc-400">
                          Cấp độ: {item.audience.targetLevel}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 3. Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                      {item.scheduledAt && item.status === "SCHEDULED" && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.scheduledAt).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 4. Performance Metrics */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <span className="block text-xs font-bold text-[#172019] dark:text-white">
                          {item.analytics.views.toLocaleString("vi-VN")}
                        </span>
                        <span className="text-[10px] text-[#687268] dark:text-zinc-400 flex items-center justify-center gap-0.5">
                          <Eye className="h-3 w-3" /> Views
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="block text-xs font-bold text-[#55733C] dark:text-emerald-400">
                          {item.analytics.engagementRate}%
                        </span>
                        <span className="text-[10px] text-[#687268] dark:text-zinc-400 flex items-center justify-center gap-0.5">
                          <MousePointerClick className="h-3 w-3" /> Engag.
                        </span>
                      </div>

                      {item.analytics.registrations !== undefined && (
                        <div className="text-center">
                          <span className="block text-xs font-bold text-purple-600 dark:text-purple-400">
                            {item.analytics.registrations.toLocaleString("vi-VN")}
                          </span>
                          <span className="text-[10px] text-[#687268] dark:text-zinc-400 flex items-center justify-center gap-0.5">
                            <Users className="h-3 w-3" /> Đăng ký
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 5. Author & Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.author.avatar}
                        alt={item.author.name}
                        className="h-6 w-6 rounded-full object-cover border border-[#E3E7DF] dark:border-zinc-700"
                      />
                      <div>
                        <span className="block text-xs font-bold text-[#172019] dark:text-white">
                          {item.author.name}
                        </span>
                        <span className="text-[10px] text-[#687268] dark:text-zinc-400">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 6. Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* App Simulator Preview */}
                      <button
                        onClick={() => onPreview(item)}
                        title="Xem trước trên User App (Mobile)"
                        className="rounded-lg border border-[#E3E7DF] bg-white p-1.5 text-[#55733C] hover:bg-[#EEF4E8] dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>

                      {/* Analytics */}
                      <button
                        onClick={() => onViewAnalytics(item)}
                        title="Báo cáo & Phễu tương tác"
                        className="rounded-lg border border-[#E3E7DF] bg-white p-1.5 text-blue-600 hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-blue-400 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <BarChart2 className="h-4 w-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(item)}
                        title="Chỉnh sửa nội dung"
                        className="rounded-lg border border-[#E3E7DF] bg-white p-1.5 text-[#172019] hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      {/* Quick Publish / Approve */}
                      {item.status === "REVIEW" && (
                        <button
                          onClick={() => onStatusChange(item.id, "APPROVED")}
                          title="Duyệt bài"
                          className="rounded-lg bg-teal-600 p-1.5 text-white hover:bg-teal-700 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {item.status === "APPROVED" && (
                        <button
                          onClick={() => onStatusChange(item.id, "PUBLISHED")}
                          title="Xuất bản ngay"
                          className="rounded-lg bg-[#7C9B5B] p-1.5 text-white hover:bg-[#55733C] transition-colors"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {item.status === "PUBLISHED" && (
                        <button
                          onClick={() => onStatusChange(item.id, "ARCHIVED")}
                          title="Lưu trữ / Gỡ bài"
                          className="rounded-lg border border-[#E3E7DF] bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 transition-colors"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(item.id)}
                        title="Xóa bài viết"
                        className="rounded-lg border border-red-100 bg-white p-1.5 text-red-500 hover:bg-red-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
