import { AlertTriangle, Check, Circle, Clock, Lock, Rocket, Send } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { formatDateTime } from "../../lib/format";
import type { RuleSetDetail } from "../../types";
import { Button3D, Panel, TextArea, TextInput } from "../ui";
import { REVIEW_SCOPE_LABEL } from "./ruleSetEdits";

interface Props {
  detail: RuleSetDetail;
  editable: boolean;
  dirty: number;
  notes: string;
  onNotes: (v: string) => void;
  name: string;
  onName: (v: string) => void;
  onSubmit: () => void;
}

function Item({ ok, children, hint }: { ok: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", ok ? "bg-emerald-500 text-white" : "border border-border bg-surface text-text-secondary")} aria-hidden>
        {ok ? <Check size={12} /> : <Circle size={8} />}
      </span>
      <span className="min-w-0 text-sm">
        <span className={cn("font-bold", ok ? "text-text-primary" : "text-text-secondary")}>{children}</span>
        {hint && <span className="block text-[11px] text-text-secondary">{hint}</span>}
      </span>
    </li>
  );
}

/** Cột bên phải: bản nháp thì là danh sách điều kiện trước khi gửi duyệt, các trạng thái khác thì là tình trạng hiện tại và việc tiếp theo. */
export function RuleSetSidebar({ detail, editable, dirty, notes, onNotes, name, onName, onSubmit }: Props) {
  const { summary } = detail;
  const scopes = detail.requiredReviewScopes.map((s) => REVIEW_SCOPE_LABEL[s] ?? s);

  if (!editable) {
    const info =
      summary.status === "PENDING_REVIEW"
        ? { icon: Clock, title: "Đang chờ Admin duyệt", text: `Đã gửi${summary.submittedAt ? ` lúc ${formatDateTime(summary.submittedAt)}` : ""}. Bạn sẽ nhận thông báo ngay khi Admin quyết định.` }
        : summary.status === "ACTIVE"
          ? { icon: Rocket, title: "Đang áp dụng", text: `${summary.activatedAt ? `Có hiệu lực từ ${formatDateTime(summary.activatedAt)}. ` : ""}Bản này không sửa trực tiếp được. Muốn thay đổi, hãy tạo bản nháp từ bản này.` }
          : { icon: Lock, title: "Chỉ để tra cứu", text: "Bản đã lưu trữ không sửa được." };
    const Icon = info.icon;
    return (
      <Panel as="section" title={info.title} icon={Icon}>
        <p className="text-sm text-text-secondary">{info.text}</p>
        {summary.status === "PENDING_REVIEW" && scopes.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-text-secondary">Phạm vi Admin sẽ duyệt</p>
            <p className="mt-1 text-sm text-text-primary">{scopes.join(", ")}</p>
          </div>
        )}
      </Panel>
    );
  }

  const valid = detail.validationErrors.length === 0;
  const hasChanges = detail.changes.length > 0;
  const ready = dirty === 0 && valid && hasChanges;

  return (
    <Panel as="section" title="Trước khi gửi duyệt" description="Hoàn tất các điều kiện dưới đây">
      <ul className="space-y-3">
        <Item ok={dirty === 0} hint={dirty > 0 ? `Còn ${dirty} thay đổi chưa lưu` : undefined}>Đã lưu mọi thay đổi</Item>
        <Item ok={valid} hint={valid ? undefined : "Xem danh sách lỗi ở phía trên"}>Bộ quy tắc hợp lệ</Item>
        <Item ok={hasChanges} hint={hasChanges ? `${detail.changes.length} thay đổi so với bản gốc` : "Bản này đang giống hệt bản gốc"}>Có thay đổi để duyệt</Item>
      </ul>

      {editable && (
        <label className="mt-5 block">
          <span className="text-xs font-bold text-text-secondary">Tên hiển thị của bản này</span>
          <TextInput aria-label="Tên hiển thị" maxLength={120} className="mt-1.5" value={name} onChange={(e) => onName(e.target.value)} placeholder="Vd. Siết ngưỡng L2 mùa hè" />
        </label>
      )}

      <label className="mt-5 block">
        <span className="text-xs font-bold text-text-secondary">Ghi chú cho Admin</span>
        <TextArea aria-label="Ghi chú phiên bản" maxLength={1000} className="mt-1.5" value={notes} onChange={(e) => onNotes(e.target.value)} placeholder="Nêu lý do thay đổi và điều Admin cần lưu ý" />
      </label>

      {scopes.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-text-secondary">Admin sẽ duyệt</p>
          <p className="mt-1 text-sm text-text-primary">{scopes.join(", ")}</p>
        </div>
      )}

      {!valid && (
        <p className="mt-4 flex items-start gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />Sửa các lỗi hợp lệ trước khi gửi.
        </p>
      )}

      <Button3D variant="primary" className="mt-5 w-full" leftIcon={<Send size={16} />} disabled={!ready} onClick={onSubmit}>Gửi Admin duyệt</Button3D>
    </Panel>
  );
}
