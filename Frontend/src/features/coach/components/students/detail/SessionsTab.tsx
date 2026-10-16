import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock, Dumbbell } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { useSessions } from "../../../hooks";
import { REVIEW_STATUS, SESSION_STATUS } from "../../../constants/labels";
import { formatDate, scoreTone } from "../../../lib/format";
import type { WorkoutSessionSummary } from "../../../types";
import { EmptyState, ErrorState, ListSkeleton, Pagination, Panel, StatusBadge, TONE_TEXT } from "../../ui";

const PAGE_SIZE = 8;

function FormScore({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-text-secondary">Không có AI</span>;
  return <span className={cn("text-sm font-black tabular-nums", TONE_TEXT[scoreTone(value)])}>{value}</span>;
}

function SessionTable({ items }: { items: WorkoutSessionSummary[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Danh sách buổi tập của học viên</caption>
        <thead>
          <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            <th scope="col" className="py-2.5 pr-3">Buổi tập</th>
            <th scope="col" className="px-3 py-2.5">Ngày</th>
            <th scope="col" className="px-3 py-2.5 text-right">Thời lượng</th>
            <th scope="col" className="px-3 py-2.5 text-right">Hoàn thành</th>
            <th scope="col" className="px-3 py-2.5 text-right">Form</th>
            <th scope="col" className="px-3 py-2.5">Review</th>
            <th scope="col" className="py-2.5 pl-3"><span className="sr-only">Chi tiết</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {items.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-surface-elevated/60">
              <th scope="row" className="py-3 pr-3 font-normal">
                <span className="block font-bold text-text-primary">{s.workoutName}</span>
                <StatusBadge status={SESSION_STATUS[s.status]} className="mt-1" />
              </th>
              <td className="px-3 py-3 tabular-nums text-text-secondary">{formatDate(s.date)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-text-primary">{s.durationMinutes} phút</td>
              <td className="px-3 py-3 text-right font-bold tabular-nums text-text-primary">{s.completionPercent}%</td>
              <td className="px-3 py-3 text-right"><FormScore value={s.formScore} /></td>
              <td className="px-3 py-3"><StatusBadge status={REVIEW_STATUS[s.reviewStatus]} /></td>
              <td className="py-3 pl-3 text-right">
                <Link
                  to={`/coach/sessions/${s.id}`}
                  className="inline-flex items-center gap-0.5 rounded-lg text-xs font-bold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent dark:text-accent"
                  aria-label={`Xem chi tiết buổi ${s.workoutName} ngày ${formatDate(s.date)}`}
                >
                  Xem
                  <ChevronRight size={14} aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionCards({ items }: { items: WorkoutSessionSummary[] }) {
  return (
    <ul className="space-y-2.5 md:hidden">
      {items.map((s) => (
        <li key={s.id}>
          <Link
            to={`/coach/sessions/${s.id}`}
            className="block rounded-[14px] border border-border bg-surface-elevated/60 px-4 py-3 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-text-primary">{s.workoutName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                  <Clock size={12} aria-hidden />
                  <span className="tabular-nums">{formatDate(s.date)} · {s.durationMinutes} phút</span>
                </p>
              </div>
              <FormScore value={s.formScore} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={SESSION_STATUS[s.status]} />
              <StatusBadge status={REVIEW_STATUS[s.reviewStatus]} />
              <span className="ml-auto text-xs font-bold tabular-nums text-text-primary">{s.completionPercent}% hoàn thành</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SessionsTab({ studentId }: { studentId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isRefetching, isPlaceholderData } = useSessions({ studentId, page, pageSize: PAGE_SIZE });

  return (
    <Panel title="Buổi tập" description={data ? `${data.total} buổi đã ghi nhận` : "Lịch sử buổi tập"} icon={Dumbbell}>
      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Chưa có buổi tập" description="Học viên chưa hoàn thành buổi tập nào." />
      ) : (
        <div className={cn("space-y-4 transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData || undefined}>
          <SessionTable items={data.items} />
          <SessionCards items={data.items} />
          {data.totalPages > 1 && (
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={setPage} />
          )}
        </div>
      )}
    </Panel>
  );
}
