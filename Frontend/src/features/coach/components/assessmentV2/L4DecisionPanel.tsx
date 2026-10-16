import { useState } from "react";
import { Gavel, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";
import { L4_DECISION_LABEL } from "../../constants/assessmentV2Labels";
import { useDecideL4Review } from "../../hooks";
import { formatDateTime } from "../../lib/format";
import type { L4Decision, L4ReviewDetail } from "../../types";
import { Button3D, Field, Modal, Panel, TextArea } from "../ui";
import { apiErrorMessage } from "./v2Utils";

const OPTIONS: L4Decision[] = ["CONFIRM", "REJECT", "REQUEST_RETEST"];
const REASON_MAX = 1000;

/** Coach quyết định trên bằng chứng đã lưu. Xác nhận cần video còn hạn; từ chối / đo lại cần lý do. Có bước xác nhận lại trước khi gửi. */
export function L4DecisionPanel({ detail }: { detail: L4ReviewDetail }) {
  const { summary, attempts } = detail;
  const decide = useDecideL4Review();
  const [decision, setDecision] = useState<L4Decision>("CONFIRM");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const hasVideo = attempts.some((a) => a.videoUrl);
  const needsReason = decision !== "CONFIRM";
  const reasonMissing = needsReason && reason.trim().length === 0;
  const confirmBlocked = decision === "CONFIRM" && !hasVideo;

  if (summary.status !== "PENDING") {
    return (
      <Panel title="Kết quả xét duyệt" icon={Gavel}>
        <p className="text-sm text-text-secondary">
          {summary.decidedAt ? `Đã quyết định lúc ${formatDateTime(summary.decidedAt)}.` : "Gói này không còn ở trạng thái chờ xác nhận."}
        </p>
        {summary.decisionReason && <p className="mt-2 rounded-xl bg-surface-sunken/70 px-3 py-2 text-sm text-text-primary">{summary.decisionReason}</p>}
      </Panel>
    );
  }

  function submit() {
    decide.mutate(
      { id: summary.id, decision, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(decision === "CONFIRM" ? `Đã xác nhận ${summary.pendingLevel} cho học viên` : "Đã ghi nhận quyết định");
          setConfirming(false);
        },
        onError: (err) => {
          toast.error(apiErrorMessage(err, "Không thể gửi quyết định. Vui lòng thử lại."));
          setConfirming(false);
        },
      }
    );
  }

  return (
    <Panel title="Quyết định của Coach" description="Dựa trên số liệu đo và video đã lưu. Quyết định được ghi vào nhật ký can thiệp." icon={Gavel}>
      <fieldset>
        <legend className="sr-only">Chọn quyết định</legend>
        <div className="grid gap-2.5">
          {OPTIONS.map((opt) => {
            const active = decision === opt;
            return (
              <label key={opt} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition", active ? "border-accent bg-accent-soft/60" : "well-3d hover:border-border-strong")}>
                <input type="radio" name="l4-decision" value={opt} checked={active} onChange={() => setDecision(opt)} className="mt-1 h-4 w-4 accent-[hsl(var(--accent))]" />
                <span>
                  <span className="block text-sm font-extrabold text-text-primary">{L4_DECISION_LABEL[opt].label}</span>
                  <span className="block text-xs text-text-secondary">{L4_DECISION_LABEL[opt].hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field
        className="mt-4"
        label={needsReason ? "Lý do" : "Ghi chú (tuỳ chọn)"}
        required={needsReason}
        hint={`${reason.length}/${REASON_MAX} ký tự`}
        error={confirmBlocked ? "Chưa có video còn hạn nên không thể xác nhận. Hãy yêu cầu đo lại hoặc từ chối kèm lý do." : undefined}
      >
        {(id, describedBy) => (
          <TextArea id={id} aria-describedby={describedBy} maxLength={REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={needsReason ? "Ví dụ: Rep 3 bị che tay, form chưa đạt chuẩn..." : "Ví dụ: Form ổn định ở cả 5 rep."} />
        )}
      </Field>

      <div className="mt-5 flex justify-end">
        <Button3D variant={decision === "REJECT" ? "danger" : "primary"} disabled={reasonMissing || confirmBlocked} leftIcon={<ShieldCheck size={16} />} onClick={() => setConfirming(true)}>
          Gửi quyết định
        </Button3D>
      </div>

      <Modal
        open={confirming}
        onOpenChange={setConfirming}
        title="Xác nhận gửi quyết định"
        description={`${L4_DECISION_LABEL[decision].label} - học viên #${summary.userId}`}
        size="sm"
        footer={
          <>
            <Button3D variant="ghost" onClick={() => setConfirming(false)} disabled={decide.isPending}>Quay lại</Button3D>
            <Button3D variant={decision === "REJECT" ? "danger" : "primary"} onClick={submit} loading={decide.isPending}>Xác nhận</Button3D>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          {decision === "CONFIRM"
            ? `Học viên sẽ được xếp ${summary.pendingLevel} với nguồn "Coach xác nhận". Thao tác này không thể hoàn tác.`
            : "Học viên giữ nguyên level hiện tại. Quyết định này không phải bằng chứng tiêu cực về năng lực."}
        </p>
        {reason.trim() && <p className="mt-3 rounded-xl bg-surface-sunken/70 px-3 py-2 text-sm text-text-primary">{reason.trim()}</p>}
      </Modal>
    </Panel>
  );
}
