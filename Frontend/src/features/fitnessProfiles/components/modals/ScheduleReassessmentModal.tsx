import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, User, ClipboardCheck, Sparkles } from "lucide-react";
import { FitnessProfile } from "../../types/fitnessProfile";

interface ScheduleReassessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile: FitnessProfile | null;
  onSchedule: (data: { date: string; name: string; note?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const ScheduleReassessmentModal: React.FC<ScheduleReassessmentModalProps> = ({
  isOpen,
  onClose,
  studentProfile,
  onSchedule,
  isLoading,
}) => {
  const [assessmentName, setAssessmentName] = useState<string>("Periodic Reassessment Q4");
  const [scheduledDate, setScheduledDate] = useState<string>("2026-10-24");
  const [coachNote, setCoachNote] = useState<string>("");

  if (!isOpen || !studentProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = scheduledDate.split("-").reverse().join("/");
    await onSchedule({
      date: formatted,
      name: assessmentName,
      note: coachNote,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-[#E3E7DF] bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">

        <div className="flex items-start justify-between border-b border-[#F0F2ED] pb-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Lên lịch Đánh giá lại Thể lực
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#687268] dark:text-zinc-400">
              Chỉ định bài kiểm tra định kỳ để hệ thống tự động thông báo và chuẩn bị lộ trình.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Student card summary */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#F7F8F4] p-3 dark:bg-zinc-800/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8CA9FF]/15 font-bold text-[#1e3a8a] ring-2 ring-[#8CA9FF]/30 dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
            {studentProfile.student.initials}
          </div>
          <div>
            <div className="text-sm font-bold text-[#172019] dark:text-white">
              {studentProfile.student.fullName} ({studentProfile.student.code})
            </div>
            <div className="text-xs text-[#687268] dark:text-zinc-400">
              Điểm hiện tại: <span className="font-semibold text-[#547EFF]">{studentProfile.overallScore}/100</span> • Cấp độ: {studentProfile.level}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Assessment Name Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#172019] dark:text-zinc-200">
              Chọn loại bài đánh giá:
            </label>
            <select
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-[#E3E7DF] bg-white px-3 text-xs text-[#172019] focus:border-[#8CA9FF] focus:ring-1 focus:ring-[#8CA9FF] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="Periodic Reassessment Q4">Periodic Reassessment (Định kỳ tiêu chuẩn)</option>
              <option value="Upper Body Strength Battery">Upper Body Strength Battery (Sức mạnh thân trên)</option>
              <option value="Mobility & Posture Battery">Mobility & Posture Battery (Linh hoạt & Khớp)</option>
              <option value="Elite Skill Verification Battery">Elite Skill Verification (Xác thực kỹ năng nâng cao)</option>
              <option value="Handstand & Balance Milestone">Handstand & Balance Milestone (Thăng bằng tay)</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#172019] dark:text-zinc-200">
              Ngày hẹn đánh giá:
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-[#E3E7DF] bg-white px-3 text-xs text-[#172019] focus:border-[#8CA9FF] focus:ring-1 focus:ring-[#8CA9FF] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              required
            />
          </div>

          {/* Coach Note */}
          <div>
            <label className="block text-xs font-semibold text-[#172019] dark:text-zinc-200">
              Ghi chú cho buổi test (Tùy chọn):
            </label>
            <textarea
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              placeholder="VD: Chú ý kiểm tra thêm biên độ khớp vai và nhịp thở khi hít đất..."
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-[#E3E7DF] bg-white p-3 text-xs text-[#172019] placeholder-zinc-400 focus:border-[#8CA9FF] focus:ring-1 focus:ring-[#8CA9FF] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
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
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <ClipboardCheck className="h-4 w-4" />
              {isLoading ? "Đang lưu..." : "Xác nhận lên lịch"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

