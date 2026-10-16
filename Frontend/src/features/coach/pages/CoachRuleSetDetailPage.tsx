import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Copy, MessageSquareWarning, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { RULE_SET_STATUS } from "../constants/assessmentV2Labels";
import { useCloneRuleSet, useRuleSet, useSubmitRuleSet, useUpdateRuleSet } from "../hooks";
import { formatDateTime } from "../lib/format";
import { Button3D, ErrorState, Modal, PageHeader, PageSkeleton, Panel, Segmented, StatusBadge, type SegmentOption } from "../components/ui";
import { RuleLevelsEditor } from "../components/assessmentV2/RuleLevelsEditor";
import { RuleParamsEditor } from "../components/assessmentV2/RuleParamsEditor";
import { RuleChangesTable, RuleReviewsList } from "../components/assessmentV2/RuleHistory";
import { LevelLadder } from "../components/assessmentV2/LevelLadder";
import { RuleSetSidebar } from "../components/assessmentV2/RuleSetSidebar";
import { RuleSetWorkflow } from "../components/assessmentV2/RuleSetWorkflow";
import { EMPTY_EDITS, REVIEW_SCOPE_LABEL, buildUpdate, countEdits, hasChanges, invalidEdits, type RuleSetEdits } from "../components/assessmentV2/ruleSetEdits";
import { apiErrorMessage } from "../components/assessmentV2/v2Utils";

type Tab = "params" | "levels" | "changes" | "reviews";

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warning" | "critical" }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface px-4 py-3">
      <p className="text-[11px] font-bold text-text-secondary">{label}</p>
      <p className={`mt-0.5 text-2xl font-black tabular-nums ${tone === "critical" && value > 0 ? "text-rose-600 dark:text-rose-400" : tone === "warning" && value > 0 ? "text-amber-600 dark:text-amber-400" : "text-text-primary"}`}>{value}</p>
    </div>
  );
}

/** Soạn một phiên bản bộ quy tắc: sửa tham số và ngưỡng level, theo dõi thay đổi, gửi Admin duyệt. Chỉ bản nháp sửa được. */
export default function CoachRuleSetDetailPage() {
  const { ruleSetId } = useParams();
  const id = Number(ruleSetId);
  const navigate = useNavigate();
  const query = useRuleSet(id);
  const update = useUpdateRuleSet(id);
  const submit = useSubmitRuleSet(id);
  const clone = useCloneRuleSet();
  const [tab, setTab] = useState<Tab>("params");
  const [edits, setEdits] = useState<RuleSetEdits>(EMPTY_EDITS);
  const [notes, setNotes] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const dirty = countEdits(edits) + (notes !== null ? 1 : 0) + (name !== null ? 1 : 0);

  useEffect(() => { setEdits(EMPTY_EDITS); setNotes(null); setName(null); }, [id]);
  useEffect(() => {
    if (dirty === 0) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const detail = query.data;
  const editable = detail?.summary.status === "DRAFT";
  const tabs: SegmentOption<Tab>[] = useMemo(() => [
    { value: "params", label: "Tham số", count: detail?.params.length },
    { value: "levels", label: "Ngưỡng level", count: detail?.levels.length },
    { value: "changes", label: "Nhật ký thay đổi", count: detail?.changes.length },
    { value: "reviews", label: "Kết quả duyệt", count: detail?.reviews.length },
  ], [detail]);

  if (query.isLoading) return <PageSkeleton kpis={2} />;
  if (query.isError || !detail) {
    return (
      <div>
        <PageHeader title="Bộ quy tắc đánh giá" back={{ to: "/coach/rule-sets", label: "Các phiên bản" }} />
        <Panel><ErrorState title="Không tìm thấy bộ quy tắc." onRetry={() => query.refetch()} retrying={query.isFetching} /></Panel>
      </div>
    );
  }

  const { summary } = detail;
  // Admin vừa trả bản về để chỉnh sửa: Coach phải thấy lý do ngay, không phải đi tìm trong tab khác
  const lastReview = [...detail.reviews].sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0];
  const returned = summary.status === "DRAFT" && lastReview?.decision === "CHANGES_REQUESTED" ? lastReview : null;

  const setParam = (key: string, value: string | null) => setEdits((e) => {
    const params = { ...e.params };
    if (value === null) delete params[key]; else params[key] = value;
    return { ...e, params };
  });
  const setLevel = (code: string, field: "promoteMin" | "regressBelow" | "minCompetencyConfidence", value: string | null) => setEdits((e) => {
    const fields = { ...(e.levels[code] ?? {}) };
    if (value === null) delete fields[field]; else fields[field] = value;
    const levels = { ...e.levels, [code]: fields };
    if (Object.keys(fields).length === 0) delete levels[code];
    return { ...e, levels };
  });
  const setRequirement = (reqId: number, value: string | null) => setEdits((e) => {
    const requirements = { ...e.requirements };
    if (value === null) delete requirements[reqId]; else requirements[reqId] = value;
    return { ...e, requirements };
  });

  function discard() { setEdits(EMPTY_EDITS); setNotes(null); setName(null); }

  function save() {
    if (!detail) return;
    const bad = invalidEdits(detail, edits);
    if (bad.length > 0) { toast.error(`Giá trị không hợp lệ: ${bad.slice(0, 3).join(", ")}${bad.length > 3 ? "..." : ""}`); return; }
    const body = { ...buildUpdate(detail, edits), ...(notes !== null ? { notes } : {}), ...(name !== null ? { displayName: name } : {}) };
    if (!hasChanges(body) && notes === null && name === null) { toast.info("Không có thay đổi nào để lưu."); setEdits(EMPTY_EDITS); return; }
    update.mutate(body, {
      onSuccess: () => { toast.success("Đã lưu thay đổi"); discard(); },
      onError: (err) => toast.error(apiErrorMessage(err, "Không thể lưu. Vui lòng thử lại.")),
    });
  }

  function sendForReview() {
    submit.mutate(undefined, {
      onSuccess: () => { toast.success("Đã gửi Admin duyệt"); setConfirmSubmit(false); },
      onError: (err) => { toast.error(apiErrorMessage(err, "Không thể gửi duyệt. Vui lòng thử lại.")); setConfirmSubmit(false); },
    });
  }

  function cloneThis() {
    clone.mutate(id, {
      onSuccess: (created) => { toast.success(`Đã tạo bản nháp v${created.summary.version}`); navigate(`/coach/rule-sets/${created.summary.id}`); },
      onError: (err) => toast.error(apiErrorMessage(err, "Không thể tạo bản sao. Vui lòng thử lại.")),
    });
  }

  const scopes = detail.requiredReviewScopes.map((s) => REVIEW_SCOPE_LABEL[s] ?? s);

  return (
    <div>
      <PageHeader
        title={summary.displayName ? `${summary.displayName} (v${summary.version})` : `Quy tắc bài đánh giá, phiên bản ${summary.version}`}
        description={summary.notes ?? "Các ngưỡng và tham số dùng để đánh giá và xếp level cho học viên."}
        back={{ to: "/coach/rule-sets", label: "Các phiên bản" }}
        meta={<>
          <StatusBadge size="md" status={RULE_SET_STATUS[summary.status]} />
          <span className="text-xs text-text-secondary">{summary.authorId != null ? `Người soạn: Coach #${summary.authorId}` : "Do hệ thống tạo"}</span>
          <span className="text-xs text-text-secondary">Tạo lúc {formatDateTime(summary.createdAt)}</span>
        </>}
        actions={<Button3D variant="secondary" leftIcon={<Copy size={16} />} onClick={cloneThis} loading={clone.isPending}>Tạo bản nháp từ bản này</Button3D>}
      />

      <RuleSetWorkflow status={summary.status} />

      {returned && (
        <div role="alert" className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-extrabold text-amber-800 dark:text-amber-200">
            <MessageSquareWarning size={16} aria-hidden />Admin yêu cầu chỉnh sửa
            <span className="text-[11px] font-semibold text-amber-700/80 dark:text-amber-300/80">{formatDateTime(returned.reviewedAt)}</span>
          </p>
          <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">{returned.notes ?? "Không có ghi chú kèm theo."}</p>
        </div>
      )}

      {editable && detail.validationErrors.length > 0 && (
        <div role="alert" className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-extrabold text-rose-700 dark:text-rose-300"><AlertTriangle size={16} aria-hidden />Bộ quy tắc chưa hợp lệ, chưa thể gửi duyệt</p>
          <ul className="mt-1.5 list-disc pl-5 text-xs text-rose-700 dark:text-rose-300">{detail.validationErrors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Tham số" value={detail.params.length} />
        <Stat label="Thay đổi đã lưu" value={detail.changes.length} />
        <Stat label="Chưa lưu" value={dirty} tone="warning" />
        <Stat label="Lỗi cần sửa" value={detail.validationErrors.length} tone="critical" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          <div className="mb-4"><Segmented options={tabs} value={tab} onChange={setTab} ariaLabel="Các phần của bộ quy tắc" /></div>
          <Panel as="section" className="animate-rise">
            {tab === "params" && <RuleParamsEditor params={detail.params} edits={edits.params} editable={editable} onChange={setParam} />}
            {tab === "levels" && (
              <>
                <LevelLadder levels={detail.levels} edits={edits} />
                <RuleLevelsEditor levels={detail.levels} edits={edits} editable={editable} onLevelChange={setLevel} onRequirementChange={setRequirement} />
              </>
            )}
            {tab === "changes" && <RuleChangesTable changes={detail.changes} />}
            {tab === "reviews" && <RuleReviewsList reviews={detail.reviews} requiredScopes={detail.requiredReviewScopes} />}
          </Panel>
        </div>

        <div className="lg:sticky lg:top-24">
          <RuleSetSidebar detail={detail} editable={!!editable} dirty={dirty} notes={notes ?? summary.notes ?? ""} onNotes={setNotes} name={name ?? summary.displayName ?? ""} onName={setName} onSubmit={() => setConfirmSubmit(true)} />
        </div>
      </div>

      {editable && dirty > 0 && (
        <div role="region" aria-label="Thay đổi chưa lưu" className="sticky bottom-4 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-surface px-4 py-3 shadow-lg">
          <p className="text-sm font-bold text-text-primary">Có {dirty} thay đổi chưa lưu</p>
          <div className="flex items-center gap-2">
            <Button3D variant="ghost" leftIcon={<RotateCcw size={16} />} disabled={update.isPending} onClick={discard}>Hoàn tác</Button3D>
            <Button3D variant="primary" leftIcon={<Save size={16} />} loading={update.isPending} onClick={save}>Lưu thay đổi</Button3D>
          </div>
        </div>
      )}

      <Modal
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Gửi Admin duyệt?"
        description={`Bộ quy tắc phiên bản ${summary.version}`}
        size="sm"
        footer={<>
          <Button3D variant="ghost" onClick={() => setConfirmSubmit(false)} disabled={submit.isPending}>Quay lại</Button3D>
          <Button3D variant="primary" onClick={sendForReview} loading={submit.isPending}>Gửi duyệt</Button3D>
        </>}
      >
        <p className="text-sm text-text-secondary">Sau khi gửi, bản này bị khóa cho tới khi Admin quyết định. Admin duyệt xong sẽ kích hoạt ngay.</p>
        <p className="mt-3 text-xs font-bold text-text-secondary">Phạm vi Admin sẽ duyệt</p>
        <p className="mt-1 text-sm text-text-primary">{scopes.join(", ")}</p>
        <p className="mt-3 text-xs text-text-secondary">{detail.changes.length} thay đổi so với phiên bản gốc.</p>
      </Modal>
    </div>
  );
}
