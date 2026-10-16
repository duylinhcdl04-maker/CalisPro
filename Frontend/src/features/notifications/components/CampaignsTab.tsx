import React from "react";
import {
  Send,
  Plus,
  Mail,
  Smartphone,
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Eye,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { BroadcastCampaign } from "../types/notification.types";

interface CampaignsTabProps {
  campaigns: BroadcastCampaign[];
  onCreateCampaign: () => void;
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaigns,
  onCreateCampaign,
}) => {
  return (
    <div className="space-y-4">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#172019] dark:text-white flex items-center gap-2">
            <Send className="h-4 w-4 text-[#7C9B5B]" />
            <span>Chiến dịch Gửi Thông báo & Email Chủ động (Broadcast Campaigns)</span>
          </h3>
          <p className="text-xs text-[#687268] dark:text-zinc-400">
            Tạo và gửi các chiến dịch truyền thông hàng loạt, khuyến mãi nâng cấp gói hoặc thông báo sự kiện
          </p>
        </div>

        <button
          onClick={onCreateCampaign}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo Chiến dịch mới</span>
        </button>
      </div>

      {/* Campaigns list table / cards */}
      <div className="space-y-3">
        {campaigns.map((camp) => {
          const isCompleted = camp.status === "COMPLETED";
          const isScheduled = camp.status === "SCHEDULED";

          const openRate = camp.stats.delivered > 0 ? ((camp.stats.opened / camp.stats.delivered) * 100).toFixed(1) : "0";
          const ctr = camp.stats.opened > 0 ? ((camp.stats.clicked / camp.stats.opened) * 100).toFixed(1) : "0";

          return (
            <div
              key={camp.id}
              className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : isScheduled
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                      {isScheduled && <Clock className="h-3 w-3" />}
                      {camp.status}
                    </span>

                    <span className="rounded-md bg-[#EEF4E8] px-2 py-0.5 text-[10px] font-bold text-[#55733C] dark:bg-zinc-800 dark:text-zinc-300">
                      {camp.category}
                    </span>

                    <span className="text-[11px] text-[#687268] dark:text-zinc-400">
                      Tạo bởi {camp.createdBy} • {new Date(camp.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#172019] dark:text-white">
                    {camp.name}
                  </h4>
                  <p className="text-xs text-[#687268] dark:text-zinc-300">
                    <strong>Tiêu đề:</strong> {camp.subject}
                  </p>
                </div>

                {/* Channels & Audience */}
                <div className="flex items-center gap-4 text-xs whitespace-nowrap">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Đối tượng nhận:</span>
                    <span className="font-bold text-[#172019] dark:text-white flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-[#55733C]" />
                      {camp.targetAudience} ({camp.recipientCount.toLocaleString("vi-VN")} users)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {camp.channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded-lg bg-[#F7F8F4] p-1.5 text-zinc-700 border border-[#E3E7DF] dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                        title={ch}
                      >
                        {ch === "EMAIL" && <Mail className="h-4 w-4 text-blue-500" />}
                        {ch === "IN_APP" && <Bell className="h-4 w-4 text-[#7C9B5B]" />}
                        {ch === "PUSH" && <Smartphone className="h-4 w-4 text-purple-500" />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Metrics for Sent Campaigns */}
              {isCompleted && (
                <div className="pt-3 border-t border-[#E3E7DF] dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F8F4] p-3 rounded-xl dark:bg-zinc-800/40 text-center">
                  <div>
                    <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Đã gửi</span>
                    <span className="text-xs font-bold text-[#172019] dark:text-white">
                      {camp.stats.sent.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Đã nhận (Delivered)</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {camp.stats.delivered.toLocaleString("vi-VN")} (98.8%)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Đã mở (Open Rate)</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {camp.stats.opened.toLocaleString("vi-VN")} ({openRate}%)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Nhấp (CTR)</span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {camp.stats.clicked.toLocaleString("vi-VN")} ({ctr}%)
                    </span>
                  </div>
                </div>
              )}

              {isScheduled && (
                <div className="pt-2 flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 p-2.5 rounded-xl border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300">
                  <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Dự kiến tự động phát sóng vào: <strong>{new Date(camp.scheduledAt!).toLocaleString("vi-VN")}</strong></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
