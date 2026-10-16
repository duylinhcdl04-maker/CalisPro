import { useMemo, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { Conversation } from "../../types";
import { formatRelative } from "../../lib/format";
import { EmptyState, ErrorState, ListSkeleton, SearchInput, StudentAvatar } from "../ui";

interface ConversationListProps {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  retrying: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function ConversationList({ conversations, isLoading, isError, onRetry, retrying, activeId, onSelect, className }: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (conversations ?? [])
      .filter((c) => !q || c.studentName.toLowerCase().includes(q))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [conversations, search]);

  return (
    <aside className={cn("panel-3d flex min-h-0 flex-col overflow-hidden", className)} aria-label="Danh sách cuộc trò chuyện">
      <div className="border-b border-border/70 p-4">
        <SearchInput value={search} onChange={setSearch} label="Tìm học viên" placeholder="Tìm học viên..." />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-thin">
        {isLoading ? (
          <ListSkeleton rows={7} className="p-2" />
        ) : isError ? (
          <ErrorState onRetry={onRetry} retrying={retrying} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title={search ? "Không tìm thấy học viên" : "Chưa có cuộc trò chuyện"}
            description={search ? "Thử tìm với tên khác." : "Tin nhắn từ học viên sẽ hiển thị tại đây."}
          />
        ) : (
          <ul className="space-y-1">
            {filtered.map((c, i) => {
              const active = c.id === activeId;
              const unread = c.unreadCount > 0;
              return (
                <li key={c.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-[16px] border px-3.5 py-3 text-left transition-all duration-200 select-none focus-visible:outline-2 focus-visible:outline-accent",
                      active
                        ? "border-palette-sky/40 bg-gradient-to-r from-palette-sky/20 via-palette-periwinkle/10 to-transparent dark:from-palette-sky/25 dark:via-palette-sky/10 dark:to-transparent shadow-[0_2px_12px_rgba(140,169,255,0.12)]"
                        : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:translate-x-0.5"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-[#AAC4F5] to-[#8CA9FF] shadow-[0_0_8px_rgba(140,169,255,0.8)]" />
                    )}
                    <StudentAvatar name={c.studentName} src={c.studentAvatar} size="md" online={c.online} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-sm", active ? "font-extrabold text-sky-900 dark:text-sky-200" : unread ? "font-extrabold text-text-primary" : "font-bold text-text-primary")}>{c.studentName}</span>
                        <span className="shrink-0 text-[11px] font-medium text-text-secondary">{formatRelative(c.lastMessageAt)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs", active ? "font-semibold text-sky-800/80 dark:text-sky-300/80" : unread ? "font-bold text-text-primary" : "text-text-secondary")}>{c.lastMessage}</span>
                        {unread && (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-palette-skyDeep dark:bg-palette-sky px-1.5 text-[10px] font-extrabold tabular-nums text-white dark:text-slate-900 shadow-xs">
                            <span className="sr-only">Chưa đọc: </span>
                            {c.unreadCount}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
