import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, ScrollText } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { Button3D, EmptyState, ErrorState, ListSkeleton, Panel, Segmented, StatusBadge, type SegmentOption } from "../../features/coach/components/ui";
import { RULE_SET_STATUS } from "../../features/coach/constants/assessmentV2Labels";
import { formatDate } from "../../features/coach/lib/format";
import type { RuleSetStatus } from "../../features/coach/types";
import { useAdminRuleSets } from "../../features/admin/ruleSets/api";

type ListStatus = Exclude<RuleSetStatus, "ACTIVE">;
const TABS: SegmentOption<ListStatus>[] = [
  { value: "PENDING_REVIEW", label: "Chờ duyệt" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "ARCHIVED", label: "Đã lưu trữ" },
];

const EMPTY: Record<ListStatus, string> = {
  PENDING_REVIEW: "Không có bộ quy tắc nào đang chờ bạn duyệt.",
  DRAFT: "Không có bản nháp nào.",
  ARCHIVED: "Chưa có bản nào được lưu trữ.",
};

/** Hàng chờ duyệt bộ quy tắc đánh giá V2: Coach soạn, Admin duyệt và kích hoạt. */
export default function AdminRuleSetsV2Page() {
  const [status, setStatus] = useState<ListStatus>("PENDING_REVIEW");
  const query = useAdminRuleSets(status);
  const active = useAdminRuleSets("ACTIVE");
  const items = query.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Quy tắc bài đánh giá"
        description="Coach soạn ngưỡng level và tham số; bạn xem thay đổi, rồi duyệt và kích hoạt hoặc trả về để Coach sửa."
      />
      <section aria-label="Bản đang áp dụng" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-black text-text-primary"><CheckCircle2 size={16} className="text-emerald-500" aria-hidden />Đang áp dụng</h2>
        {active.isLoading ? <p className="mt-2 text-sm text-text-secondary">Đang tải...</p>
          : (active.data ?? []).length === 0 ? <p className="mt-2 text-sm text-text-secondary">Chưa có bộ quy tắc nào được kích hoạt. Hãy duyệt một bản và kích hoạt để hệ thống bắt đầu chấm bài đánh giá.</p>
          : <ul className="mt-3 space-y-2">{(active.data ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/assessment-rule-sets/${r.id}`} className="text-sm font-extrabold text-text-primary hover:text-accent-strong">{r.displayName ? `${r.displayName} (v${r.version})` : `Phiên bản v${r.version}`}</Link>
                  <div className="text-[11px] text-text-secondary">Kích hoạt {r.activatedAt ? formatDate(r.activatedAt) : "-"}{r.authorId != null ? ` · Coach #${r.authorId}` : ""}</div>
                  {r.notes && <div className="max-w-xl truncate text-[11px] text-text-secondary">{r.notes}</div>}
                </div>
                <Button3D asChild size="sm" variant="secondary"><Link to={`/admin/assessment-rule-sets/${r.id}`}><Eye size={14} aria-hidden />Xem</Link></Button3D>
              </li>))}</ul>}
      </section>
      <h2 className="text-xs font-black uppercase tracking-wide text-text-secondary">Các bản khác</h2>
      <Segmented options={TABS} value={status} onChange={setStatus} ariaLabel="Lọc theo trạng thái bộ quy tắc" />

      <Panel bodyClassName="p-0 sm:p-0" as="section">
        <h3 className="sr-only">Danh sách</h3>
        {query.isLoading ? (
          <ListSkeleton rows={4} className="p-5 sm:p-6" />
        ) : query.isError ? (
          <ErrorState title="Không tải được danh sách." description="Hệ thống đánh giá V2 có thể đang tắt (app.assessment-v2.enabled)." onRetry={() => query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          <EmptyState icon={ScrollText} title="Danh sách trống" description={EMPTY[status]} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Các phiên bản bộ quy tắc</caption>
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="px-5 py-3 sm:px-6">Phiên bản</th>
                  <th scope="col" className="px-3 py-3">Trạng thái</th>
                  <th scope="col" className="px-3 py-3">Tác giả</th>
                  <th scope="col" className="px-3 py-3">Gửi duyệt</th>
                  <th scope="col" className="px-3 py-3">Kích hoạt</th>
                  <th scope="col" className="px-5 py-3 text-right sm:px-6"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-sunken/60">
                    <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
                      <Link to={`/admin/assessment-rule-sets/${r.id}`} className="text-sm font-extrabold text-text-primary hover:text-accent-strong">{r.displayName ? `${r.displayName} (v${r.version})` : `v${r.version}`}</Link>
                      {r.notes && <div className="max-w-xs truncate text-[11px] text-text-secondary">{r.notes}</div>}
                    </th>
                    <td className="px-3 py-3.5"><StatusBadge status={RULE_SET_STATUS[r.status]} /></td>
                    <td className="px-3 py-3.5 text-sm text-text-secondary">{r.authorId != null ? `Coach #${r.authorId}` : "Hệ thống"}</td>
                    <td className="px-3 py-3.5 text-sm tabular-nums text-text-secondary">{r.submittedAt ? formatDate(r.submittedAt) : "-"}</td>
                    <td className="px-3 py-3.5 text-sm tabular-nums text-text-secondary">{r.activatedAt ? formatDate(r.activatedAt) : "-"}</td>
                    <td className="px-5 py-3.5 text-right sm:px-6">
                      <Button3D asChild size="sm" variant={r.status === "PENDING_REVIEW" ? "primary" : "secondary"}>
                        <Link to={`/admin/assessment-rule-sets/${r.id}`} aria-label={`${r.status === "PENDING_REVIEW" ? "Xem xét" : "Xem"} bộ quy tắc v${r.version}`}>
                          <Eye size={14} aria-hidden />{r.status === "PENDING_REVIEW" ? "Xem xét" : "Xem"}
                        </Link>
                      </Button3D>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
