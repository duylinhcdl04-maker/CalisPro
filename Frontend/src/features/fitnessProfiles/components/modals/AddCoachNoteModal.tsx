import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, MessageSquarePlus, Tag, Pin, Check } from "lucide-react";
import { FitnessProfile } from "../../types/fitnessProfile";

interface AddCoachNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile: FitnessProfile | null;
  onAddNote: (data: {
    content: string;
    tags: string[];
    priority: "normal" | "important" | "urgent";
    isPinned: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

const AVAILABLE_TAGS = [
  "Mobility",
  "Core",
  "Technique",
  "Strength",
  "Injury Prevention",
  "Handstand",
  "Milestone",
  "Diet & Recovery",
  "Mindset",
];

export const AddCoachNoteModal: React.FC<AddCoachNoteModalProps> = ({
  isOpen,
  onClose,
  studentProfile,
  onAddNote,
  isLoading,
}) => {
  const [content, setContent] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Technique"]);
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [isPinned, setIsPinned] = useState<boolean>(false);

  if (!isOpen || !studentProfile) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onAddNote({
      content,
      tags: selectedTags,
      priority,
      isPinned,
    });
    setContent("");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-[#E3E7DF] bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between border-b border-[#F0F2ED] pb-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <MessageSquarePlus className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Thêm Ghi chú Huấn luyện viên
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#687268] dark:text-zinc-400">
              Ghi lại nhận xét chuyên môn, nhắc nhở điều chỉnh form hoặc kế hoạch phát triển.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Student Target Summary */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#F7F8F4] p-3 dark:bg-zinc-800/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8CA9FF]/15 font-bold text-[#1e3a8a] ring-2 ring-[#8CA9FF]/30 dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
            {studentProfile.student.initials}
          </div>
          <div>
            <div className="text-sm font-bold text-[#172019] dark:text-white">
              {studentProfile.student.fullName}
            </div>
            <div className="text-xs text-[#687268] dark:text-zinc-400">
              Mã HV: {studentProfile.student.code} • Mục tiêu: {studentProfile.student.primaryGoal}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Note content */}
          <div>
            <label className="block text-xs font-semibold text-[#172019] dark:text-zinc-200">
              Nội dung nhận xét / chỉ đạo:
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="VD: Core control đã cải thiện rõ. Cần tập trung thêm vào shoulder mobility trước bài tập nâng cao..."
              rows={4}
              required
              className="mt-1.5 w-full rounded-xl border border-[#E3E7DF] bg-white p-3 text-xs text-[#172019] placeholder-zinc-400 focus:border-[#8CA9FF] focus:ring-1 focus:ring-[#8CA9FF] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#172019] dark:text-zinc-200">
              <Tag className="h-3.5 w-3.5 text-[#547EFF]" />
              Gắn nhãn (Tags):
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-xs"
                        : "border border-[#E3E7DF] bg-white text-[#687268] hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority & Pinned */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172019] dark:text-zinc-200">
                Mức độ ưu tiên:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "normal" | "important" | "urgent")}
                className="mt-1.5 h-10 w-full rounded-xl border border-[#E3E7DF] bg-white px-3 text-xs text-[#172019] focus:border-[#8CA9FF] focus:ring-1 focus:ring-[#8CA9FF] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="normal">Bình thường (Normal)</option>
                <option value="important">Quan trọng (Important)</option>
                <option value="urgent">Khẩn cấp (Urgent)</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl border border-[#E3E7DF] bg-white px-3 text-xs font-medium text-[#172019] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-[#547EFF] focus:ring-[#8CA9FF]"
                />
                <Pin className="h-3.5 w-3.5 text-[#547EFF]" />
                Ghim lên đầu hồ sơ
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#F0F2ED] pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E3E7DF] px-4 py-2 text-xs font-medium text-[#687268] hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {isLoading ? "Đang lưu..." : "Lưu ghi chú"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
