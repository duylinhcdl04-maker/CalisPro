import React, { useState } from "react";
import {
  X,
  UserCheck,
  CreditCard,
  Clock,
  Sparkles,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { SubscriberRecord } from "../types/subscription.types";
import { SUBSCRIPTION_STATUS_STYLES, BILLING_CYCLE_LABELS } from "../constants/subscription.constants";
import { toast } from "sonner";

interface SubscriberDetailDrawerProps {
  subscriber: SubscriberRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriberDetailDrawer: React.FC<SubscriberDetailDrawerProps> = ({
  subscriber,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !subscriber) return null;

  const statusStyle = SUBSCRIPTION_STATUS_STYLES[subscriber.status] || SUBSCRIPTION_STATUS_STYLES.ACTIVE;

  const handleAction = (actionName: string) => {
    toast.success(`Đã thực hiện: ${actionName} cho ${subscriber.userName}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-xl flex-col bg-white shadow-2xl dark:bg-zinc-900">
          {/* Header */}
          <div className="border-b border-[#E3E7DF] p-5 dark:border-zinc-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#EEF4E8] font-black text-xl text-[#55733C] ring-2 ring-[#7C9B5B]/30 dark:bg-emerald-950 dark:text-emerald-300">
                  {subscriber.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#172019] dark:text-white">
                      {subscriber.userName}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`} />
                      {statusStyle.label}
                    </span>
                  </div>
                  <div className="text-xs text-[#687268] dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span>{subscriber.userEmail}</span>
                    <span>•</span>
                    <span>{subscriber.userPhone}</span>
                  </div>
                </div>
              </div>

              <button onClick={onClose} className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#F7F8F4] space-y-4 text-xs dark:bg-zinc-950">
            {/* Current Active Plan Banner */}
            <div className="rounded-2xl border border-[#7C9B5B]/30 bg-white p-4.5 shadow-2xs space-y-3 dark:border-emerald-900/60 dark:bg-zinc-900">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#55733C] block dark:text-emerald-400">
                    Gói dịch vụ hiện tại
                  </span>
                  <h4 className="text-base font-black text-[#172019] dark:text-white mt-0.5">
                    {subscriber.planName}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#55733C] dark:text-emerald-400">
                    {subscriber.price.toLocaleString()}đ
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    / {BILLING_CYCLE_LABELS[subscriber.billingCycle]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F0F2ED] text-xs dark:border-zinc-800">
                <div>
                  <span className="text-[#687268] block text-[10px] dark:text-zinc-400">Ngày bắt đầu:</span>
                  <span className="font-semibold text-[#172019] dark:text-zinc-200">{subscriber.startDate}</span>
                </div>
                <div>
                  <span className="text-[#687268] block text-[10px] dark:text-zinc-400">Ngày hết hạn:</span>
                  <span className="font-bold text-[#172019] dark:text-white">{subscriber.expiryDate}</span>
                </div>
                <div>
                  <span className="text-[#687268] block text-[10px] dark:text-zinc-400">Tự động gia hạn (Auto-Renew):</span>
                  <span className={`font-bold ${subscriber.autoRenewal ? "text-emerald-600" : "text-rose-600"}`}>
                    {subscriber.autoRenewal ? "BẬT (ON)" : "TẮT (OFF)"}
                  </span>
                </div>
                <div>
                  <span className="text-[#687268] block text-[10px] dark:text-zinc-400">Số lần gia hạn liên tiếp:</span>
                  <span className="font-semibold text-[#172019] dark:text-zinc-200">{subscriber.consecutiveRenewals} kỳ</span>
                </div>
              </div>
            </div>

            {/* Feature Consumption */}
            <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 shadow-2xs space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#172019] dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#7C9B5B]" />
                Mức độ sử dụng tính năng AI & Huấn luyện
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-semibold">AI Coach Sessions</span>
                  <span className="font-black text-base text-[#172019] dark:text-white">{subscriber.aiCoachingSessionsUsed} phiên</span>
                </div>
                <div className="p-3 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-semibold">AI Motion Quét tư thế</span>
                  <span className="font-black text-base text-[#55733C] dark:text-emerald-400">{subscriber.aiMotionAnalysesUsed} bài test</span>
                </div>
              </div>
            </div>

            {/* Events Timeline */}
            <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 shadow-2xs space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#172019] dark:text-white flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-zinc-400" />
                Lịch sử chu kỳ đăng ký
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F7F8F4] dark:bg-zinc-800/50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#172019] block dark:text-zinc-200">Gia hạn thành công kỳ 03</strong>
                    <span className="text-[10px] text-zinc-400">{subscriber.startDate} • Cổng VNPay QR</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F7F8F4] dark:bg-zinc-800/50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#172019] block dark:text-zinc-200">Nâng cấp từ gói Calis Pro lên Calis Premium</strong>
                    <span className="text-[10px] text-zinc-400">01/08/2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Quick Actions */}
          <div className="border-t border-[#E3E7DF] p-4 bg-white flex flex-wrap items-center justify-between gap-2 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => handleAction("Đổi gói dịch vụ")}
              className="rounded-xl border border-[#E3E7DF] px-3 py-1.5 text-xs font-semibold text-[#172019] hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Đổi gói
            </button>
            <button
              onClick={() => handleAction("Hủy gia hạn tự động")}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            >
              Hủy gia hạn
            </button>
            <button
              onClick={() => handleAction("Hoàn tiền giao dịch")}
              className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
            >
              Hoàn tiền
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-[#7C9B5B] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] ml-auto"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
