import React, { useState } from "react";
import { X, Zap, Mail, Smartphone, Bell, CheckCircle2 } from "lucide-react";
import {
  NotificationCategory,
  NotificationChannel,
} from "../types/notification.types";

interface CreateAutomationRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ruleData: any) => Promise<void>;
}

export const CreateAutomationRuleModal: React.FC<CreateAutomationRuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("SUBSCRIPTION");
  const [triggerEvent, setTriggerEvent] = useState("SUBSCRIPTION_EXPIRING_3_DAYS");
  const [conditionSummary, setConditionSummary] = useState("");
  const [targetAudience, setTargetAudience] = useState("Hội viên Gói Pro & Premium");
  const [channels, setChannels] = useState<NotificationChannel[]>(["EMAIL", "IN_APP"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleChannel = (ch: NotificationChannel) => {
    if (channels.includes(ch)) {
      if (channels.length > 1) {
        setChannels(channels.filter((c) => c !== ch));
      }
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        description,
        category,
        triggerEvent,
        conditionSummary: conditionSummary || "Thỏa mãn điều kiện sự kiện hệ thống",
        targetAudience,
        channels,
        templateId: "TPL_DEFAULT",
        status: "ACTIVE",
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-[#E3E7DF] bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E3E7DF] px-6 py-4 dark:border-zinc-800 bg-[#F7F8F4] dark:bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#EEF4E8] p-2 text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172019] dark:text-white">
                Tạo Kịch bản Tự động hóa mới (Automation Rule)
              </h3>
              <p className="text-[11px] text-[#687268] dark:text-zinc-400">
                Thiết lập Trigger lắng nghe sự kiện và gửi thông báo theo điều kiện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
              Tên kịch bản Automation *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nhắc gia hạn gói trước 7 ngày..."
              className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                Phân loại nghiệp vụ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
              >
                <option value="SUBSCRIPTION">Gói cước (Subscription)</option>
                <option value="TRIAL">Dùng thử (Trial)</option>
                <option value="TRAINING">Tập luyện (Training)</option>
                <option value="ACHIEVEMENT">Thành tích (Achievement)</option>
                <option value="ASSESSMENT">Đánh giá thể lực (Assessment)</option>
                <option value="SYSTEM">Hệ thống & Thanh toán</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                Sự kiện Kích hoạt (Trigger Event)
              </label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-mono text-[11px] font-semibold dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
              >
                <option value="SUBSCRIPTION_EXPIRING_3_DAYS">SUBSCRIPTION_EXPIRING_3_DAYS</option>
                <option value="SUBSCRIPTION_EXPIRING_7_DAYS">SUBSCRIPTION_EXPIRING_7_DAYS</option>
                <option value="TRIAL_EXPIRING_24_HOURS">TRIAL_EXPIRING_24_HOURS</option>
                <option value="ASSESSMENT_DUE_MONTHLY">ASSESSMENT_DUE_MONTHLY</option>
                <option value="PR_RECORD_BROKEN">PR_RECORD_BROKEN</option>
                <option value="INACTIVITY_3_DAYS">INACTIVITY_3_DAYS</option>
                <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
              Điều kiện lọc (Condition Filter Summary)
            </label>
            <input
              type="text"
              value={conditionSummary}
              onChange={(e) => setConditionSummary(e.target.value)}
              placeholder="VD: Hội viên chưa kích hoạt tính năng Auto-Renewal"
              className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
              Kênh gửi thông báo
            </label>
            <div className="flex items-center gap-3">
              {[
                { id: "EMAIL", label: "Email", icon: Mail },
                { id: "IN_APP", label: "In-App Popup", icon: Bell },
                { id: "PUSH", label: "Push Noti", icon: Smartphone },
              ].map((ch) => {
                const Icon = ch.icon;
                const isSelected = channels.includes(ch.id as NotificationChannel);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id as NotificationChannel)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? "border-[#7C9B5B] bg-[#EEF4E8] text-[#55733C] dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-[#E3E7DF] bg-white text-[#687268] dark:border-zinc-800 dark:bg-zinc-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#E3E7DF] dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E3E7DF] bg-white px-4 py-2 text-xs font-bold text-[#687268] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#7C9B5B] px-5 py-2 text-xs font-bold text-white hover:bg-[#55733C] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang tạo..." : "Kích hoạt Kịch bản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
