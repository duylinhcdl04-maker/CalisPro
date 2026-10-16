import { Link } from "react-router-dom";
import { ClipboardCheck, Dumbbell, FileText } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { ChatMessage, MessageAttachment } from "../../types";
import { MESSAGE_KIND } from "../../constants/labels";
import { formatTime } from "../../lib/format";
import { StatusBadge } from "../ui";

const ATTACHMENT_META: Record<MessageAttachment["type"], { href: (id: string) => string; label: string; icon: typeof FileText }> = {
  PLAN: { href: (id) => `/coach/plans/${id}`, label: "Giáo án", icon: FileText },
  SESSION: { href: (id) => `/coach/sessions/${id}`, label: "Buổi tập", icon: Dumbbell },
  ASSESSMENT: { href: (id) => `/coach/assessments/${id}`, label: "Đánh giá", icon: ClipboardCheck },
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.sender === "COACH";
  const att = message.attachment ? ATTACHMENT_META[message.attachment.type] : null;
  const AttIcon = att?.icon;

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
        {message.kind !== "TEXT" && (
          <span className="inline-flex items-center rounded-full bg-palette-sky/20 dark:bg-palette-sky/25 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-800 dark:text-sky-200 border border-palette-sky/30 shadow-2xs">
            {MESSAGE_KIND[message.kind]?.label ?? message.kind}
          </span>
        )}
        <div
          className={cn(
            "whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed transition-all",
            mine
              ? "rounded-[20px] rounded-br-xs bg-gradient-to-r from-[#6086FF] via-[#527bff] to-[#456EFF] text-white font-medium shadow-[0_4px_14px_rgba(80,120,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/20"
              : "rounded-[20px] rounded-bl-xs border border-border/80 bg-surface dark:bg-[#15233c] text-text-primary dark:text-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:border-white/[0.08]"
          )}
        >
          {message.content}
        </div>
        {message.attachment && att && AttIcon && (
          <Link
            to={att.href(message.attachment.refId)}
            className="group flex max-w-full items-center gap-2.5 rounded-[16px] border border-palette-sky/40 bg-surface/90 dark:bg-[#1a2b49] px-3.5 py-2.5 shadow-sm transition-all hover:border-palette-sky hover:shadow-md focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-palette-sky/25 text-palette-skyDeep dark:text-palette-sky shadow-xs">
              <AttIcon size={16} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-wide text-text-secondary">{att.label}</span>
              <span className="block truncate text-xs font-bold text-text-primary group-hover:text-palette-skyDeep dark:group-hover:text-palette-sky transition-colors">{message.attachment.title}</span>
            </span>
          </Link>
        )}
        <time dateTime={message.sentAt} className="px-1 text-[10px] font-semibold text-text-secondary">
          {formatTime(message.sentAt)}
        </time>
      </div>
    </div>
  );
}
