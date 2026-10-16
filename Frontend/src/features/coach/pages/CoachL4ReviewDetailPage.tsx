import { useParams } from "react-router-dom";
import { Film, Info } from "lucide-react";
import { L4_REVIEW_STATUS } from "../constants/assessmentV2Labels";
import { useL4Review } from "../hooks";
import { formatDate, formatDateTime } from "../lib/format";
import { ErrorState, PageHeader, PageSkeleton, Panel, StatusBadge } from "../components/ui";
import { AttemptEvidenceCard } from "../components/assessmentV2/AttemptEvidenceCard";
import { L4DecisionPanel } from "../components/assessmentV2/L4DecisionPanel";
import { daysLeft } from "../components/assessmentV2/v2Utils";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-sunken/70 px-3.5 py-2.5">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm font-extrabold text-text-primary">{children}</dd>
    </div>
  );
}

/** Chi tiết một gói xác nhận L4: tóm tắt, bằng chứng từng attempt (số liệu + video + từng rep) và quyết định. */
export default function CoachL4ReviewDetailPage() {
  const { reviewId } = useParams();
  const id = Number(reviewId);
  const query = useL4Review(id);

  if (query.isLoading) return <PageSkeleton kpis={3} />;
  if (query.isError || !query.data) {
    return (
      <div>
        <PageHeader title="Xác nhận lên L4" back={{ to: "/coach/l4-reviews", label: "Danh sách xác nhận L4" }} />
        <Panel><ErrorState title="Không tìm thấy gói xác nhận." description="Gói có thể đã bị xoá hoặc bạn không có quyền xem." onRetry={() => query.refetch()} retrying={query.isFetching} /></Panel>
      </div>
    );
  }

  const { summary, attempts, overallScore } = query.data;
  const pending = summary.status === "PENDING";
  const left = daysLeft(summary.expiresAt);
  const videoCount = attempts.filter((a) => a.videoUrl).length;

  return (
    <div>
      <PageHeader
        title={`Học viên #${summary.userId}: ${summary.verifiedLevel} → ${summary.pendingLevel}`}
        description="Camera đã đo đủ mọi cổng của L4. Level chỉ được nâng khi bạn xác nhận."
        back={{ to: "/coach/l4-reviews", label: "Danh sách xác nhận L4" }}
        meta={<StatusBadge size="md" status={L4_REVIEW_STATUS[summary.status]} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Panel title="Tóm tắt" icon={Info}>
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Fact label="Điểm tổng">{overallScore != null ? overallScore.toFixed(1) : "-"}</Fact>
              <Fact label="Gửi lúc">{formatDateTime(summary.createdAt)}</Fact>
              <Fact label="Hạn xét duyệt">{formatDate(summary.expiresAt)}{pending && <span className="block text-[11px] font-semibold text-text-secondary">{left > 0 ? `Còn ${left} ngày` : "Đã quá hạn"}</span>}</Fact>
              <Fact label="Video">{videoCount}/{attempts.length} attempt</Fact>
            </dl>
            {pending && videoCount === 0 && (
              <p role="status" className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                Chưa có video còn hạn: bạn chưa thể xác nhận, chỉ có thể từ chối hoặc yêu cầu đo lại kèm lý do.
              </p>
            )}
          </Panel>

          <Panel title="Bằng chứng đo" description="Số liệu camera và video của từng attempt. Dữ liệu gốc không bị chỉnh sửa." icon={Film}>
            <div className="space-y-4">
              {attempts.length === 0 ? <p className="text-sm text-text-secondary">Không có attempt nào trong gói này.</p> : attempts.map((a) => <AttemptEvidenceCard key={a.attemptId} attempt={a} />)}
            </div>
          </Panel>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <L4DecisionPanel detail={query.data} />
        </div>
      </div>
    </div>
  );
}
