import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Eye, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { RULE_SET_STATUS } from "../constants/assessmentV2Labels";
import { useCloneRuleSet, useRuleSets } from "../hooks";
import { formatDate } from "../lib/format";
import { Button3D, EmptyState, ErrorState, ListSkeleton, PageHeader, Panel, StatusBadge } from "../components/ui";
import { apiErrorMessage } from "../components/assessmentV2/v2Utils";

/** Các phiên bản bộ quy tắc đánh giá V2. Coach soạn (clone → sửa → gửi duyệt), Admin duyệt và kích hoạt. */
export default function CoachRuleSetsPage() {
  const query = useRuleSets();
  const clone = useCloneRuleSet();
  const navigate = useNavigate();
  const all = query.data ?? [];
  const active = all.filter((r) => r.status === "ACTIVE");
  const items = all.filter((r) => r.status !== "ACTIVE");

  function cloneFrom(id: number) {
    clone.mutate(id, {
      onSuccess: (created) => {
        toast.success(`Đã tạo bản nháp v${created.summary.version}`);
        navigate(`/coach/rule-sets/${created.summary.id}`);
      },
      onError: (err) => toast.error(apiErrorMessage(err, "Không thể tạo bản sao. Vui lòng thử lại.")),
    });
  }

  return (
    <div>
      <PageHeader
        title="Quy tắc bài đánh giá"
        description="Ngưỡng level, yêu cầu và tham số của hệ thống đánh giá V2. Bạn soạn trên bản nháp rồi gửi Admin duyệt và kích hoạt."
      />

      <section aria-label="Bản đang áp dụng" className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-black text-text-primary"><CheckCircle2 size={16} className="text-emerald-500" aria-hidden />Đang áp dụng</h2>
        {query.isLoading ? <p className="mt-2 text-sm text-text-secondary">Đang tải...</p>
          : active.length === 0 ? <p className="mt-2 text-sm text-text-secondary">Chưa có bản nào được kích hoạt. Soạn một bản nháp và gửi Admin duyệt.</p>
          : <ul className="mt-3 space-y-2">{active.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/coach/rule-sets/${r.id}`} className="text-sm font-extrabold text-text-primary hover:text-accent-strong">{r.displayName ? `${r.displayName} (v${r.version})` : `Phiên bản v${r.version}`}</Link>
                  <div className="text-[11px] text-text-secondary">Kích hoạt {r.activatedAt ? formatDate(r.activatedAt) : "-"}</div>
                </div>
                <Button3D asChild size="sm" variant="secondary"><Link to={`/coach/rule-sets/${r.id}`}><Eye size={14} aria-hidden />Xem</Link></Button3D>
                <Button3D size="sm" variant="primary" leftIcon={<Copy size={14} />} loading={clone.isPending && clone.variables === r.id} disabled={clone.isPending} onClick={() => cloneFrom(r.id)}>Tạo bản nháp</Button3D>
              </li>))}</ul>}
      </section>
      <h2 className="mb-2 text-xs font-black uppercase tracking-wide text-text-secondary">Bản nháp, chờ duyệt và đã lưu trữ</h2>

      <Panel className="animate-rise overflow-hidden" bodyClassName="p-0 sm:p-0" as="section">
        <h3 className="sr-only">Các phiên bản</h3>
        {query.isLoading ? (
          <ListSkeleton rows={4} className="p-5 sm:p-6" />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          <EmptyState icon={ScrollText} title="Không có bản nào khác" description="Các bản nháp, bản chờ duyệt và bản đã lưu trữ sẽ hiện ở đây." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Các phiên bản bộ quy tắc</caption>
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="px-5 py-3 sm:px-6">Phiên bản</th>
                  <th scope="col" className="px-3 py-3">Trạng thái</th>
                  <th scope="col" className="px-3 py-3">Tác giả</th>
                  <th scope="col" className="px-3 py-3">Tạo</th>
                  <th scope="col" className="px-3 py-3">Kích hoạt</th>
                  <th scope="col" className="px-5 py-3 text-right sm:px-6"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id} className="animate-rise border-b border-border/60 transition-colors last:border-0 hover:bg-surface-sunken/60" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                    <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
                      <Link to={`/coach/rule-sets/${r.id}`} className="text-sm font-extrabold text-text-primary hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent">{r.displayName ? `${r.displayName} (v${r.version})` : `v${r.version}`}</Link>
                      {r.notes && <div className="max-w-xs truncate text-[11px] text-text-secondary">{r.notes}</div>}
                    </th>
                    <td className="px-3 py-3.5"><StatusBadge status={RULE_SET_STATUS[r.status]} /></td>
                    <td className="px-3 py-3.5 text-sm text-text-secondary">{r.authorId != null ? `Coach #${r.authorId}` : "Hệ thống"}</td>
                    <td className="px-3 py-3.5 text-sm tabular-nums text-text-secondary">{formatDate(r.createdAt)}</td>
                    <td className="px-3 py-3.5 text-sm tabular-nums text-text-secondary">{r.activatedAt ? formatDate(r.activatedAt) : "-"}</td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <Button3D asChild size="sm" variant="secondary">
                          <Link to={`/coach/rule-sets/${r.id}`} aria-label={`Xem bộ quy tắc v${r.version}`}><Eye size={14} aria-hidden />Xem</Link>
                        </Button3D>
                        <Button3D size="sm" variant="primary" leftIcon={<Copy size={14} />} loading={clone.isPending && clone.variables === r.id} disabled={clone.isPending} onClick={() => cloneFrom(r.id)} aria-label={`Tạo bản nháp từ v${r.version}`}>
                          Tạo bản nháp
                        </Button3D>
                      </div>
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
