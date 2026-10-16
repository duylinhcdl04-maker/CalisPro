import { useState } from "react";
import { Gavel, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";
import { CONSTRAINT_LABEL, SAFETY_STATUS_LABEL } from "../../../safety-screening/labels";
import { useDecideSafetyClearance } from "../../hooks";
import { formatDateTime } from "../../lib/format";
import type { SafetyClearanceDetail, SafetyStatusCode } from "../../types";
import { Button3D, Field, Modal, Panel, TextArea } from "../ui";
import { apiErrorMessage } from "./v2Utils";

const NOTE_MAX = 1000;

const DECISIONS = [
  { value: "GRANTED", label: "Chấp thuận gỡ/giảm hạn chế", hint: "Chọn trạng thái mới bên dưới. Các cờ không còn hiệu lực sẽ được gỡ." },
  { value: "REJECTED", label: "Từ chối", hint: "Giữ nguyên trạng thái và giới hạn hiện tại. Cần ghi lý do." },
] as const;

/** Coach chấp thuận (chọn trạng thái kết quả, có thể giữ lại một số giới hạn) hoặc từ chối kèm lý do. Lựa chọn chỉ gồm những gì clearance rule cho phép. */
export function SafetyDecisionPanel({ detail }: { detail: SafetyClearanceDetail }) {
  const { clearance } = detail;
  const decide = useDecideSafetyClearance();
  const [decision, setDecision] = useState<"GRANTED" | "REJECTED">("GRANTED");
  const [resulting, setResulting] = useState<SafetyStatusCode | undefined>(detail.options[0]?.resultingStatus);
  const [retained, setRetained] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (clearance.status !== "REQUESTED" && clearance.status !== "UNDER_REVIEW") {
    return (
      <Panel title="Kết quả xét duyệt" icon={Gavel}>
        <p className="text-sm text-text-secondary">
          {clearance.reviewedAt ? `Đã quyết định lúc ${formatDateTime(clearance.reviewedAt)}.` : "Yêu cầu này không còn chờ xử lý."}
          {clearance.resultingStatus && ` Trạng thái mới: ${SAFETY_STATUS_LABEL[clearance.resultingStatus]}.`}
        </p>
        {clearance.note && <p className="mt-2 rounded-xl bg-surface-sunken/70 px-3 py-2 text-sm text-text-primary">{clearance.note}</p>}
      </Panel>
    );
  }

  if (!detail.canDecide) {
    return (
      <Panel title="Quyết định của Coach" icon={Gavel}>
        <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
          {detail.stale
            ? "Trạng thái an toàn của học viên đã thay đổi kể từ khi gửi yêu cầu nên không thể quyết định trên yêu cầu này. Học viên cần gửi lại."
            : detail.options.length === 0
              ? "Không có quy tắc nào cho phép gỡ trạng thái này bằng xác minh của Coach."
              : "Bạn không có quyền quyết định yêu cầu này (trạng thái Hạn chế chỉ do Coach xác minh)."}
        </p>
      </Panel>
    );
  }

  const option = detail.options.find((o) => o.resultingStatus === resulting);
  const noteMissing = decision === "REJECTED" && note.trim().length === 0;
  const retainable = detail.retainableConstraints.filter((c) => CONSTRAINT_LABEL[c]);

  function toggleRetained(code: string) {
    setRetained((r) => (r.includes(code) ? r.filter((c) => c !== code) : [...r, code]));
  }

  function submit() {
    decide.mutate(
      {
        id: clearance.id,
        decision,
        ...(decision === "GRANTED" ? { resultingStatus: resulting, retainedConstraints: option?.allowRetainedConstraints ? retained : [] } : {}),
        note: note.trim(),
      },
      {
        onSuccess: () => { toast.success(decision === "GRANTED" ? "Đã chấp thuận xác minh" : "Đã từ chối yêu cầu"); setConfirming(false); },
        onError: (err) => { toast.error(apiErrorMessage(err, "Không thể gửi quyết định. Vui lòng thử lại.")); setConfirming(false); },
      },
    );
  }

  return (
    <Panel title="Quyết định của Coach" description="Quyết định được ghi lại và tạo trạng thái an toàn mới cho học viên (không sửa lịch sử)." icon={Gavel}>
      <fieldset>
        <legend className="sr-only">Chọn quyết định</legend>
        <div className="grid gap-2.5">
          {DECISIONS.map((d) => (
            <label key={d.value} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition", decision === d.value ? "border-accent bg-accent-soft/60" : "well-3d hover:border-border-strong")}>
              <input type="radio" name="safety-decision" value={d.value} checked={decision === d.value} onChange={() => setDecision(d.value)} className="mt-1 h-4 w-4 accent-[hsl(var(--accent))]" />
              <span>
                <span className="block text-sm font-extrabold text-text-primary">{d.label}</span>
                <span className="block text-xs text-text-secondary">{d.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {decision === "GRANTED" && (
        <>
          <fieldset className="mt-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">Trạng thái mới</legend>
            <div className="grid gap-2">
              {detail.options.map((o) => (
                <label key={o.resultingStatus} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5", resulting === o.resultingStatus ? "border-accent bg-accent-soft/60" : "well-3d")}>
                  <input type="radio" name="safety-resulting" checked={resulting === o.resultingStatus} onChange={() => { setResulting(o.resultingStatus); setRetained([]); }} className="h-4 w-4 accent-[hsl(var(--accent))]" />
                  <span className="text-sm font-bold text-text-primary">{SAFETY_STATUS_LABEL[o.resultingStatus]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {option?.allowRetainedConstraints && retainable.length > 0 && (
            <fieldset className="mt-4">
              <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">Giữ lại giới hạn (tuỳ chọn)</legend>
              <p className="mb-2 text-xs text-text-secondary">Đánh dấu những giới hạn vẫn cần áp dụng dù đã gỡ hạn chế.</p>
              <div className="grid gap-1.5">
                {retainable.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-2.5 text-sm text-text-primary">
                    <input type="checkbox" checked={retained.includes(c)} onChange={() => toggleRetained(c)} className="h-4 w-4 accent-[hsl(var(--accent))]" />
                    {CONSTRAINT_LABEL[c]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </>
      )}

      <Field className="mt-4" label={decision === "REJECTED" ? "Lý do" : "Ghi chú (tuỳ chọn)"} required={decision === "REJECTED"} hint={`${note.length}/${NOTE_MAX} ký tự`}>
        {(id, describedBy) => (
          <TextArea id={id} aria-describedby={describedBy} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} placeholder={decision === "REJECTED" ? "Ví dụ: Cần giấy xác nhận của bác sĩ trước khi gỡ hạn chế." : "Ví dụ: Đã xem giấy khám sức khoẻ ngày..."} />
        )}
      </Field>

      <div className="mt-5 flex justify-end">
        <Button3D variant={decision === "REJECTED" ? "danger" : "primary"} disabled={noteMissing || (decision === "GRANTED" && !resulting)} leftIcon={<ShieldCheck size={16} />} onClick={() => setConfirming(true)}>
          Gửi quyết định
        </Button3D>
      </div>

      <Modal
        open={confirming}
        onOpenChange={setConfirming}
        title="Xác nhận gửi quyết định"
        description={`${decision === "GRANTED" ? "Chấp thuận" : "Từ chối"} - học viên #${clearance.userId}`}
        size="sm"
        footer={
          <>
            <Button3D variant="ghost" onClick={() => setConfirming(false)} disabled={decide.isPending}>Quay lại</Button3D>
            <Button3D variant={decision === "REJECTED" ? "danger" : "primary"} onClick={submit} loading={decide.isPending}>Xác nhận</Button3D>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          {decision === "GRANTED"
            ? `Học viên sẽ chuyển sang "${resulting ? SAFETY_STATUS_LABEL[resulting] : ""}"${retained.length ? `, giữ lại ${retained.length} giới hạn` : ""}. Việc này không thể hoàn tác (học viên chỉ có thể sàng lọc lại).`
            : "Học viên giữ nguyên trạng thái và giới hạn hiện tại."}
        </p>
        {note.trim() && <p className="mt-3 rounded-xl bg-surface-sunken/70 px-3 py-2 text-sm text-text-primary">{note.trim()}</p>}
      </Modal>
    </Panel>
  );
}
