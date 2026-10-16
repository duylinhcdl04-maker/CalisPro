import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Minus,
  Video,
  Sparkles,
  RotateCcw,
  Shield,
  Clock,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { UserChatMessage, CoachProfileInfo, UserChatAttachment } from "../types";
import { userChatService } from "../services/userChatService";
import { UserChatMessageBubble } from "./UserChatMessageBubble";
import { UserChatComposer } from "./UserChatComposer";
import { CoachCallBookingModal } from "./CoachCallBookingModal";

interface UserCoachChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export const UserCoachChatWindow: React.FC<UserCoachChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
}) => {
  const [messages, setMessages] = useState<UserChatMessage[]>([]);
  const [coach, setCoach] = useState<CoachProfileInfo>(userChatService.getCoachInfo());
  const [isCoachTyping, setIsCoachTyping] = useState<boolean>(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);
  const [showCoachDetails, setShowCoachDetails] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages on mount / open
  useEffect(() => {
    if (isOpen) {
      const loaded = userChatService.getMessages();
      setMessages(loaded);
      userChatService.markAllAsRead();
    }
  }, [isOpen]);

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isCoachTyping, isOpen]);

  const handleSendMessage = (content: string, attachment?: UserChatAttachment) => {
    const newMsg = userChatService.sendMessage(content, "TEXT", attachment);
    setMessages((prev) => [...prev, newMsg]);

    // Simulate smart Coach AI reply after delay
    setIsCoachTyping(true);
    const delay = Math.floor(Math.random() * 1000) + 1200; // 1.2s - 2.2s

    setTimeout(() => {
      const { reply, attachment: replyAttachment } = userChatService.generateCoachReply(content);
      const coachMsg: UserChatMessage = {
        id: `coach-msg-${Date.now()}`,
        sender: "COACH",
        kind: replyAttachment ? "WORKOUT_RECOMMENDATION" : "TEXT",
        content: reply,
        attachment: replyAttachment || null,
        sentAt: new Date().toISOString(),
        read: true,
      };

      const updated = [...userChatService.getMessages(), coachMsg];
      userChatService.saveMessages(updated);
      setMessages(updated);
      setIsCoachTyping(false);
    }, delay);
  };

  const handleResetChat = () => {
    userChatService.clearHistory();
    setMessages(userChatService.getMessages());
    toast.success("Đã làm mới lịch sử cuộc trò chuyện với Coach.");
  };

  const handleBookCallSuccess = (date: string, time: string, topic: string) => {
    const bookingMsg: UserChatMessage = {
      id: `system-msg-${Date.now()}`,
      sender: "SYSTEM",
      kind: "TEXT",
      content: `Đã lên lịch hẹn tư vấn 1-1 với HLV (${topic}) lúc ${time}, ngày ${date}.`,
      sentAt: new Date().toISOString(),
      read: true,
    };
    const updated = [...userChatService.getMessages(), bookingMsg];
    userChatService.saveMessages(updated);
    setMessages(updated);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex h-[620px] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 dark:border-slate-800 dark:bg-[#0b1329] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
        {/* Chatbox Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#AAC4F5]/15 via-white to-white px-4 py-3 dark:border-slate-800/80 dark:bg-[#0f1a38] dark:from-[#0f1a38] dark:via-[#0f1a38] dark:to-[#0f1a38]">
          <div
            className="flex cursor-pointer items-center gap-2.5 min-w-0 flex-1"
            onClick={() => setShowCoachDetails((prev) => !prev)}
            title="Nhấn để xem thông tin HLV"
          >
            <div className="relative shrink-0">
              <img
                src={coach.avatar}
                alt={coach.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-[#8CA9FF]/40 shadow-xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1329]">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {coach.name}
                </h4>
                <span className="rounded-md bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-1.5 py-0.2 text-[9px] font-black text-white shadow-2xs">
                  COACH
                </span>
              </div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Trực tuyến • Phản hồi {coach.responseRate}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              title="Đặt lịch gọi tư vấn 1-1"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-50 text-[#547EFF] transition-colors hover:bg-blue-100 hover:text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-[#8CA9FF]"
            >
              <Video className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleResetChat}
              title="Làm mới cuộc trò chuyện"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onMinimize}
              title="Thu nhỏ khung chat"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Minus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Đóng khung chat"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Coach Details Dropdown Panel */}
        {showCoachDetails && (
          <div className="border-b border-slate-100 bg-slate-50/90 p-3 text-xs dark:border-slate-800 dark:bg-[#0e1730] animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-800 dark:text-white">
                {coach.title}
              </div>
              <div className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{coach.rating}</span>
                <span className="text-slate-400">({coach.reviewsCount})</span>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {coach.bio}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {coach.specialties.map((spec) => (
                <span
                  key={spec}
                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-700 dark:bg-[#131f3b] dark:text-slate-300"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin bg-slate-50/40 dark:bg-[#060b18]">
          {/* Welcome Pill Banner */}
          <div className="rounded-2xl border border-[#8CA9FF]/20 bg-gradient-to-r from-[#AAC4F5]/10 via-[#8CA9FF]/10 to-transparent p-3 text-center dark:border-blue-500/20 dark:bg-blue-950/20">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#547EFF] dark:text-[#8CA9FF]">
              <Shield className="h-3.5 w-3.5" />
              <span>HLV 1-1 Calisthenics Chuyên Nghiệp</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Mọi trao đổi được đồng bộ trực tiếp với dữ liệu thể lực & bài tập của bạn.
            </p>
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <UserChatMessageBubble
              key={msg.id}
              message={msg}
              coach={coach}
              onActionClick={() => onClose()}
            />
          ))}

          {/* Live Typing Indicator */}
          {isCoachTyping && (
            <div className="flex items-center gap-2.5">
              <img
                src={coach.avatar}
                alt={coach.name}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-[#8CA9FF]/30"
              />
              <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500 shadow-xs dark:border-slate-700/60 dark:bg-[#111c38] dark:text-slate-300">
                <span className="text-[11px]">{coach.name} đang soạn tin</span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#547EFF]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#547EFF] [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#547EFF] [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer Bar */}
        <UserChatComposer
          onSendMessage={handleSendMessage}
          disabled={isCoachTyping}
        />
      </div>

      {/* Call Booking Modal */}
      <CoachCallBookingModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        coach={coach}
        onBookSuccess={handleBookCallSuccess}
      />
    </>
  );
};
