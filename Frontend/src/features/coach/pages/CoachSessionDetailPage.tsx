import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarClock, CalendarX2, CheckCheck, Clock, ListChecks, SearchX } from "lucide-react";
import { useMarkSessionReviewed, useSession } from "../hooks";
import { REVIEW_STATUS, SESSION_STATUS } from "../constants/labels";
import { formatDateTime } from "../lib/format";
import { Button3D, EmptyState, ErrorState, PageHeader, PageSkeleton, Panel, StatusBadge, StudentAvatar } from "../components/ui";
import { ExerciseResultCard } from "../components/sessions/ExerciseResultCard";
import { SessionFeedbackSection } from "../components/sessions/SessionFeedbackSection";
import { SessionSummary, StudentNoteCallout } from "../components/sessions/SessionSummary";
import { isNotFoundError, rise } from "../components/sessions/shared";

const BACK = { to: "/coach/sessions", label: "Buổi tập" };

export default function CoachSessionDetailPage() {
  const { sessionId } = useParams();
  const query = useSession(sessionId);
  const markReviewed = useMarkSessionReviewed();

  if (query.isPending) return <PageSkeleton kpis={0} />;
  if (query.isError) {
    return (
      <div>
        <PageHeader title="Chi tiết buổi tập" back={BACK} />
        <Panel>
          {isNotFoundError(query.error) ? (
            <EmptyState
              icon={SearchX}
              title="Không tìm thấy buổi tập."
              description="Buổi tập có thể đã bị xoá hoặc đường dẫn không đúng."
              action={<Button3D asChild size="sm"><Link to="/coach/sessions">Về danh sách buổi tập</Link></Button3D>}
            />
          ) : (
            <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
          )}
        </Panel>
      </div>
    );
  }

  const s = query.data;
  const reviewed = s.reviewStatus === "REVIEWED";
  const missed = s.status === "MISSED";

  function onMarkReviewed() {
    markReviewed.mutate(s.id, {
      onSuccess: () => toast.success("Đã đánh dấu buổi tập là đã review."),
      onError: () => toast.error("Không cập nhật được trạng thái. Vui lòng thử lại."),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        back={BACK}
        title={s.workoutName}
        description={s.planName ? `Thuộc giáo án ${s.planName}` : "Buổi tập tự do, không thuộc giáo án"}
        meta={
          <>
            <Link to={`/coach/students/${s.studentId}`} className="inline-flex items-center gap-2 rounded-full pr-2 text-sm font-bold text-text-primary hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent">
              <StudentAvatar name={s.studentName} src={s.studentAvatar} size="xs" />
              {s.studentName}
            </Link>
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary tabular-nums">
              <CalendarClock size={13} aria-hidden /> {formatDateTime(s.date)}
            </span>
            {!missed && (
              <span className="inline-flex items-center gap-1 text-xs text-text-secondary tabular-nums">
                <Clock size={13} aria-hidden /> {s.durationMinutes} phút
              </span>
            )}
            <StatusBadge status={SESSION_STATUS[s.status]} size="md" />
            {!missed && <StatusBadge status={REVIEW_STATUS[s.reviewStatus]} size="md" />}
          </>
        }
        actions={
          !missed && (
            <Button3D variant={reviewed ? "secondary" : "success"} onClick={onMarkReviewed} disabled={reviewed} loading={markReviewed.isPending} leftIcon={<CheckCheck size={16} />}>
              {reviewed ? "Đã review" : "Đánh dấu đã review"}
            </Button3D>
          )
        }
      />

      {missed ? (
        <Panel className="animate-rise">
          <EmptyState
            icon={CalendarX2}
            title="Học viên đã bỏ lỡ buổi tập này."
            description="Không có kết quả để review. Bạn có thể nhắn học viên để sắp xếp lại lịch tập."
            action={<Button3D asChild size="sm"><Link to={`/coach/students/${s.studentId}`}>Xem hồ sơ học viên</Link></Button3D>}
          />
        </Panel>
      ) : (
        <>
          <SessionSummary session={s} />
          {s.studentNote && <StudentNoteCallout name={s.studentName} note={s.studentNote} />}

          <section aria-labelledby="exercise-results">
            <div className="mb-3 flex items-center gap-2">
              <ListChecks size={18} className="text-accent-strong dark:text-accent" aria-hidden />
              <h2 id="exercise-results" className="text-[15px] font-extrabold text-text-primary">Kết quả từng bài tập</h2>
              <span className="text-xs tabular-nums text-text-secondary">({s.exercises.length})</span>
            </div>
            {s.exercises.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {s.exercises.map((e, i) => (
                  <ExerciseResultCard key={e.id} exercise={e} style={rise(i, 60)} />
                ))}
              </div>
            ) : (
              <Panel><EmptyState title="Không có dữ liệu bài tập." /></Panel>
            )}
          </section>

          <SessionFeedbackSection sessionId={s.id} feedback={s.feedback} />
        </>
      )}
    </div>
  );
}
