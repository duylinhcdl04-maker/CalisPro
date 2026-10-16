import React, { useState } from "react";
import {
  FileCode,
  Mail,
  Smartphone,
  Bell,
  Eye,
  Edit3,
  Copy,
  Check,
  Code2,
  Sparkles,
} from "lucide-react";
import { NotificationTemplate } from "../types/notification.types";

interface TemplateLibraryTabProps {
  templates: NotificationTemplate[];
  onSelectTemplate?: (tpl: NotificationTemplate) => void;
}

export const TemplateLibraryTab: React.FC<TemplateLibraryTabProps> = ({
  templates,
}) => {
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const copyToClipboard = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-[#172019] dark:text-white flex items-center gap-2">
          <FileCode className="h-4 w-4 text-[#7C9B5B]" />
          <span>Kho Mẫu Thông báo & Biến Động (Notification Templates & Variables)</span>
        </h3>
        <p className="text-xs text-[#687268] dark:text-zinc-400 mt-0.5">
          Quản lý các mẫu Email HTML và In-App Popup. Tự động điền dữ liệu cá nhân hóa qua biến động {"{{...}}"}
        </p>
      </div>

      {/* Available Variables Helper Box with Friendly Vietnamese Labels */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-[#F7F8F4] p-4.5 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-bold text-[#172019] dark:text-white flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#7C9B5B]" />
            <span>Thẻ thông tin cá nhân hóa (Bấm để copy - Tự động điền theo từng học viên):</span>
          </span>
          <span className="text-[11px] text-[#55733C] dark:text-emerald-400 font-medium">
            ✓ Không cần nhập thủ công từng người
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { tag: "user.name", label: "👤 Tên học viên", sample: "Nguyễn Văn Tuấn" },
            { tag: "user.email", label: "📧 Email học viên", sample: "tuan.nguyen@gmail.com" },
            { tag: "subscription.plan", label: "📦 Gói hội viên", sample: "Calis Premium" },
            { tag: "subscription.expiry_date", label: "📅 Ngày hết hạn gói", sample: "01/10/2026" },
            { tag: "subscription.price", label: "💵 Giá gói cước", sample: "299.000 ₫" },
            { tag: "workout.exercise_name", label: "🏆 Tên bài tập", sample: "Muscle-up" },
            { tag: "achievement.metric_value", label: "🔥 Kỷ lục đạt được", sample: "18 reps chuẩn" },
            { tag: "action.renewal_url", label: "🔗 Link gia hạn nhanh", sample: "https://calishealth.vn/renew" },
          ].map((v) => (
            <button
              key={v.tag}
              onClick={() => copyToClipboard(v.tag)}
              title={`Bấm để copy thẻ ${v.label} (Ví dụ mẫu: ${v.sample})`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3 py-1.5 text-xs font-bold text-[#172019] shadow-2xs hover:border-[#7C9B5B] hover:bg-[#EEF4E8] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              <span>{v.label}</span>
              {copiedVar === v.tag ? (
                <span className="rounded bg-emerald-100 px-1 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Đã chép
                </span>
              ) : (
                <Copy className="h-3 w-3 text-zinc-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => {
          const isEmail = tpl.channel === "EMAIL";
          const isInApp = tpl.channel === "IN_APP";

          return (
            <div
              key={tpl.id}
              className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-xs space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF4E8] px-2 py-0.5 text-[10px] font-bold text-[#55733C] dark:bg-zinc-800 dark:text-zinc-300">
                    {isEmail && <Mail className="h-3 w-3 text-blue-500" />}
                    {isInApp && <Bell className="h-3 w-3 text-[#7C9B5B]" />}
                    {tpl.channel === "PUSH" && <Smartphone className="h-3 w-3 text-purple-500" />}
                    {tpl.category}
                  </span>

                  <span className="text-[10px] font-mono text-[#687268] dark:text-zinc-400">
                    {tpl.code}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#172019] dark:text-white">
                  {tpl.name}
                </h4>

                <p className="text-[11px] text-[#687268] line-clamp-2 dark:text-zinc-400">
                  {tpl.description}
                </p>

                <div className="rounded-xl border border-[#E3E7DF] bg-zinc-50 p-2.5 text-xs text-zinc-700 font-mono line-clamp-3 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
                  {tpl.subject}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-[#E3E7DF] dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] text-[#687268] dark:text-zinc-400">
                  {tpl.variables.length} biến động
                </span>

                <button
                  onClick={() => setPreviewTemplate(tpl)}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#EEF4E8] px-3 py-1.5 text-xs font-bold text-[#55733C] hover:bg-[#7C9B5B] hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem trước Mẫu</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Live Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-[#E3E7DF] bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E3E7DF] px-6 py-4 dark:border-zinc-800 bg-[#F7F8F4] dark:bg-zinc-900">
              <div>
                <h3 className="text-sm font-bold text-[#172019] dark:text-white">
                  Xem trước Mẫu: {previewTemplate.name}
                </h3>
                <p className="text-[11px] text-[#687268] dark:text-zinc-400">
                  Kênh gửi: {previewTemplate.channel} • Phân loại: {previewTemplate.category}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="rounded-xl border border-[#E3E7DF] bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/50">
                <strong className="text-zinc-900 dark:text-white">Tiêu đề (Subject):</strong>
                <div className="mt-1 font-mono text-zinc-700 dark:text-zinc-300">
                  {previewTemplate.subject}
                </div>
              </div>

              <div>
                <strong className="text-xs text-zinc-900 dark:text-white block mb-2">
                  Nội dung Hiển thị (Rendered Preview):
                </strong>
                {previewTemplate.channel === "EMAIL" ? (
                  <div
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:bg-zinc-950"
                    dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
                  />
                ) : (
                  <div className="rounded-2xl border border-[#7C9B5B]/30 bg-[#EEF4E8]/50 p-4 shadow-xs dark:bg-emerald-950/20 text-xs text-[#172019] dark:text-white leading-relaxed">
                    {previewTemplate.body}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
