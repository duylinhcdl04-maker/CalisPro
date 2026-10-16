import { ArrowRight } from "lucide-react";
import { formatDateTime } from "../../lib/format";
import type { RuleChange, RuleReview } from "../../types";
import { EmptyState, StatusBadge } from "../ui";
import { describeChangeTarget } from "../../../level/levelLabels";
import { REVIEW_SCOPE_LABEL } from "./ruleSetEdits";

const TYPE_LABEL: Record<RuleChange["targetType"], string> = { PARAM: "Tham số", LEVEL: "Ngưỡng level", REQUIREMENT: "Điều kiện cổng" };

/** Nhật ký thay đổi (giá trị cũ → mới). Đây là căn cứ để Admin xem Coach đã đổi gì và để xác định phạm vi phê duyệt. */
export function RuleChangesTable({ changes }: { changes: RuleChange[] }) {
  if (changes.length === 0) return <EmptyState title="Chưa có thay đổi nào" description="Bản này đang giống hệt phiên bản gốc." />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Nhật ký thay đổi của bộ quy tắc</caption>
        <thead>
          <tr className="border-b border-border bg-surface-sunken/50 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            <th scope="col" className="px-3 py-2">Loại</th>
            <th scope="col" className="px-3 py-2">Mục</th>
            <th scope="col" className="px-3 py-2">Thay đổi</th>
            <th scope="col" className="px-3 py-2">Lúc</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c) => (
            <tr key={c.id} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2"><StatusBadge tone="info">{TYPE_LABEL[c.targetType]}</StatusBadge></td>
              <td className="px-3 py-2">
                <span className="block text-[13px] font-bold text-text-primary">{describeChangeTarget(c.targetType, c.targetKey).title}</span>
                <span className="block font-mono text-[10px] text-text-secondary/80">{c.targetKey}</span>
              </td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <span className="text-text-secondary line-through">{c.oldValue ?? "-"}</span>
                  <ArrowRight size={13} className="text-text-secondary" aria-hidden />
                  <span className="font-extrabold text-text-primary">{c.newValue ?? "-"}</span>
                </span>
              </td>
              <td className="px-3 py-2 text-xs tabular-nums text-text-secondary">{formatDateTime(c.at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Phạm vi Admin sẽ phê duyệt và lịch sử các lần duyệt. */
export function RuleReviewsList({ reviews, requiredScopes }: { reviews: RuleReview[]; requiredScopes: string[] }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-text-secondary">Phạm vi Admin sẽ phê duyệt</h3>
        <div className="flex flex-wrap gap-2">
          {requiredScopes.map((s) => <StatusBadge key={s} size="md" tone="accent">{REVIEW_SCOPE_LABEL[s] ?? s}</StatusBadge>)}
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Lần kích hoạt đầu tiên của bộ quy tắc phải phê duyệt mọi phạm vi (phần an toàn chưa từng được duyệt). Các lần sau chỉ gồm phạm vi có thay đổi.
        </p>
      </div>
      {reviews.length === 0 ? (
        <EmptyState title="Chưa có lần duyệt nào" description="Sau khi bạn gửi duyệt, quyết định của Admin sẽ hiển thị ở đây." />
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/70">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-3 px-3.5 py-3">
              <StatusBadge tone={r.decision === "APPROVED" ? "success" : "warning"}>{r.decision === "APPROVED" ? "Đã duyệt" : "Cần sửa"}</StatusBadge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary">{REVIEW_SCOPE_LABEL[r.scope] ?? r.scope}</p>
                {r.notes && <p className="mt-0.5 text-xs text-text-secondary">{r.notes}</p>}
              </div>
              <span className="text-[11px] tabular-nums text-text-secondary">{formatDateTime(r.reviewedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
