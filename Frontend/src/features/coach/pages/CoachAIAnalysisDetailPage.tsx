import { Link, useParams } from "react-router-dom";
import { CalendarClock, Dumbbell, Info, SearchX, UserRound } from "lucide-react";
import { useAIAnalysis } from "../hooks";
import { formatDateTime } from "../lib/format";
import { Button3D, EmptyState, ErrorState, PageHeader, PageSkeleton, Panel, StatusBadge, StudentAvatar } from "../components/ui";
import { AnalysisHero, FormBreakdownPanel } from "../components/ai/AnalysisHero";
import { CoachActionBar } from "../components/ai/CoachActionBar";
import { ObservationPanel } from "../components/ai/ObservationPanel";
import { RecommendationsPanel } from "../components/ai/RecommendationsPanel";
import { RepTimeline } from "../components/ai/RepTimeline";
import { AI_DISCLAIMER, AI_REVIEW_STATUS } from "../components/ai/labels";
import { isNotFoundError } from "../components/sessions/shared";

const BACK = { to: "/coach/ai-analysis", label: "AI Coaching" };

export default function CoachAIAnalysisDetailPage() {
  const { analysisId } = useParams();
  const query = useAIAnalysis(analysisId);

  if (query.isPending) return <PageSkeleton kpis={4} />;
  if (query.isError) {
    return (
      <div>
        <PageHeader title="Phân tích AI" back={BACK} />
        <Panel>
          {isNotFoundError(query.error) ? (
            <EmptyState
              icon={SearchX}
              title="Không tìm thấy phân tích này."
              description="Phân tích có thể đã bị xoá hoặc đường dẫn không đúng."
              action={<Button3D asChild size="sm"><Link to="/coach/ai-analysis">Về hàng chờ phân tích</Link></Button3D>}
            />
          ) : (
            <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
          )}
        </Panel>
      </div>
    );
  }

  const a = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        back={BACK}
        title={`Phân tích ${a.exerciseName}`}
        meta={
          <>
            <Link to={`/coach/students/${a.studentId}`} className="inline-flex items-center gap-2 rounded-full pr-2 text-sm font-bold text-text-primary hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent">
              <StudentAvatar name={a.studentName} src={a.studentAvatar} size="xs" />
              {a.studentName}
            </Link>
            <span className="inline-flex items-center gap-1 text-xs tabular-nums text-text-secondary">
              <CalendarClock size={13} aria-hidden /> {formatDateTime(a.analyzedAt)}
            </span>
            <StatusBadge status={AI_REVIEW_STATUS[a.reviewStatus]} size="md" />
            <span className="text-[11px] text-text-secondary">Mô hình: {a.modelVersion}</span>
          </>
        }
        actions={
          <>
            <Button3D asChild size="sm" variant="ghost">
              <Link to={`/coach/sessions/${a.sessionId}`}>
                <Dumbbell size={14} aria-hidden /> Xem buổi tập
              </Link>
            </Button3D>
            <Button3D asChild size="sm" variant="ghost">
              <Link to={`/coach/students/${a.studentId}`}>
                <UserRound size={14} aria-hidden /> Hồ sơ học viên
              </Link>
            </Button3D>
          </>
        }
      />

      <div className="flex items-start gap-2.5 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-3.5 text-sm text-text-primary animate-rise" role="note">
        <Info size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
        <p>
          <span className="font-bold">{AI_DISCLAIMER}</span>{" "}
          <span className="text-text-secondary">Kết quả dựa trên video buổi tập và có thể chưa chính xác khi góc quay bị che khuất.</span>
        </p>
      </div>

      <AnalysisHero analysis={a} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FormBreakdownPanel metrics={a.metrics} />
        <div className="space-y-6">
          <RepTimeline reps={a.reps} />
          <ObservationPanel analysis={a} />
        </div>
      </div>

      <RecommendationsPanel analysisId={a.id} recommendations={a.recommendations} />

      <CoachActionBar analysis={a} />
    </div>
  );
}
