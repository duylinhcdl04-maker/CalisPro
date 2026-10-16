import React, { useState, useRef } from "react";
import {
  X,
  Send,
  Mail,
  Smartphone,
  Bell,
  Users,
  Clock,
  Sparkles,
  Eye,
  Edit3,
  UserCheck,
  Calendar,
  CreditCard,
  Link,
  Flame,
} from "lucide-react";
import {
  NotificationCategory,
  NotificationChannel,
} from "../types/notification.types";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: any) => Promise<void>;
}

// Visual smart variables with friendly Vietnamese labels
const SMART_VARIABLES = [
  { tag: "user.name", label: "👤 Tên học viên", sample: "Nguyễn Văn Tuấn" },
  { tag: "subscription.plan", label: "📦 Gói hội viên", sample: "Calis Premium" },
  { tag: "subscription.expiry_date", label: "📅 Ngày hết hạn", sample: "01/10/2026" },
  { tag: "subscription.price", label: "💵 Giá gói cước", sample: "299.000 ₫" },
  { tag: "action.renewal_url", label: "🔗 Link gia hạn nhanh", sample: "https://calishealth.vn/renew" },
];

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("SUBSCRIPTION");
  const [targetAudience, setTargetAudience] = useState("Hội viên Gói Pro & Free tích cực");
  const [recipientCount, setRecipientCount] = useState(3200);
  const [subject, setSubject] = useState("");
  const [bodyPreview, setBodyPreview] = useState(
    "Chào {{user.name}}, gói hội viên {{subscription.plan}} của bạn sắp hết hạn vào {{subscription.expiry_date}}. Hãy gia hạn ngay hôm nay để nhận ưu đãi đặc biệt!"
  );
  const [channels, setChannels] = useState<NotificationChannel[]>(["EMAIL", "IN_APP"]);
  const [sendType, setSendType] = useState<"NOW" | "SCHEDULE">("NOW");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Insert variable at cursor position
  const insertVariable = (tag: string) => {
    const textToInsert = `{{${tag}}}`;
    if (!textareaRef.current) {
      setBodyPreview((prev) => prev + " " + textToInsert);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + textToInsert + text.substring(end);
    setBodyPreview(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 50);
  };

  // Render real user preview
  const getRenderedPreviewText = (rawText: string) => {
    let result = rawText;
    SMART_VARIABLES.forEach((v) => {
      result = result.split(`{{${v.tag}}}`).join(v.sample);
    });
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        category,
        channels,
        targetAudience,
        recipientCount: Number(recipientCount) || 1000,
        subject,
        bodyPreview,
        status: sendType === "NOW" ? "COMPLETED" : "SCHEDULED",
        scheduledAt: sendType === "SCHEDULE" ? scheduledAt : undefined,
        sentAt: sendType === "NOW" ? new Date().toISOString() : undefined,
        createdBy: "Marketing Lead",
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
      <div className="w-full max-w-2xl rounded-3xl border border-[#E3E7DF] bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3E7DF] px-6 py-4 dark:border-zinc-800 bg-[#F7F8F4] dark:bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#EEF4E8] p-2 text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172019] dark:text-white">
                Tạo Chiến dịch Thông báo Mới (Broadcast Campaign)
              </h3>
              <p className="text-[11px] text-[#687268] dark:text-zinc-400">
                Gửi thông điệp cá nhân hóa tự động đến hàng nghìn học viên cùng lúc
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
              Tên chiến dịch nội bộ *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Chiến dịch Chào hè - Ưu đãi 30% Gói Annual..."
              className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                Phân loại chiến dịch
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
              >
                <option value="SUBSCRIPTION">Khuyến mãi Gói Hội viên</option>
                <option value="ACHIEVEMENT">Sự kiện & Giải đấu</option>
                <option value="SYSTEM">Cập nhật Tính năng AI</option>
                <option value="TRAINING">Cẩm nang & Động lực tập</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                Tệp Học viên Nhận tin ({recipientCount.toLocaleString("vi-VN")} người)
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3 py-2 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
              >
                <option value="Toàn bộ người dùng CalisHealth">Toàn bộ người dùng (Tự động gửi theo danh sách)</option>
                <option value="Hội viên Gói Pro & Free tích cực">Gói Free tích cực & Pro (Tự động lọc)</option>
                <option value="Học viên đang Dùng thử (Trial)">Học viên Dùng thử Trial (Tự động lọc)</option>
                <option value="Chỉ Hội viên Gói Premium">Đặc quyền Gói Premium (Tự động lọc)</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
              Tiêu đề Thông báo / Subject Email *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="VD: 🔥 [CalisHealth] Mở khóa AI Vision không giới hạn - Tiết kiệm ngay 30%..."
              className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* SMART VARIABLE INSERTION TOOLBAR */}
          <div className="space-y-2 rounded-2xl border border-[#E3E7DF] bg-[#F7F8F4] p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172019] dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#7C9B5B]" />
                <span>Chèn nhanh thông tin học viên (Bấm để chèn tự động):</span>
              </span>
              <span className="text-[10px] text-[#687268] dark:text-zinc-400">
                Tự động thay đổi theo từng người nhận
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {SMART_VARIABLES.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E3E7DF] bg-white px-2.5 py-1 text-xs font-bold text-[#55733C] shadow-2xs hover:bg-[#EEF4E8] hover:border-[#7C9B5B] dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-300 transition-all"
                >
                  <span>{v.label}</span>
                  <span className="text-[10px] font-normal text-zinc-400">+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Content & Live Preview Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172019] dark:text-white">
                Nội dung thông điệp gửi tới học viên *
              </label>

              {/* Preview Mode Switch */}
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  isPreviewMode
                    ? "bg-[#7C9B5B] text-white shadow-2xs"
                    : "bg-[#EEF4E8] text-[#55733C] hover:bg-[#7C9B5B] hover:text-white dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {isPreviewMode ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{isPreviewMode ? "Quay lại Chỉnh sửa" : "Xem trước mẫu khi gửi đi"}</span>
              </button>
            </div>

            {isPreviewMode ? (
              /* LIVE PREVIEW FOR REAL USER */
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 space-y-2 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 border-b border-emerald-200 pb-2 dark:border-emerald-900">
                  <UserCheck className="h-4 w-4 text-[#55733C]" />
                  <span>Ví dụ thực tế khi gửi đến học viên: <strong>Nguyễn Văn Tuấn</strong></span>
                </div>
                <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line pt-1 font-sans">
                  {getRenderedPreviewText(bodyPreview)}
                </div>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 italic pt-2">
                  ✓ Khi gửi cho 3,200 học viên khác, hệ thống sẽ tự động thay đúng Tên, Gói và Ngày hết hạn của từng người.
                </p>
              </div>
            ) : (
              /* EDIT TEXTAREA */
              <textarea
                ref={textareaRef}
                rows={4}
                value={bodyPreview}
                onChange={(e) => setBodyPreview(e.target.value)}
                placeholder="Nhập nội dung thông báo... Bấm các nút phía trên để chèn Tên học viên, Gói, Ngày hết hạn..."
                className="w-full rounded-2xl border border-[#E3E7DF] bg-white p-3.5 text-xs font-medium leading-relaxed dark:border-zinc-800 dark:bg-zinc-800 dark:text-white focus:border-[#7C9B5B] focus:outline-none"
              />
            )}
          </div>

          {/* Channel and Timing */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                Kênh phát sóng
              </label>
              <div className="flex items-center gap-2">
                {[
                  { id: "EMAIL", label: "Email", icon: Mail },
                  { id: "IN_APP", label: "In-App", icon: Bell },
                  { id: "PUSH", label: "Push", icon: Smartphone },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isSelected = channels.includes(ch.id as NotificationChannel);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id as NotificationChannel)}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-[#7C9B5B] bg-[#EEF4E8] text-[#55733C] dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-[#E3E7DF] bg-white text-[#687268] dark:border-zinc-800 dark:bg-zinc-800"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                Thời điểm phát sóng
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSendType("NOW")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-all ${
                    sendType === "NOW"
                      ? "border-[#7C9B5B] bg-[#7C9B5B] text-white"
                      : "border-[#E3E7DF] bg-white text-[#687268] dark:border-zinc-800 dark:bg-zinc-800"
                  }`}
                >
                  Gửi ngay
                </button>
                <button
                  type="button"
                  onClick={() => setSendType("SCHEDULE")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-all ${
                    sendType === "SCHEDULE"
                      ? "border-[#7C9B5B] bg-[#7C9B5B] text-white"
                      : "border-[#E3E7DF] bg-white text-[#687268] dark:border-zinc-800 dark:bg-zinc-800"
                  }`}
                >
                  Hẹn giờ
                </button>
              </div>
            </div>
          </div>

          {sendType === "SCHEDULE" && (
            <div>
              <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                Thời gian phát sóng dự kiến
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t border-[#E3E7DF] dark:border-zinc-800">
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
              {isSubmitting
                ? "Đang xử lý..."
                : sendType === "NOW"
                ? `Tự động gửi cho ${recipientCount.toLocaleString("vi-VN")} học viên`
                : "Lên lịch chiến dịch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
