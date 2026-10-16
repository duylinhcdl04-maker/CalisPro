import { Pin } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { NOTE_CATEGORY } from "../../../constants/labels";
import { formatDateTime, formatRelative } from "../../../lib/format";
import type { CoachNote } from "../../../types";
import { StatusBadge } from "../../ui";

interface NoteItemProps {
  note: CoachNote;
  compact?: boolean;
}

/** One coach note: category, pinned marker, author and relative time. */
export function NoteItem({ note, compact }: NoteItemProps) {
  return (
    <article
      className={cn(
        "rounded-[14px] border px-4 py-3",
        note.pinned ? "border-accent/30 bg-accent-soft/40" : "border-border bg-surface-elevated/60"
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <StatusBadge status={NOTE_CATEGORY[note.category]} />
        {note.pinned && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-strong dark:text-accent">
            <Pin size={12} aria-hidden />
            Đã ghim
          </span>
        )}
        <span className="ml-auto text-[11px] text-text-secondary">
          <time dateTime={note.createdAt} title={formatDateTime(note.createdAt)}>
            {formatRelative(note.createdAt)}
          </time>
        </span>
      </header>
      <p className={cn("mt-2 whitespace-pre-line text-sm leading-relaxed text-text-primary", compact && "line-clamp-3")}>{note.content}</p>
      {!compact && <p className="mt-2 text-[11px] font-semibold text-text-secondary">Bởi {note.authorName}</p>}
    </article>
  );
}
