import { useParams } from "react-router-dom";
import { Info, ListChecks } from "lucide-react";
import { SAFETY_CLEARANCE_STATUS, SAFETY_STATUS_TONE } from "../constants/assessmentV2Labels";
import { useSafetyClearance } from "../hooks";
import { formatDate, formatDateTime } from "../lib/format";
import { CONSTRAINT_LABEL, FLAG_LABEL } from "../../safety-screening/labels";
import { ErrorState, PageHeader, PageSkeleton, Panel, StatusBadge } from "../components/ui";
import { SafetyDecisionPanel } from "../components/assessmentV2/SafetyDecisionPanel";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-sunken/70 px-3.5 py-2.5">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm font-extrabold text-text-primary">{children}</dd>
    </div>
  );
}

/** Chi tiết một yêu cầu xác minh: tình trạng an toàn hiện tại của học viên (cờ, giới hạn) và quyết định. */
export default function CoachSafetyClearanceDetailPage() {
  const { clearanceId } = useParams();
  const id = Number(clearanceId);
  const query = useSafetyClearance(id);

  if (query.isLoading) return <PageSkeleton kpis={3} />;
  if (query.isError || !query.data) {
    return (
      <div>
        <PageHeader title="Xác minh an toàn" back={{ to: "/coach/safety-clearances", label: "Danh sách xác minh an toàn" }} />
        <Panel><ErrorState title="Không tìm thấy yêu cầu." description="Yêu cầu có thể không tồn tại hoặc bạn không có quyền xem." onRetry={() => query.refetch()} retrying={query.isFetching} /></Panel>
      </div>
    );
  }

  const d = query.data;
  const c = d.clearance;
  const limits = d.constraints.filter((k) => CONSTRAINT_LABEL[k]);

  return (
    <div>
      <PageHeader
        title={d.userName ? `${d.userName} (học viên #${c.userId})` : `Học viên #${c.userId}`}
        description="Xác minh thông tin sức khoẻ học viên đã khai để nới hoặc gỡ hạn chế tập. Đây không phải chẩn đoán y tế."
        back={{ to: "/coach/safety-clearances", label: "Danh sách xác minh an toàn" }}
        meta={<StatusBadge size="md" status={SAFETY_CLEARANCE_STATUS[c.status]} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Panel title="Tình trạng hiện tại" icon={Info}>
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Fact label="Trạng thái">{d.currentStatus ? <StatusBadge status={SAFETY_STATUS_TONE[d.currentStatus]} /> : "-"}</Fact>
              <Fact label="Gửi lúc">{formatDateTime(c.requestedAt)}</Fact>
              <Fact label="Hiệu lực đến">{d.validUntil ? formatDate(d.validUntil) : "-"}</Fact>
              <Fact label="Đã đọc khuyến nghị">{d.acknowledged ? "Rồi" : "Chưa"}</Fact>
            </dl>
            {d.stale && (
              <p role="status" className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                Học viên đã sàng lọc lại sau khi gửi yêu cầu. Thông tin bên dưới là tình trạng mới nhất.
              </p>
            )}
            {c.evidenceRef && <p className="mt-3 text-xs text-text-secondary">Tài liệu đính kèm: <span className="break-all font-semibold text-text-primary">{c.evidenceRef}</span></p>}
          </Panel>

          <Panel title="Điểm cần lưu ý và giới hạn" icon={ListChecks}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary">Cờ đang hiệu lực</h3>
                {d.activeFlags.length === 0 ? <p className="text-sm text-text-secondary">Không có.</p> : (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary">
                    {d.activeFlags.map((f) => (
                      <li key={f.code}>
                        {FLAG_LABEL[f.code] ?? f.code}
                        {f.sticky && <span className="ml-1.5 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">Cờ cố định</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary">Giới hạn đang áp dụng</h3>
                {limits.length === 0 ? <p className="text-sm text-text-secondary">Không có.</p> : (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary">{limits.map((k) => <li key={k}>{CONSTRAINT_LABEL[k]}</li>)}</ul>
                )}
              </div>
            </div>
          </Panel>
        </div>

        <SafetyDecisionPanel detail={d} />
      </div>
    </div>
  );
}
