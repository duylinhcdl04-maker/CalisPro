import { Fragment, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ChevronLeft, MessageCircle, UserRound } from "lucide-react";
import type { ChatMessage, Conversation } from "../../types";
import { formatDate, formatDay } from "../../lib/format";
import { Button3D, EmptyState, ErrorState, Skeleton, StudentAvatar, Tooltip } from "../ui";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";

interface ChatWindowProps {
  conversation: Conversation;
  messages: ChatMessage[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onBack: () => void;
}

function groupByDay(messages: ChatMessage[]) {
  const groups: { key: string; label: string; items: ChatMessage[] }[] = [];
  for (const m of [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt))) {
    const key = format(new Date(m.sentAt), "yyyy-MM-dd");
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(m);
    else {
      const day = formatDay(m.sentAt);
      groups.push({ key, label: day.includes("/") ? formatDate(m.sentAt, "EEEE, dd/MM") : day, items: [m] });
    }
  }
  return groups;
}

export function ChatWindow({ conversation, messages, isLoading, isError, onRetry, onBack }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupByDay(messages ?? []), [messages]);
  const count = messages?.length ?? 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count, conversation.id]);

  return (
    <section className="panel-3d flex min-h-0 flex-1 flex-col overflow-hidden" aria-label={`Trò chuyện với ${conversation.studentName}`}>
      <header className="flex items-center gap-3 border-b border-border/70 px-3 py-3 sm:px-5">
        <Tooltip label="Quay lại danh sách" side="bottom" className="lg:hidden">
          <Button3D variant="ghost" size="icon-sm" onClick={onBack} aria-label="Quay lại danh sách">
            <ChevronLeft size={17} />
          </Button3D>
        </Tooltip>
        <StudentAvatar name={conversation.studentName} src={conversation.studentAvatar} size="md" online={conversation.online} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-extrabold text-text-primary">{conversation.studentName}</h2>
          <p className="text-[11px] font-semibold text-text-secondary">
            {conversation.online ? <span className="text-emerald-600 dark:text-emerald-400">Đang online</span> : "Offline"}
          </p>
        </div>
        <Button3D asChild size="sm">
          <Link to={`/coach/students/${conversation.studentId}`}>
            <UserRound size={14} aria-hidden />
            <span className="hidden sm:inline">Xem hồ sơ</span>
            <span className="sr-only sm:hidden">Xem hồ sơ</span>
          </Link>
        </Button3D>
      </header>

      <div ref={scrollRef} role="log" aria-live="polite" aria-label="Tin nhắn" className="min-h-0 flex-1 overflow-y-auto px-3 py-4 scrollbar-thin sm:px-5">
        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Đang tải tin nhắn">
            {[60, 45, 70, 40].map((w, i) => (
              <div key={i} className={i % 2 ? "flex justify-end" : "flex"}>
                <div style={{ width: `${w}%` }}>
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={onRetry} />
        ) : groups.length === 0 ? (
          <EmptyState icon={MessageCircle} title="Chưa có tin nhắn" description="Gửi lời chào đầu tiên tới học viên." />
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <Fragment key={g.key}>
                <div className="flex items-center gap-3" role="separator" aria-label={g.label}>
                  <span className="h-px flex-1 bg-border/60" />
                  <span className="rounded-full border border-border/80 bg-surface dark:bg-[#132037] px-3 py-0.5 text-[10px] font-extrabold capitalize text-text-secondary shadow-2xs">{g.label}</span>
                  <span className="h-px flex-1 bg-border/60" />
                </div>
                <div className="space-y-3">
                  {g.items.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      <MessageComposer key={conversation.id} conversationId={conversation.id} />
    </section>
  );
}
