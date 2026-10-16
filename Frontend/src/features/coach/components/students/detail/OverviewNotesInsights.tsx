import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Lock, ScanEye, StickyNote } from "lucide-react";
import { useStudentNotes } from "../../../hooks";
import { formatRelative } from "../../../lib/format";
import type { StudentAIInsight } from "../../../types";
import { Button3D, EmptyState, ErrorState, ListSkeleton, Panel, StatusBadge } from "../../ui";
import { NoteItem } from "./NoteItem";
import { SEVERITY_LABEL } from "./detailConfig";

export function LatestNotesCard({ studentId }: { studentId: string }) {
  const { data, isLoading, isError, refetch, isRefetching } = useStudentNotes(studentId);
  // The API already returns pinned notes first, newest after that.
  const notes = data?.slice(0, 3) ?? [];
  return (
    <Panel
      title="Ghi chú gần đây"
      icon={StickyNote}
      className="h-full"
      actions={
        <Button3D asChild variant="ghost" size="sm">
          <Link to={{ search: "?tab=notes" }}>
            Tất cả
            <ChevronRight size={14} aria-hidden />
          </Link>
        </Button3D>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      ) : notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="Chưa có ghi chú" description="Dùng nút Thêm ghi chú ở đầu trang để ghi lại quan sát." className="py-8" />
      ) : (
        <ul className="space-y-2.5">
          {notes.map((n) => (
            <li key={n.id}>
              <NoteItem note={n} compact />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function AIInsightsCard({ insights }: { insights: StudentAIInsight[] }) {
  return (
    <Panel title="AI insights" description="Kết quả phân tích chuyển động gần nhất" icon={ScanEye} className="h-full">
      {insights.length === 0 ? (
        <EmptyState icon={ScanEye} title="Chưa có phân tích AI" description="Kết quả sẽ xuất hiện khi học viên ghi hình buổi tập." className="py-8" />
      ) : (
        <ul className="space-y-2">
          {insights.map((i) => (
            <li key={i.id}>
              <Link
                to={`/coach/ai-analysis/${i.analysisId}`}
                className="group flex items-start gap-3 rounded-[14px] border border-border bg-surface-elevated/60 px-3.5 py-3 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-text-primary">{i.label}</span>
                    <StatusBadge status={SEVERITY_LABEL[i.severity]} />
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {i.exerciseName} · {formatRelative(i.detectedAt)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-primary/85">{i.detail}</p>
                </div>
                <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-text-secondary transition-colors group-hover:text-accent" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-text-secondary">
        <Lock size={12} className="mt-0.5 shrink-0" aria-hidden />
        Kết quả do AI Motion tạo ra. Huấn luyện viên xem và phản hồi trong trang phân tích, không chỉnh sửa quy tắc AI tại đây.
      </p>
    </Panel>
  );
}
