import { Link } from "react-router-dom";
import { ChevronRight, ListTodo, SearchX } from "lucide-react";
import type { AIAnalysisSummary, AIReviewStatus } from "../../types";
import { formatRelative, formatDateTime } from "../../lib/format";
import { Button3D, Delta, EmptyState, ErrorState, ListSkeleton, Panel, SearchInput, Segmented, StatusBadge, StudentAvatar, type SegmentOption } from "../ui";
import { FormScoreBadge, rise } from "../sessions/shared";
import { AI_REVIEW_STATUS } from "./labels";

export type QueueFilter = "pending" | "reviewed" | "all";

export const QUEUE_OPTIONS: SegmentOption<QueueFilter>[] = [
  { value: "pending", label: "Chờ review" },
  { value: "reviewed", label: "Đã review" },
  { value: "all", label: "Tất cả" },
];
export const QUEUE_PARAM: Record<QueueFilter, AIReviewStatus | undefined> = { pending: "PENDING_REVIEW", reviewed: "REVIEWED", all: undefined };

function QueueRow({ a, index }: { a: AIAnalysisSummary; index: number }) {
  const delta = a.previousFormScore === null ? null : a.formScore - a.previousFormScore;
  return (
    <li className="animate-rise" style={rise(index, 30)}>
      <Link
        to={`/coach/ai-analysis/${a.id}`}
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-surface-sunken/70 focus-visible:outline-2 focus-visible:outline-accent md:grid-cols-[auto_minmax(0,1.4fr)_110px_90px_minmax(0,1fr)_auto]"
      >
        <StudentAvatar name={a.studentName} src={a.studentAvatar} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-text-primary">{a.studentName}</div>
          <div className="truncate text-xs text-text-secondary">
            {a.exerciseName}
            <span aria-hidden> · </span>
            <time dateTime={a.analyzedAt} title={formatDateTime(a.analyzedAt)}>{formatRelative(a.analyzedAt)}</time>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 md:hidden">
            <FormScoreBadge score={a.formScore} />
            {delta !== null && <Delta value={delta} />}
            <span className="text-[11px] tabular-nums text-text-secondary">{a.validReps}/{a.totalReps} rep đạt</span>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <FormScoreBadge score={a.formScore} size="md" />
          {delta !== null && <Delta value={delta} />}
        </div>
        <div className="hidden text-sm font-bold tabular-nums text-text-primary md:block">
          {a.validReps}<span className="font-semibold text-text-secondary">/{a.totalReps}</span>
          <div className="text-[10px] font-semibold text-text-secondary">rep đạt</div>
        </div>
        <div className="hidden min-w-0 truncate text-xs text-text-secondary md:block">{a.primaryError ?? "Không có lỗi nổi bật"}</div>
        <div className="flex items-center gap-2">
          <StatusBadge status={AI_REVIEW_STATUS[a.reviewStatus]} className="hidden sm:inline-flex" />
          <ChevronRight size={18} className="text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden />
        </div>
      </Link>
    </li>
  );
}

interface AnalysisQueueProps {
  filter: QueueFilter;
  onFilterChange: (f: QueueFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
  items: AIAnalysisSummary[] | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}

export function AnalysisQueue({ filter, onFilterChange, search, onSearchChange, items, isPending, isError, isFetching, onRetry }: AnalysisQueueProps) {
  const hasFilter = !!search.trim();
  return (
    <Panel title="Hàng chờ phân tích" description="Mở từng phân tích để xem chi tiết và đưa ra quyết định" icon={ListTodo} className="animate-rise" bodyClassName="px-2 sm:px-3">
      <div className="mb-3 flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented ariaLabel="Lọc phân tích theo trạng thái review" options={QUEUE_OPTIONS} value={filter} onChange={onFilterChange} />
        <SearchInput label="Tìm theo học viên hoặc bài tập" placeholder="Tìm học viên, bài tập..." value={search} onChange={onSearchChange} className="sm:w-64" />
      </div>
      {isPending ? (
        <ListSkeleton rows={6} className="px-3" />
      ) : isError ? (
        <ErrorState onRetry={onRetry} retrying={isFetching} />
      ) : !items?.length ? (
        hasFilter ? (
          <EmptyState icon={SearchX} title="Không có phân tích phù hợp." action={<Button3D size="sm" onClick={() => onSearchChange("")}>Xoá tìm kiếm</Button3D>} />
        ) : (
          <EmptyState
            title={filter === "pending" ? "Không còn phân tích nào chờ review." : "Chưa có phân tích nào."}
            description={filter === "pending" ? "Bạn đã xem hết. Phân tích mới sẽ xuất hiện sau buổi tập tiếp theo của học viên." : undefined}
          />
        )
      ) : (
        <>
          <div className="hidden grid-cols-[36px_minmax(0,1.4fr)_110px_90px_minmax(0,1fr)_auto] gap-3 px-3 pb-2 text-[11px] font-extrabold uppercase tracking-wide text-text-secondary md:grid" aria-hidden>
            <span />
            <span>Học viên / Bài tập</span>
            <span>Form Score</span>
            <span>Reps</span>
            <span>Lỗi chính</span>
            <span>Trạng thái</span>
          </div>
          <ul className={isFetching ? "divide-y divide-border/50 opacity-70 transition-opacity" : "divide-y divide-border/50 transition-opacity"}>
            {items.map((a, i) => (
              <QueueRow key={a.id} a={a} index={i} />
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
