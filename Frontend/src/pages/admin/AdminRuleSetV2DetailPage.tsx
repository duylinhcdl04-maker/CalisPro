import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ChevronLeft, Gavel, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { Button3D, ErrorState, Field, Modal, PageSkeleton, Panel, Segmented, StatusBadge, TextArea, type SegmentOption } from "../../features/coach/components/ui";
import { RuleChangesTable, RuleReviewsList } from "../../features/coach/components/assessmentV2/RuleHistory";
import { RuleLevelsEditor } from "../../features/coach/components/assessmentV2/RuleLevelsEditor";
import { RuleParamsEditor } from "../../features/coach/components/assessmentV2/RuleParamsEditor";
import { EMPTY_EDITS } from "../../features/coach/components/assessmentV2/ruleSetEdits";
import { RULE_SET_STATUS } from "../../features/coach/constants/assessmentV2Labels";
import { formatDateTime } from "../../features/coach/lib/format";
import { apiMessage } from "../../features/admin/coachAccounts/api";
import { useAdminRuleSet, useDecideRuleSet, type RuleSetDecision } from "../../features/admin/ruleSets/api";

type Tab = "changes" | "params" | "levels" | "reviews";
const NOOP = () => undefined;

/** Admin xem xét một bộ quy tắc Coach đã gửi: thay đổi, tham số, level, rồi duyệt và kích hoạt hoặc trả về kèm ghi chú. */
export default function AdminRuleSetV2DetailPage() {
  const { ruleSetId } = useParams();
  const id = Number(ruleSetId);
  const query = useAdminRuleSet(id);
  const decide = useDecideRuleSet(id);
  const [tab, setTab] = useState<Tab>("changes");
  const [decision, setDecision] = useState<RuleSetDecision>("APPROVED");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (query.isLoading) return <PageSkeleton kpis={2} />;
  const detail = query.data;
  if (query.isError || !detail) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <Panel><ErrorState title="Không tìm thấy bộ quy tắc." onRetry={() => query.refetch()} retrying={query.isFetching} /></Panel>
      </div>
    );
  }

  const { summary } = detail;
  const pending = summary.status === "PENDING_REVIEW";
  const firstActivation = detail.requiredReviewScopes.includes("STICKY_FLAGS");
  const notesMissing = decision === "CHANGES_REQUESTED" && notes.trim().length === 0;
  const tabs: SegmentOption<Tab>[] = [
    { value: "changes", label: "Thay đổi", count: detail.changes.length },
    { value: "params", label: "Tham số", count: detail.params.length },
    { value: "levels", label: "Level & yêu cầu", count: detail.levels.length },
    { value: "reviews", label: "Lịch sử duyệt", count: detail.reviews.length },
  ];

  function submit() {
    decide.mutate({ decision, notes: notes.trim() }, {
      onSuccess: (d) => {
        toast.success(decision === "APPROVED" ? `Đã duyệt và kích hoạt bộ quy tắc v${d.summary.version}` : "Đã trả về cho Coach sửa");
        setConfirming(false);
        setNotes("");
      },
      onError: (err) => {
        toast.error(apiMessage(err, "Không thể gửi quyết định. Vui lòng thử lại."));
        setConfirming(false);
      },
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link to="/admin/assessment-rule-sets" className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-accent-strong"><ChevronLeft size={14} aria-hidden />Hàng chờ duyệt</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-black tracking-tight text-text-primary sm:text-3xl">Bộ quy tắc v{summary.version}</h1>
          <StatusBadge size="md" status={RULE_SET_STATUS[summary.status]} />
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {summary.authorId != null ? `Tác giả: Coach #${summary.authorId}` : "Do hệ thống tạo"}
          {summary.submittedAt && ` · gửi duyệt ${formatDateTime(summary.submittedAt)}`}
          {summary.notes && ` · ${summary.notes}`}
        </p>
      </div>

      {detail.validationErrors.length > 0 && (
        <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-extrabold text-rose-700 dark:text-rose-300"><AlertTriangle size={16} aria-hidden />Bộ quy tắc không hợp lệ, không thể kích hoạt</p>
          <ul className="mt-1.5 list-disc pl-5 text-xs text-rose-700 dark:text-rose-300">{detail.validationErrors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Segmented options={tabs} value={tab} onChange={setTab} ariaLabel="Các phần của bộ quy tắc" />
          <Panel as="section">
            {tab === "changes" && <RuleChangesTable changes={detail.changes} />}
            {tab === "params" && <RuleParamsEditor params={detail.params} edits={EMPTY_EDITS.params} editable={false} onChange={NOOP} />}
            {tab === "levels" && <RuleLevelsEditor levels={detail.levels} edits={EMPTY_EDITS} editable={false} onLevelChange={NOOP} onRequirementChange={NOOP} />}
            {tab === "reviews" && <RuleReviewsList reviews={detail.reviews} requiredScopes={detail.requiredReviewScopes} />}
          </Panel>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {pending ? (
            <Panel title="Quyết định của Admin" description="Duyệt là kích hoạt ngay; bản đang áp dụng chuyển sang lưu trữ." icon={Gavel}>
              {firstActivation && (
                <p role="note" className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
                  <span>Đây là lần kích hoạt đầu tiên: bạn đang phê duyệt toàn bộ nội dung, gồm cả cấu hình an toàn (cờ an toàn, quy tắc gỡ ràng buộc, chính sách). Chỉ duyệt khi Coach chịu trách nhiệm chuyên môn đã rà soát.</span>
                </p>
              )}
              <fieldset>
                <legend className="sr-only">Chọn quyết định</legend>
                <div className="grid gap-2.5">
                  {([["APPROVED", "Duyệt và kích hoạt", "Bộ quy tắc này có hiệu lực ngay cho các phiên đánh giá mới."], ["CHANGES_REQUESTED", "Trả về để sửa", "Coach sửa lại rồi gửi duyệt lần nữa. Cần ghi rõ cần sửa gì."]] as const).map(([value, label, hint]) => (
                    <label key={value} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition", decision === value ? "border-accent bg-accent-soft/60" : "well-3d hover:border-border-strong")}>
                      <input type="radio" name="rule-decision" value={value} checked={decision === value} onChange={() => setDecision(value)} className="mt-1 h-4 w-4 accent-[hsl(var(--accent))]" />
                      <span><span className="block text-sm font-extrabold text-text-primary">{label}</span><span className="block text-xs text-text-secondary">{hint}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field className="mt-4" label={decision === "CHANGES_REQUESTED" ? "Cần Coach sửa gì" : "Ghi chú (tuỳ chọn)"} required={decision === "CHANGES_REQUESTED"} hint={`${notes.length}/1000 ký tự`}>
                {(fid, describedBy) => <TextArea id={fid} aria-describedby={describedBy} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />}
              </Field>
              <div className="mt-5 flex justify-end">
                <Button3D variant={decision === "APPROVED" ? "primary" : "secondary"} disabled={notesMissing || detail.validationErrors.length > 0 && decision === "APPROVED"} onClick={() => setConfirming(true)}>Gửi quyết định</Button3D>
              </div>
            </Panel>
          ) : (
            <Panel title="Quyết định của Admin" icon={Gavel}>
              <p className="text-sm text-text-secondary">Bộ quy tắc này không ở trạng thái chờ duyệt ({RULE_SET_STATUS[summary.status].label.toLowerCase()}).</p>
            </Panel>
          )}
        </div>
      </div>

      <Modal
        open={confirming}
        onOpenChange={setConfirming}
        title={decision === "APPROVED" ? "Duyệt và kích hoạt?" : "Trả về cho Coach?"}
        description={`Bộ quy tắc v${summary.version}`}
        size="sm"
        footer={<>
          <Button3D variant="ghost" onClick={() => setConfirming(false)} disabled={decide.isPending}>Quay lại</Button3D>
          <Button3D variant="primary" onClick={submit} loading={decide.isPending}>Xác nhận</Button3D>
        </>}
      >
        <p className="text-sm text-text-secondary">
          {decision === "APPROVED"
            ? `Bộ quy tắc này sẽ có hiệu lực ngay. Phạm vi phê duyệt: ${detail.requiredReviewScopes.join(", ")}.`
            : "Bản này trở về trạng thái nháp để Coach chỉnh sửa."}
        </p>
        {notes.trim() && <p className="mt-3 rounded-xl bg-surface-sunken/70 px-3 py-2 text-sm text-text-primary">{notes.trim()}</p>}
      </Modal>
    </div>
  );
}
