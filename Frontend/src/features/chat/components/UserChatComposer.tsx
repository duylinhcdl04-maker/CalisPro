import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  Sparkles,
  Smile,
  Mic,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { UserChatAttachment } from "../types";

interface UserChatComposerProps {
  onSendMessage: (content: string, attachment?: UserChatAttachment) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  { label: "💪 Hôm nay tập gì?", query: "Chào thầy, hôm nay trong lộ trình của em tập bài gì vậy ạ?" },
  { label: "📹 Nhờ check form", query: "Thầy xem giúp em video form hít đất / pull-up với ạ!" },
  { label: "🩹 Vai hơi mỏi", query: "Thầy ơi, khớp vai của em sau buổi tập hơi mỏi, em có cần nghỉ không?" },
  { label: "🏆 Em vừa đạt PR", query: "Thầy ơi em vừa đạt kỷ lục cá nhân mới hôm nay! 🎉" },
];

export const UserChatComposer: React.FC<UserChatComposerProps> = ({
  onSendMessage,
  disabled,
}) => {
  const [text, setText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<UserChatAttachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingAttachment) return;

    onSendMessage(trimmed || (pendingAttachment ? pendingAttachment.title : ""), pendingAttachment || undefined);
    setText("");
    setPendingAttachment(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (query: string) => {
    onSendMessage(query);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video");
    const isImage = file.type.startsWith("image");

    if (isVideo) {
      setPendingAttachment({
        type: "VIDEO",
        title: `Video Form Check (${file.name})`,
        duration: "0:15",
        actionLabel: "Xem video",
      });
      toast.success(`Đã đính kèm video "${file.name}" để HLV xem xét.`);
    } else if (isImage) {
      setPendingAttachment({
        type: "IMAGE",
        title: `Hình ảnh đính kèm (${file.name})`,
        actionLabel: "Xem ảnh",
      });
      toast.success(`Đã đính kèm ảnh "${file.name}".`);
    }

    e.target.value = "";
  };

  return (
    <div className="border-t border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-[#0f1a38]">
      {/* Quick Suggestion Pills */}
      <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-400">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Gợi ý:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePromptClick(prompt.query)}
            disabled={disabled}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-all hover:border-[#8CA9FF] hover:bg-[#8CA9FF]/10 hover:text-[#547EFF] active:scale-95 disabled:opacity-50 dark:border-slate-700/80 dark:bg-[#152347] dark:text-slate-200 dark:hover:border-[#8CA9FF] dark:hover:text-white"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Pending attachment preview pill */}
      {pendingAttachment && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-[#547EFF] dark:text-[#8CA9FF]">
          <div className="flex items-center gap-2 truncate">
            {pendingAttachment.type === "VIDEO" ? (
              <Video className="h-4 w-4 shrink-0" />
            ) : (
              <ImageIcon className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate font-semibold">{pendingAttachment.title}</span>
          </div>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="rounded-md p-1 hover:bg-blue-500/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Đính kèm ảnh / video form check"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-[#8CA9FF] hover:bg-slate-100 hover:text-[#547EFF] dark:border-slate-700 dark:bg-[#131f3b] dark:text-slate-300 dark:hover:border-[#8CA9FF] dark:hover:text-[#8CA9FF]"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhắn tin với HLV Hoàng Việt (Enter để gửi)..."
            rows={1}
            disabled={disabled}
            className="max-h-[120px] min-h-[38px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[#8CA9FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8CA9FF] disabled:opacity-50 dark:border-slate-700 dark:bg-[#080e1e] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#8CA9FF] dark:focus:bg-[#060b18]"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !pendingAttachment)}
          title="Gửi tin nhắn"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-md shadow-[#8CA9FF]/30 transition-transform hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

};
