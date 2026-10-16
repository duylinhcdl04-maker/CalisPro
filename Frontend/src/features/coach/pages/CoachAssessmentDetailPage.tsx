import { Link, useParams } from "react-router-dom";
import { ClipboardX, Radar, UserRound } from "lucide-react";
import { useAssessment } from "../hooks";
import { ASSESSMENT_STATUS, ASSESSMENT_TYPE_LABEL, LEVEL_LABEL } from "../constants/labels";
import { formatDate } from "../lib/format";
import type { AssessmentDetail } from "../types";
import { Button3D, EmptyState, ErrorState, PageHeader, PageSkeleton, Panel, StatusBadge, StudentAvatar } from "../components/ui";
import { FitnessRadarChart } from "../components/charts/FitnessRadarChart";
import { AssessmentPendingCard } from "../components/assessments/AssessmentPendingCard";
import { MetricCards, OverallHero } from "../components/assessments/MetricComparison";
import { TestResultsTable } from "../components/assessments/TestResultsTable";
import { ReviewPanel } from "../components/assessments/ReviewPanel";
import { errorStatus, isDone, radarScores } from "../components/assessments/assessmentUtils";

const BACK = { to: "/coach/assessments", label: "Đánh giá thể lực" };

function Header({ a }: { a: AssessmentDetail }) {
  const dates = [`Hạn ${formatDate(a.dueDate)}`, a.completedAt ? `Hoàn thành ${formatDate(a.completedAt)}` : null].filter(Boolean).join(" · ");
  return (
    <PageHeader
      back={BACK}
      title={a.title}
      description={`${ASSESSMENT_TYPE_LABEL[a.type]} · ${dates}`}
      meta={
        <>
          <Link
            to={`/coach/students/${a.studentId}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated py-1 pl-1 pr-3 text-sm font-extrabold text-text-primary transition-colors hover:border-accent/40 hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
          >
            <StudentAvatar name={a.studentName} src={a.studentAvatar} size="xs" />
            {a.studentName}
          </Link>
          <StatusBadge tone="neutral" size="md">{LEVEL_LABEL[a.studentLevel]}</StatusBadge>
          <StatusBadge status={ASSESSMENT_STATUS[a.status]} size="md" />
        </>
      }
      actions={
        <Button3D asChild variant="secondary">
          <Link to={`/coach/students/${a.studentId}`}>
            <UserRound size={16} aria-hidden />
            Hồ sơ học viên
          </Link>
        </Button3D>
      }
    />
  );
}

function CompletedView({ a }: { a: AssessmentDetail }) {
  const radar = radarScores(a.metrics);
  return (
    <div className="space-y-6">
      <OverallHero assessment={a} />
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="mb-3 text-[15px] font-extrabold tracking-tight text-text-primary">
            6 chỉ số thể lực
          </h2>
          <MetricCards metrics={a.metrics} />
        </section>
        <Panel title="Biểu đồ radar" description="Hiện tại so với lần trước" icon={Radar} className="animate-rise lg:col-span-2">
          {radar.current ? (
            <FitnessRadarChart current={radar.current} previous={radar.previous} height={280} />
          ) : (
            <EmptyState title="Chưa đủ dữ liệu" />
          )}
        </Panel>
      </div>
      <TestResultsTable tests={a.tests} />
      <ReviewPanel assessment={a} />
    </div>
  );
}

export default function CoachAssessmentDetailPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const query = useAssessment(assessmentId);

  if (query.isLoading) return <PageSkeleton kpis={0} />;

  if (query.isError || !query.data) {
    if (errorStatus(query.error) === 404 || (!query.isError && !query.data)) {
      return (
        <div>
          <PageHeader back={BACK} title="Không tìm thấy bài đánh giá" />
          <Panel>
            <EmptyState
              icon={ClipboardX}
              title="Bài đánh giá không tồn tại"
              description="Bài đánh giá có thể đã bị xoá hoặc đường dẫn không đúng."
              action={
                <Button3D asChild variant="primary">
                  <Link to="/coach/assessments">Về danh sách đánh giá</Link>
                </Button3D>
              }
            />
          </Panel>
        </div>
      );
    }
    return (
      <div>
        <PageHeader back={BACK} title="Chi tiết đánh giá" />
        <Panel>
          <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
        </Panel>
      </div>
    );
  }

  const a = query.data;
  return (
    <div>
      <Header a={a} />
      {isDone(a.status) ? <CompletedView a={a} /> : <AssessmentPendingCard assessment={a} />}
    </div>
  );
}
