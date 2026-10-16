import React, { useState } from "react";
import {
  History,
  Search,
  Mail,
  Smartphone,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  MousePointerClick,
  Info,
} from "lucide-react";
import { NotificationLog, DeliveryStatus, NotificationChannel } from "../types/notification.types";

interface NotificationLogsTabProps {
  logs: NotificationLog[];
  isLoading?: boolean;
}

const STATUS_BADGES: Record<
  DeliveryStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  DELIVERED: {
    label: "Đã chuyển phát",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  OPENED: {
    label: "Đã mở xem",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-300",
    icon: <Eye className="h-3 w-3" />,
  },
  CLICKED: {
    label: "Đã nhấp link",
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-700 dark:text-purple-300",
    icon: <MousePointerClick className="h-3 w-3" />,
  },
  SENT: {
    label: "Đang gửi",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    icon: <Clock className="h-3 w-3" />,
  },
  PENDING: {
    label: "Chờ xử lý",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
    icon: <Clock className="h-3 w-3" />,
  },
  PROCESSING: {
    label: "Đang gửi hàng đợi",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
    icon: <Clock className="h-3 w-3" />,
  },
  FAILED: {
    label: "Thất bại / Lỗi",
    bg: "bg-red-50 dark:bg-red-950/60",
    text: "text-red-700 dark:text-red-300",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export const NotificationLogsTab: React.FC<NotificationLogsTabProps> = ({
  logs,
  isLoading,
}) => {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedErrorLog, setSelectedErrorLog] = useState<NotificationLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (channelFilter !== "ALL" && log.channel !== channelFilter) return false;
    if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.recipientName.toLowerCase().includes(q) ||
        log.recipientEmail.toLowerCase().includes(q) ||
        log.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#172019] dark:text-white flex items-center gap-2">
            <History className="h-4 w-4 text-[#7C9B5B]" />
            <span>Nhật ký Chuyển phát & Lịch sử Gửi (Delivery Audit Logs)</span>
          </h3>
          <p className="text-xs text-[#687268] dark:text-zinc-400">
            Theo dõi chi tiết từng thông báo được phát đi từ hệ thống tự động hoặc chiến dịch truyền thông
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#687268]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm học viên, email, tiêu đề..."
              className="w-full rounded-xl border border-[#E3E7DF] bg-white py-1.5 pl-8 pr-3 text-xs focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Channel */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="rounded-xl border border-[#E3E7DF] bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="ALL">Tất cả kênh</option>
            <option value="EMAIL">Email</option>
            <option value="IN_APP">In-App Popup</option>
            <option value="PUSH">Push Notification</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#E3E7DF] bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DELIVERED">Đã chuyển phát</option>
            <option value="OPENED">Đã mở xem</option>
            <option value="CLICKED">Đã nhấp link</option>
            <option value="FAILED">Thất bại / Lỗi</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E3E7DF] bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3E7DF] bg-[#F7F8F4] text-[11px] font-bold text-[#687268] uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <th className="py-3 px-4">Học viên nhận</th>
                <th className="py-3 px-4">Kênh & Phân loại</th>
                <th className="py-3 px-4">Tiêu đề thông báo</th>
                <th className="py-3 px-4">Kịch bản / Chiến dịch</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thời gian gửi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7DF] text-xs dark:divide-zinc-800">
              {filteredLogs.map((log) => {
                const badge = STATUS_BADGES[log.status];

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-[#F7F8F4]/80 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Recipient */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div>
                        <span className="font-bold text-[#172019] block dark:text-white">
                          {log.recipientName}
                        </span>
                        <span className="text-[11px] text-[#687268] font-mono dark:text-zinc-400">
                          {log.recipientEmail}
                        </span>
                      </div>
                    </td>

                    {/* Channel & Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="rounded-lg bg-[#EEF4E8] p-1 text-[#55733C] dark:bg-zinc-800 dark:text-emerald-400"
                          title={log.channel}
                        >
                          {log.channel === "EMAIL" && <Mail className="h-3.5 w-3.5 text-blue-500" />}
                          {log.channel === "IN_APP" && <Bell className="h-3.5 w-3.5 text-[#7C9B5B]" />}
                          {log.channel === "PUSH" && <Smartphone className="h-3.5 w-3.5 text-purple-500" />}
                        </span>
                        <span className="text-[10px] font-bold text-[#687268] dark:text-zinc-400">
                          {log.category}
                        </span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 max-w-[280px]">
                      <h5 className="font-bold text-[#172019] line-clamp-1 dark:text-white">
                        {log.title}
                      </h5>
                      <p className="text-[10px] text-[#687268] line-clamp-1 dark:text-zinc-400">
                        {log.bodySummary}
                      </p>
                    </td>

                    {/* Rule */}
                    <td className="py-3 px-4 whitespace-nowrap text-[11px] text-[#687268] dark:text-zinc-400">
                      {log.ruleOrCampaignName || "Thủ công"}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>

                        {log.status === "FAILED" && (
                          <button
                            onClick={() => setSelectedErrorLog(log)}
                            className="text-red-500 hover:text-red-700"
                            title="Xem chi tiết lỗi"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-[11px] text-[#687268] dark:text-zinc-400">
                      {new Date(log.sentAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {new Date(log.sentAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Details Modal */}
      {selectedErrorLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <h4 className="text-sm font-bold">Chi tiết Lỗi Chuyển phát Thông báo</h4>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-xs font-mono text-red-900 dark:bg-red-950/40 dark:text-red-300">
              {selectedErrorLog.errorMessage || "Không thể kết nối đến máy chủ SMTP."}
            </div>

            <p className="text-xs text-[#687268] dark:text-zinc-400">
              Người nhận: <strong>{selectedErrorLog.recipientEmail}</strong>
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedErrorLog(null)}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
