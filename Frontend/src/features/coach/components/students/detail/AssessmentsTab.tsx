import { Link } from "react-router-dom";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { useAssessments } from "../../../hooks";
import { ASSESSMENT_STATUS, ASSESSMENT_TYPE_LABEL } from "../../../constants/labels";
import { formatDate } from "../../../lib/format";
import { EmptyState, ErrorState, ListSkeleton, Panel, ScoreRing, StatusBadge } from "../../ui";
import { stagger } from "./detailConfig";

export function AssessmentsTab({ studentId }: { studentId: string }) {
  const { data, isLoading, isError, refetch, isRefetching } = useAssessments({ studentId });

  return (
    <Panel title="Đánh giá thể lực" description={data ? `${data.length} bài đánh giá` : "Lịch sử và lịch đánh giá sắp tới"} icon={ClipboardCheck}>
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Chưa có bài đánh giá" description="Học viên chưa được lên lịch đánh giá thể lực nào." />
      ) : (
        <ul className="space-y-2.5">
          {data.map((a, i) => (
            <li key={a.id} className="animate-rise" style={stagger(i, 40)}>
              <Link
                to={`/coach/assessments/${a.id}`}
                className="group flex items-center gap-4 rounded-[14px] border border-border bg-surface-elevated/60 px-4 py-3 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <ScoreRing value={a.overallScore} size={48} stroke={5} label="Điểm tổng" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-extrabold text-text-primary">{a.title}</span>
                    <StatusBadge status={ASSESSMENT_STATUS[a.status]} />
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {ASSESSMENT_TYPE_LABEL[a.type]}
                    <span aria-hidden> · </span>
                    {a.completedAt ? (
                      <>Hoàn thành {formatDate(a.completedAt)}</>
                    ) : (
                      <>Hạn {formatDate(a.dueDate)}</>
                    )}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[11px] font-bold text-text-secondary">Điểm tổng</p>
                  <p className="text-lg font-black tabular-nums text-text-primary">{a.overallScore ?? "Chưa có"}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-text-secondary transition-colors group-hover:text-accent" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
