import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, HeartPulse } from "lucide-react";
import { SAFETY_CLEARANCE_STATUS, SAFETY_STATUS_TONE } from "../constants/assessmentV2Labels";
import { useSafetyClearances } from "../hooks";
import { formatDate } from "../lib/format";
import type { SafetyClearanceStatus } from "../types";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Panel, Segmented, StatusBadge, Button3D, type SegmentOption } from "../components/ui";

const TABS: SegmentOption<SafetyClearanceStatus>[] = [
  { value: "REQUESTED", label: "Chờ xác minh" },
  { value: "GRANTED", label: "Đã chấp thuận" },
  { value: "REJECTED", label: "Đã từ chối" },
];

const EMPTY_COPY: Record<string, string> = {
  REQUESTED: "Không có học viên nào đang chờ xác minh an toàn.",
  GRANTED: "Chưa có yêu cầu nào được chấp thuận.",
  REJECTED: "Chưa có yêu cầu nào bị từ chối.",
};

/** Học viên muốn nới hạn chế an toàn thì gửi yêu cầu; chỉ Coach xác minh mới gỡ được (acknowledge không gỡ). */
export default function CoachSafetyClearancesPage() {
  const [status, setStatus] = useState<SafetyClearanceStatus>("REQUESTED");
  const query = useSafetyClearances(status);
  const items = query.data ?? [];

  return (
    <div>
      <PageHeader
        title="Xác minh an toàn"
        description="Học viên có hạn chế an toàn nhờ bạn xác minh để nới hoặc gỡ hạn chế. Đây là xác minh thông tin, không phải chẩn đoán y tế."
      />

      <div className="mb-4 animate-rise" style={{ animationDelay: "60ms" }}>
        <Segmented options={TABS} value={status} onChange={setStatus} ariaLabel="Lọc theo trạng thái yêu cầu" />
      </div>

      <Panel className="animate-rise overflow-hidden" bodyClassName="p-0 sm:p-0" as="section">
        <h2 className="sr-only">Danh sách</h2>
        {query.isLoading ? (
          <ListSkeleton rows={5} className="p-5 sm:p-6" />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          <EmptyState icon={HeartPulse} title="Danh sách trống" description={EMPTY_COPY[status]} />
        ) : (
          <div aria-busy={query.isFetching} className={query.isFetching ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Các yêu cầu xác minh an toàn</caption>
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                    <th scope="col" className="px-5 py-3 sm:px-6">Học viên</th>
                    <th scope="col" className="px-3 py-3">Gửi lúc</th>
                    <th scope="col" className="px-3 py-3">Trạng thái</th>
                    <th scope="col" className="px-3 py-3">Kết quả</th>
                    <th scope="col" className="px-5 py-3 text-right sm:px-6"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c, i) => (
                    <tr key={c.id} className="animate-rise border-b border-border/60 transition-colors last:border-0 hover:bg-surface-sunken/60" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                      <th scope="row" className="px-5 py-3.5 text-sm font-extrabold text-text-primary sm:px-6">Học viên #{c.userId}</th>
                      <td className="px-3 py-3.5 text-sm tabular-nums text-text-secondary">{formatDate(c.requestedAt)}</td>
                      <td className="px-3 py-3.5"><StatusBadge status={SAFETY_CLEARANCE_STATUS[c.status]} /></td>
                      <td className="px-3 py-3.5">{c.resultingStatus ? <StatusBadge status={SAFETY_STATUS_TONE[c.resultingStatus]} /> : <span className="text-sm text-text-secondary">-</span>}</td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <Button3D asChild size="sm" variant={c.status === "REQUESTED" ? "primary" : "secondary"}>
                          <Link to={`/coach/safety-clearances/${c.id}`} aria-label={`${c.status === "REQUESTED" ? "Xem xét" : "Xem"} yêu cầu của học viên #${c.userId}`}>
                            <Eye size={14} aria-hidden />{c.status === "REQUESTED" ? "Xem xét" : "Xem"}
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
