import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, ShieldCheck } from "lucide-react";
import { L4_REVIEW_STATUS } from "../constants/assessmentV2Labels";
import { useL4Reviews } from "../hooks";
import { formatDate } from "../lib/format";
import type { L4ReviewStatus, L4ReviewSummary } from "../types";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Panel, Segmented, StatusBadge, Button3D, TONE_TEXT, type SegmentOption } from "../components/ui";
import { daysLeft } from "../components/assessmentV2/v2Utils";

const TABS: SegmentOption<L4ReviewStatus>[] = [
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "REJECTED", label: "Đã từ chối" },
  { value: "RETEST_REQUESTED", label: "Cần đo lại" },
  { value: "EXPIRED", label: "Hết hạn" },
];

const EMPTY_COPY: Record<string, string> = {
  PENDING: "Không có học viên nào đang chờ xác nhận lên L4.",
  CONFIRMED: "Chưa có học viên nào được xác nhận L4.",
  REJECTED: "Chưa có gói nào bị từ chối.",
  RETEST_REQUESTED: "Chưa có yêu cầu đo lại nào.",
  EXPIRED: "Không có gói nào hết hạn.",
};

function ExpiryCell({ item }: { item: L4ReviewSummary }) {
  if (item.status !== "PENDING") return <span className="text-sm tabular-nums text-text-secondary">{formatDate(item.expiresAt)}</span>;
  const left = daysLeft(item.expiresAt);
  const tone = left <= 3 ? "critical" : left <= 7 ? "warning" : "neutral";
  return (
    <div>
      <div className="text-sm font-bold tabular-nums text-text-primary">{formatDate(item.expiresAt)}</div>
      <div className={`text-[11px] font-semibold ${TONE_TEXT[tone]}`}>{left > 0 ? `Còn ${left} ngày` : "Đã quá hạn"}</div>
    </div>
  );
}

/** Danh sách các học viên đã đủ điều kiện L4 bằng camera và đang chờ Coach xác nhận. */
export default function CoachL4ReviewsPage() {
  const [status, setStatus] = useState<L4ReviewStatus>("PENDING");
  const query = useL4Reviews(status);
  const items = query.data ?? [];

  return (
    <div>
      <PageHeader
        title="Xác nhận lên L4"
        description="Camera chỉ tự xác minh đến L3. Học viên đủ điều kiện L4 sẽ chờ bạn xem bằng chứng đo và video rồi quyết định."
      />

      <div className="mb-4 animate-rise" style={{ animationDelay: "60ms" }}>
        <Segmented options={TABS} value={status} onChange={setStatus} ariaLabel="Lọc theo trạng thái xác nhận L4" />
      </div>

      <Panel className="animate-rise overflow-hidden" bodyClassName="p-0 sm:p-0" as="section">
        <h2 className="sr-only">Danh sách</h2>
        {query.isLoading ? (
          <ListSkeleton rows={5} className="p-5 sm:p-6" />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Danh sách trống" description={EMPTY_COPY[status]} />
        ) : (
          <div aria-busy={query.isFetching} className={query.isFetching ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Các gói chờ xác nhận L4</caption>
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                    <th scope="col" className="px-5 py-3 sm:px-6">Học viên</th>
                    <th scope="col" className="px-3 py-3">Level</th>
                    <th scope="col" className="px-3 py-3">Gửi lúc</th>
                    <th scope="col" className="px-3 py-3">Hạn</th>
                    <th scope="col" className="px-3 py-3">Trạng thái</th>
                    <th scope="col" className="px-5 py-3 text-right sm:px-6"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r, i) => (
                    <tr key={r.id} className="animate-rise border-b border-border/60 transition-colors last:border-0 hover:bg-surface-sunken/60" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                      <th scope="row" className="px-5 py-3.5 text-sm font-extrabold text-text-primary sm:px-6">Học viên #{r.userId}</th>
                      <td className="px-3 py-3.5 text-sm font-bold text-text-primary">{r.verifiedLevel} <span className="text-text-secondary">→</span> {r.pendingLevel}</td>
                      <td className="px-3 py-3.5 text-sm tabular-nums text-text-secondary">{formatDate(r.createdAt)}</td>
                      <td className="px-3 py-3.5"><ExpiryCell item={r} /></td>
                      <td className="px-3 py-3.5"><StatusBadge status={L4_REVIEW_STATUS[r.status]} /></td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <Button3D asChild size="sm" variant={r.status === "PENDING" ? "primary" : "secondary"}>
                          <Link to={`/coach/l4-reviews/${r.id}`} aria-label={`${r.status === "PENDING" ? "Xem xét" : "Xem"} gói của học viên #${r.userId}`}>
                            <Eye size={14} aria-hidden />
                            {r.status === "PENDING" ? "Xem xét" : "Xem"}
                          </Link>
                        </Button3D>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
