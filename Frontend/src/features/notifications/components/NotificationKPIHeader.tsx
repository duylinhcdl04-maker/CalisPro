import React from "react";
import { Send, CheckCircle2, Eye, MousePointerClick, Zap, Bell } from "lucide-react";
import { NotificationKPIs } from "../types/notification.types";

interface NotificationKPIHeaderProps {
  kpis: NotificationKPIs;
  isLoading?: boolean;
}

export const NotificationKPIHeader: React.FC<NotificationKPIHeaderProps> = ({
  kpis,
  isLoading,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng tin nhắn đã gửi */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
            Thông báo đã gửi (Tháng này)
          </span>
          <div className="rounded-xl bg-[#EEF4E8] p-2 text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
            <Send className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#172019] dark:text-white">
            {isLoading ? "..." : `${kpis.totalSentMonthly.toLocaleString("vi-VN")}`}
          </span>
          <span className="text-xs font-bold text-[#55733C] dark:text-emerald-400">
            Email & In-App
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#687268] dark:text-zinc-400">
          {kpis.activeAutomations}/{kpis.totalAutomations} kịch bản Automation đang chạy
        </p>
      </div>

      {/* 2. Tỷ lệ Chuyển phát Thành công */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
            Tỷ lệ Chuyển phát (Delivery Rate)
          </span>
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {isLoading ? "..." : `${kpis.deliveryRate}%`}
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Xuất sắc
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#687268] dark:text-zinc-400">
          Chỉ 1.4% tỷ lệ Bounce / Lỗi hộp thư
        </p>
      </div>

      {/* 3. Tỷ lệ Mở thông báo */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
            Tỷ lệ Mở thư & In-App (Open Rate)
          </span>
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
            <Eye className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#172019] dark:text-white">
            {isLoading ? "..." : `${kpis.openRate}%`}
          </span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            (Chuẩn ngành: 28%)
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#687268] dark:text-zinc-400">
          Nhờ cá nhân hóa AI theo tiến độ thể lực
        </p>
      </div>

      {/* 4. Tỷ lệ Nhấp & Chuyển đổi */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
            Tỷ lệ Nhấp (Click-Through CTR)
          </span>
          <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
            <MousePointerClick className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#55733C] dark:text-emerald-400">
            {isLoading ? "..." : `${kpis.clickThroughRate}%`}
          </span>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            +3.5% MoM
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#687268] dark:text-zinc-400">
          Học viên thực hiện hành động gia hạn / tập luyện
        </p>
      </div>
    </div>
  );
};
