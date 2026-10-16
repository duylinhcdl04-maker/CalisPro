import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronRight, Lock, ScanEye, XCircle } from "lucide-react";
import { useAIAnalyses } from "../../../hooks";
import { formatDateTime, formatRelative } from "../../../lib/format";
import { Delta, EmptyState, ErrorState, ListSkeleton, Panel, ScoreRing, StatusBadge } from "../../ui";
import { AI_REVIEW_STATUS, stagger } from "./detailConfig";

export function AIAnalysisTab({ studentId }: { studentId: string }) {
  const { data, isLoading, isError, refetch, isRefetching } = useAIAnalyses({ studentId });

  return (
    <Panel
      title="Phân tích AI Motion"
      description={data ? `${data.length} lần phân tích, mới nhất trước` : "Kết quả phân tích form từ video buổi tập"}
      icon={ScanEye}
    >
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={ScanEye} title="Chưa có phân tích AI" description="Kết quả sẽ xuất hiện khi học viên ghi hình buổi tập để AI Motion phân tích." />
      ) : (
        <ul className="space-y-2.5">
          {data.map((a, i) => (
            <li key={a.id} className="animate-rise" style={stagger(i, 40)}>
              <Link
                to={`/coach/ai-analysis/${a.id}`}
                className="group flex items-start gap-4 rounded-[14px] border border-border bg-surface-elevated/60 px-4 py-3 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <ScoreRing value={a.formScore} size={52} stroke={5} label="Form score" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-text-primary">{a.exerciseName}</span>
                    <StatusBadge status={AI_REVIEW_STATUS[a.reviewStatus]} />
                    {a.previousFormScore !== null && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                        <Delta value={a.formScore - a.previousFormScore} />
                        so với lần trước
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    <time dateTime={a.analyzedAt} title={formatDateTime(a.analyzedAt)}>
                      {formatRelative(a.analyzedAt)}
                    </time>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 size={13} aria-hidden />
                      <span className="tabular-nums">{a.validReps}</span> rep hợp lệ
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300">
                      <XCircle size={13} aria-hidden />
                      <span className="tabular-nums">{a.invalidReps}</span> rep không hợp lệ
                    </span>
                    {a.primaryError && (
                      <span className="inline-flex items-center gap-1 text-text-primary">
                        <AlertCircle size={13} className="text-amber-600 dark:text-amber-400" aria-hidden />
                        Lỗi chính: <span className="font-bold">{a.primaryError}</span>
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-text-secondary transition-colors group-hover:text-accent" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-text-secondary">
        <Lock size={12} className="mt-0.5 shrink-0" aria-hidden />
        Điểm và lỗi do AI Motion tính toán. Mở từng phân tích để review và gửi phản hồi cho học viên.
      </p>
    </Panel>
  );
}
