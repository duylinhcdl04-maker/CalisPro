import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Video, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { CoachProfileInfo } from "../types";

interface CoachCallBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: CoachProfileInfo;
  onBookSuccess?: (date: string, time: string, topic: string) => void;
}

const AVAILABLE_TIMES = [
  "08:30 - 09:00",
  "10:00 - 10:30",
  "14:30 - 15:00",
  "16:00 - 16:30",
  "19:30 - 20:00",
  "20:30 - 21:00",
];

const TOPICS = [
  "Sửa Form kỹ thuật 1-1 (15-30 phút)",
  "Tư vấn điều chỉnh giáo án & lộ trình",
  "Đánh giá & Phục hồi chấn thương nhẹ",
  "Hướng dẫn kỹ năng nâng cao (Muscle-up, Planche)",
];

export const CoachCallBookingModal: React.FC<CoachCallBookingModalProps> = ({
  isOpen,
  onClose,
  coach,
  onBookSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-02");
  const [selectedTime, setSelectedTime] = useState<string>(AVAILABLE_TIMES[0]);
  const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS[0]);
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`Đã gửi yêu cầu hẹn lịch tư vấn 1-1 với ${coach.name} vào ${selectedTime}, ngày ${selectedDate}!`);
      if (onBookSuccess) {
        onBookSuccess(selectedDate, selectedTime, selectedTopic);
      }
      onClose();
    }, 600);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0b1329]">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-[#547EFF] dark:text-[#8CA9FF]">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Đặt lịch Tư vấn 1-1 với Coach
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gặp trực tuyến qua Google Meet hoặc CalisLive
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Coach Card */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-[#0f1a38] dark:border dark:border-slate-800">
          <img
            src={coach.avatar}
            alt={coach.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-[#8CA9FF]/30"
          />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {coach.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {coach.title} • ⭐ {coach.rating}/5.0
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Nội dung buổi tư vấn:
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-[#080e1e] dark:text-white"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t} className="dark:bg-[#0b1329]">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Ngày hẹn:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-[#080e1e] dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Khung giờ:
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-[#080e1e] dark:text-white"
              >
                {AVAILABLE_TIMES.map((time) => (
                  <option key={time} value={time} className="dark:bg-[#0b1329]">
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Ghi chú cho HLV trước buổi hẹn:
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Em muốn HLV kiểm tra kỹ góc cùi chỏ khi lên xà..."
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-[#080e1e] dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "Đang gửi..." : "Xác nhận đặt lịch"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
