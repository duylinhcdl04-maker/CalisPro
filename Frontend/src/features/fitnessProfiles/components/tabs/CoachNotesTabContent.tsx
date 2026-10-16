import React from "react";
import { MessageSquarePlus, Pin, Tag, Trash2, User, AlertCircle, Sparkles } from "lucide-react";
import { CoachNote } from "../../types/fitnessProfile";

interface CoachNotesTabContentProps {
  notes: CoachNote[];
  onOpenAddNoteModal: () => void;
  onDeleteNote: (noteId: string) => Promise<void>;
  isLoading?: boolean;
}

export const CoachNotesTabContent: React.FC<CoachNotesTabContentProps> = ({
  notes,
  onOpenAddNoteModal,
  onDeleteNote,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-[#E3E7DF] bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nhật ký & Ghi chú Huấn luyện viên
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {notes.length} ghi chú theo dõi từ Ban huấn luyện CalisHealth
          </p>
        </div>

        <button
          onClick={onOpenAddNoteModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 transition-all hover:opacity-95"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          + Thêm ghi chú
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Chưa có ghi chú nào. Hãy thêm ghi chú đầu tiên cho học viên này.
        </div>
      ) : (
        <div className="space-y-3">
          {[...pinnedNotes, ...otherNotes].map((note) => (
            <div
              key={note.id}
              className={`group relative rounded-2xl border p-4 shadow-xs transition-all ${
                note.isPinned
                  ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20"
                  : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8CA9FF]/15 text-xs font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                    {note.coachName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(-2)
                      .join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <span>{note.coachName}</span>
                      {note.isPinned && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                          <Pin className="h-3 w-3 text-amber-600" />
                          Đã ghim
                        </span>
                      )}
                      {note.priority === "urgent" && (
                        <span className="rounded-md bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          Khẩn cấp
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {note.date}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="rounded-lg p-1 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-950/40"
                  title="Xóa ghi chú"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Note Content */}
              <p className="mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {note.content}
              </p>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
