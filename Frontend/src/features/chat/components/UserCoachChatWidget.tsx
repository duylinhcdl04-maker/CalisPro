import React, { useState, useEffect } from "react";
import { MessageSquare, X, Sparkles } from "lucide-react";
import { userChatService } from "../services/userChatService";
import { UserCoachChatWindow } from "./UserCoachChatWindow";

export const UserCoachChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const coach = userChatService.getCoachInfo();

  const updateUnread = () => {
    setUnreadCount(userChatService.getUnreadCount());
  };

  useEffect(() => {
    updateUnread();
    const interval = setInterval(updateUnread, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    userChatService.markAllAsRead();
  };

  const handleClose = () => {
    setIsOpen(false);
    updateUnread();
  };

  const handleMinimize = () => {
    setIsOpen(false);
    updateUnread();
  };

  return (
    <>
      {/* Floating Widget Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 md:bottom-6 md:right-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <button
            type="button"
            onClick={handleOpen}
            aria-label="Mở chatbox với Coach"
            className="group relative flex items-center gap-2.5 rounded-full border border-white/80 bg-gradient-to-r from-[#AAC4F5] via-[#8CA9FF] to-[#547EFF] p-1.5 pr-4 text-white shadow-[0_8px_25px_rgba(84,126,255,0.45),inset_0_1px_2px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_32px_rgba(84,126,255,0.6)] active:scale-95 dark:border-white/20"
          >
            {/* Coach Avatar with Pulse */}
            <div className="relative">
              <img
                src={coach.avatar}
                alt={coach.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/90 shadow-xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </div>

            {/* Label & Subtitle */}
            <div className="text-left leading-tight hidden sm:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tight drop-shadow-xs">
                  Chat với Coach
                </span>
                <Sparkles className="h-3 w-3 text-amber-300" />
              </div>
              <div className="text-[10px] font-medium text-blue-100">
                {coach.name.split(" ").slice(-2).join(" ")} • Sẵn sàng hỗ trợ
              </div>
            </div>

            {/* Unread Counter Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-black text-white ring-2 ring-white shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      <UserCoachChatWindow
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
      />
    </>
  );
};
