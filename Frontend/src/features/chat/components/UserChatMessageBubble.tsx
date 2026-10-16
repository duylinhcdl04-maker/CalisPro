import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCheck,
  Dumbbell,
  Sparkles,
  Award,
  Video,
  ExternalLink,
  Bot,
  CalendarCheck,
} from "lucide-react";
import { UserChatMessage, CoachProfileInfo } from "../types";

interface UserChatMessageBubbleProps {
  message: UserChatMessage;
  coach: CoachProfileInfo;
  onActionClick?: (url: string) => void;
}

export const UserChatMessageBubble: React.FC<UserChatMessageBubbleProps> = ({
  message,
  coach,
  onActionClick,
}) => {
  const isUser = message.sender === "USER";
  const isSystem = message.sender === "SYSTEM";

  const timeString = new Date(message.sentAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSystem) {
    return (
      <div className="my-2 flex justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-start gap-2.5 transition-all ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Coach Avatar (if coach message) */}
      {!isUser && (
        <div className="relative shrink-0 self-start mt-0.5">
          <img
            src={coach.avatar}
            alt={coach.name}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-[#8CA9FF]/30 shadow-xs"
          />
          {coach.online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1329]" />
          )}
        </div>
      )}

      <div
        className={`flex max-w-[82%] flex-col gap-1.5 sm:max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Sender Name if Coach */}
        {!isUser && (
          <div className="flex items-center gap-1.5 pl-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>{coach.name}</span>
            <span className="rounded-md bg-blue-500/10 px-1.5 py-0.2 text-[9px] font-bold text-[#547EFF] dark:bg-blue-500/20 dark:text-[#8CA9FF]">
              COACH
            </span>
          </div>
        )}

        {/* Bubble Box */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-xs leading-relaxed transition-all ${
            isUser
              ? "rounded-tr-xs bg-gradient-to-r from-[#547EFF] to-[#456eff] text-white shadow-md shadow-blue-500/20"
              : "rounded-tl-xs border border-slate-200/90 bg-white text-slate-800 shadow-xs dark:border-slate-700/60 dark:bg-[#111c38] dark:text-slate-100"
          }`}
        >
          {/* Main Text Content */}
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Rich Attachment Card */}
          {message.attachment && (
            <div
              className={`mt-2.5 overflow-hidden rounded-xl border p-3 ${
                isUser
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-[#0b1329] dark:text-white"
              }`}
            >
              {message.attachment.type === "PLAN" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-[#547EFF] dark:text-[#8CA9FF]">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold truncate">
                        {message.attachment.title}
                      </div>
                      {message.attachment.duration && (
                        <div className="text-[10px] opacity-75">
                          {message.attachment.duration}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.attachment.actionUrl && (
                    <Link
                      to={message.attachment.actionUrl}
                      onClick={() =>
                        onActionClick &&
                        message.attachment?.actionUrl &&
                        onActionClick(message.attachment.actionUrl)
                      }
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] py-1.5 text-[11px] font-bold text-white shadow-xs transition-transform hover:brightness-105 active:scale-98"
                    >
                      <span>{message.attachment.actionLabel || "Xem ngay"}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )}

              {message.attachment.type === "FORM_SCORE" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold truncate">
                          {message.attachment.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Đánh giá chuyển động AI
                        </div>
                      </div>
                    </div>

                    {typeof message.attachment.score === "number" && (
                      <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {message.attachment.score}/100
                      </span>
                    )}
                  </div>

                  {message.attachment.actionUrl && (
                    <Link
                      to={message.attachment.actionUrl}
                      onClick={() =>
                        onActionClick &&
                        message.attachment?.actionUrl &&
                        onActionClick(message.attachment.actionUrl)
                      }
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#8CA9FF]/40 bg-white py-1.5 text-[11px] font-bold text-[#547EFF] transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-[#8CA9FF] dark:hover:bg-slate-700"
                    >
                      <span>{message.attachment.actionLabel || "Xem chi tiết"}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp & Read Status */}
        <div
          className={`flex items-center gap-1 px-1 text-[10px] text-slate-400 ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span>{timeString}</span>
          {isUser && (
            <CheckCheck
              className={`h-3 w-3 ${
                message.read ? "text-[#547EFF] dark:text-[#8CA9FF]" : "text-slate-400"
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
};
