import React from "react";
import {
  Zap,
  Mail,
  Smartphone,
  Bell,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Plus,
  Sliders,
  Filter,
} from "lucide-react";
import { AutomationRule } from "../types/notification.types";

interface AutomationRulesTabProps {
  rules: AutomationRule[];
  onToggleStatus: (ruleId: string) => void;
  onCreateRule: () => void;
}

export const AutomationRulesTab: React.FC<AutomationRulesTabProps> = ({
  rules,
  onToggleStatus,
  onCreateRule,
}) => {
  return (
    <div className="space-y-4">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#172019] dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#7C9B5B]" />
            <span>Kịch bản Tự động hóa Thông minh (Smart Automation Engine)</span>
          </h3>
          <p className="text-xs text-[#687268] dark:text-zinc-400">
            Hệ thống tự động lắng nghe sự kiện (Event-Driven) từ Subscription, AI Assessment và Workout để gửi thông báo kịp thời
          </p>
        </div>

        <button
          onClick={onCreateRule}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo Kịch bản mới</span>
        </button>
      </div>

      {/* Grid of Automation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rules.map((rule) => {
          const isActive = rule.status === "ACTIVE";

          return (
            <div
              key={rule.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 shadow-2xs hover:shadow-sm ${
                isActive
                  ? "border-[#E3E7DF] bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  : "border-zinc-200 bg-zinc-50/70 opacity-75 dark:border-zinc-800 dark:bg-zinc-900/40"
              }`}
            >
              <div className="space-y-3.5">
                {/* Top: Status & Toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                        }`}
                      />
                      {isActive ? "ĐANG CHẠY" : "TẠM DỪNG"}
                    </span>

                    <span className="rounded-md bg-[#EEF4E8] px-2 py-0.5 text-[10px] font-bold text-[#55733C] dark:bg-zinc-800 dark:text-zinc-300">
                      {rule.category}
                    </span>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    onClick={() => onToggleStatus(rule.id)}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                      isActive
                        ? "text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                        : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <PauseCircle className="h-4 w-4" />
                        <span>Tạm dừng</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        <span>Kích hoạt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Rule Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-[#172019] dark:text-white">
                    {rule.name}
                  </h4>
                  <p className="text-xs text-[#687268] dark:text-zinc-400 mt-1 leading-relaxed">
                    {rule.description}
                  </p>
                </div>

                {/* Event Flow Diagram: Event ➔ Condition ➔ Channels */}
                <div className="rounded-xl border border-[#E3E7DF] bg-[#F7F8F4] p-3 text-xs space-y-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-[#687268] uppercase text-[9px] shrink-0 dark:text-zinc-400">
                      Sự kiện kích hoạt:
                    </span>
                    <span className="font-mono font-bold text-[#55733C] truncate dark:text-emerald-400">
                      {rule.triggerEvent}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-[#687268] uppercase text-[9px] shrink-0 dark:text-zinc-400">
                      Điều kiện lọc:
                    </span>
                    <span className="text-[#172019] truncate dark:text-zinc-300">
                      {rule.conditionSummary}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                    <span className="font-bold text-[#687268] uppercase text-[9px] dark:text-zinc-400">
                      Kênh phát thông báo:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {rule.channels.map((ch) => (
                        <span
                          key={ch}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-700 shadow-2xs border border-[#E3E7DF] dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                        >
                          {ch === "EMAIL" && <Mail className="h-3 w-3 text-blue-500" />}
                          {ch === "IN_APP" && <Bell className="h-3 w-3 text-[#7C9B5B]" />}
                          {ch === "PUSH" && <Smartphone className="h-3 w-3 text-purple-500" />}
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="mt-4 pt-3 border-t border-[#E3E7DF] dark:border-zinc-800 grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Kích hoạt</span>
                  <span className="text-xs font-bold text-[#172019] dark:text-white">
                    {rule.stats.triggered.toLocaleString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Đã gửi</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {rule.stats.delivered.toLocaleString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Tỷ lệ Mở</span>
                  <span className="text-xs font-bold text-[#55733C] dark:text-emerald-400">
                    {rule.stats.openRate}%
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#687268] dark:text-zinc-400">Chuyển đổi</span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {rule.stats.conversionRate ? `${rule.stats.conversionRate}%` : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
