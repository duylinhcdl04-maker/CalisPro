import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Info, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { AttemptStep } from "../../features/assessment-v2/AttemptStep";
import { apiMessage, baselineApi, periodicApi, type BaselineProgress, type LevelStatus, type StartBaseline, type SubmitAttempt } from "../../features/assessment-v2/api";
import { RecordingConsentDialog } from "../../features/assessment-recording/RecordingConsentDialog";
import { useAttemptRecording } from "../../features/assessment-recording/useAttemptRecording";
import { useUploadAfterSubmit } from "../../features/assessment-recording/useUploadAfterSubmit";
import { parseApiError } from "../../features/safety-screening/api";

const COMPETENCY_LABEL: Record<string, string> = {
  PUSH: "Sức mạnh đẩy", PULL: "Sức mạnh kéo", LEGS: "Chân", CORE: "Thân giữa", SKILL: "Kỹ năng", MOBILITY: "Linh hoạt",
};
const LEVELS = [1, 2, 3, 4];
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "–");

function reasonText(reason: string, level: number): string {
  if (reason.startsWith("REQUIREMENT_TEST")) return `Kiểm tra yêu cầu để đạt L${level}`;
  if (reason.startsWith("COVERAGE_TEST")) return `Bổ sung dữ liệu cho bậc L${level}`;
  return `Bài đo bậc L${level}`;
}

/** Baseline thực hành: leo từng bậc L1→L4, mỗi bậc đo 1–2 lần bằng camera; kết thúc khi xác định được level hoặc cần đo lại. */
export default function BaselineAssessmentPage() {
  const qc = useQueryClient();
  const level = useQuery({ queryKey: ["v2-level"], queryFn: periodicApi.level, retry: false });

  const [session, setSession] = useState<StartBaseline | null>(null);
  const [progress, setProgress] = useState<BaselineProgress | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentAsked, setConsentAsked] = useState(false);
  const [safetyBlock, setSafetyBlock] = useState<string | null>(null);
  const [deferOpen, setDeferOpen] = useState(false);
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [deferred, setDeferred] = useState(false);
  const status = useQuery({ queryKey: ["v2-level-status"], queryFn: baselineApi.levelStatus, retry: false });
  const refreshStatus = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["v2-level-status"] });
    void qc.invalidateQueries({ queryKey: ["v2-journey"] });
  }, [qc]);

  const recording = useAttemptRecording("baseline", session?.sessionId ?? null);
  const upload = useUploadAfterSubmit(recording);

  const step = progress ? progress.next : session?.next ?? null;
  const finished = progress !== null && progress.outcome !== "IN_PROGRESS";

  // Chỉ bậc L4 cần video cho Coach: hỏi đồng ý ngay khi bước tiếp theo thuộc bậc L4 (một lần mỗi phiên)
  useEffect(() => { setConsentAsked(false); }, [session?.sessionId]);
  useEffect(() => {
    if (step && step.level >= 4 && recording.consent === "UNKNOWN" && !consentAsked && !finished) { setConsentOpen(true); setConsentAsked(true); }
  }, [step, recording.consent, consentAsked, finished]);

  const start = useMutation({
    mutationFn: baselineApi.start,
    onSuccess: (s) => { setSession(s); setProgress(null); upload.reset(); },
    onError: (e) => {
      const { code, message } = parseApiError(e, "Không bắt đầu được bài đo");
      if (code === "SAFETY_SCREENING_REQUIRED" || code === "ACKNOWLEDGEMENT_REQUIRED" || code === "ASSESSMENT_PARTICIPATION_RESTRICTED") setSafetyBlock(message);
      else toast.error(message);
    },
  });

  const defer = useMutation({
    mutationFn: baselineApi.defer,
    onSuccess: () => { setDeferOpen(false); setDeferred(true); refreshStatus(); },
    onError: (e) => toast.error(apiMessage(e, "Không lưu được lựa chọn. Thử lại.")),
  });

  const finishEarly = useMutation({
    mutationFn: () => baselineApi.finishEarly(session!.sessionId),
    onSuccess: (p) => { setEarlyOpen(false); setProgress(p); upload.noteSubmitted(null, false); void qc.invalidateQueries({ queryKey: ["v2-level"] }); refreshStatus(); },
    onError: (e) => { setEarlyOpen(false); toast.warning(apiMessage(e, "Chưa thể kết thúc sớm.").replace(/^[A-Z][A-Z0-9_]+:\s*/, "")); },
  });

  const onSubmitted = useCallback((p: BaselineProgress) => {
    setProgress(p);
    upload.noteSubmitted(p.lastAttempt?.attemptId ?? null, p.outcome === "IN_PROGRESS" || p.l4Review === "PENDING_COACH");
    if (p.lastAttempt?.measurementStatus === "INVALID_MEASUREMENT") toast.warning("Lần đo này chưa đủ tin cậy nên không được tính. Hãy bố trí camera thấy rõ toàn thân và đo lại.");
    if (p.outcome !== "IN_PROGRESS") {
      void qc.invalidateQueries({ queryKey: ["v2-level"] });
      void qc.invalidateQueries({ queryKey: ["v2-l4-review"] });
      refreshStatus();
    }
  }, [qc, upload.noteSubmitted, refreshStatus]);

  const submitAttempt = useMemo(() => (req: SubmitAttempt) => baselineApi.submit(session!.sessionId, req), [session]);

  async function answerConsent(granted: boolean) {
    if (await recording.answerConsent(granted)) setConsentOpen(false);
    else toast.error("Không lưu được lựa chọn ghi hình. Thử lại.");
  }

  if (level.isLoading) return <div className="grid place-items-center p-16"><Loader2 className="animate-spin text-text-secondary" /></div>;
  const featureOff = level.isError;
  const hasLevel = level.isSuccess && level.data !== null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-6">
      <header>
        <h1 className="font-display text-2xl font-black text-text-primary">Bài đo thực hành đầu tiên</h1>
        <p className="mt-1 text-sm text-text-secondary">Đo bằng camera để xác nhận level thật của bạn. Bạn đi từng bậc từ L1; dừng ở bậc đầu tiên chưa đạt.</p>
      </header>

      {featureOff && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />Tính năng đánh giá thực hành chưa được bật.
        </p>
      )}

      {safetyBlock && (
        <p className="flex flex-wrap items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{safetyBlock}. <Link to="/safety-screening" className="font-bold underline">Mở trang sàng lọc an toàn</Link></span>
        </p>
      )}

      {hasLevel && !session && !finished && status.data?.retake.eligible && (
        <div className="space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm text-text-primary">
            Level đã đo của bạn là <b>{level.data!.levelCode}</b>, thấp hơn level tạm thời <b>{status.data.provisionalLevel}</b> từ khảo sát.
            Bạn có thể <b>đo lại 1 lần</b> bất kỳ lúc nào trước <b>{fmtDate(status.data.retake.availableUntil)}</b> (có thể do mệt hoặc đặt camera chưa tốt).
            Hệ thống sẽ lấy <b>level cao nhất</b> của hai lần đo.
          </p>
          <Button variant="accent" onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ClipboardCheck size={15} aria-hidden />}Đo lại (lượt duy nhất)
          </Button>
        </div>
      )}

      {hasLevel && !session && !finished && !status.data?.retake.eligible && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
          Bạn đã có level <b className="text-text-primary">{level.data!.levelCode}</b>
          {status.data?.retake.used ? <> (mức cao nhất của hai lần đo: {status.data.retake.firstLevel} và {status.data.retake.retakeLevel})</> : null}
          {status.data?.verifiedPartial ? <> — đây là mức <b>tối thiểu</b> đã xác nhận do bạn kết thúc sớm</> : null}
          . Để cập nhật level hãy dùng <Link to="/assessment/periodic" className="font-bold text-accent underline">đánh giá định kỳ</Link>.
        </p>
      )}

      {deferred && !session && !hasLevel && (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
          <Info size={16} className="mt-0.5 shrink-0" />
          Đã ghi nhận. Bạn đang dùng <b className="text-text-primary">Level tạm thời {status.data?.provisionalLevel ?? ""}</b> (từ khảo sát tự khai). Bạn có thể đo bằng camera bất kỳ lúc nào; chúng tôi sẽ nhắc lại sau ít ngày.
        </p>
      )}

      {!hasLevel && !featureOff && !session && !finished && !deferred && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-text-secondary">
            <li>Cần khu vực đủ rộng, camera thấy rõ toàn thân, mặc đồ gọn.</li>
            <li>Nghỉ giữa các lần đo; dừng ngay nếu thấy đau hoặc khó chịu (có nút riêng, và đây không bị tính là kết quả kém).</li>
            <li>Lần đo không đủ tin cậy sẽ không được tính, bạn có thể đo lại.</li>
            <li>Level cao nhất (L4) cần Huấn luyện viên xem video để xác nhận.</li>
          </ul>
          <Button variant="accent" onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ClipboardCheck size={15} aria-hidden />}Bắt đầu bài đo
          </Button>
          <Button variant="outline" className="ml-2" onClick={() => setDeferOpen(true)} disabled={start.isPending}>Bỏ qua, đo sau</Button>
          {deferOpen && (
            <div role="alertdialog" aria-label="Xác nhận bỏ qua bài đo" className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              <p>
                Nếu bỏ qua, level của bạn chỉ là <b>Level tạm thời {status.data?.provisionalLevel ?? ""}</b>, ước lượng từ phần <b>bạn tự khai</b> trong khảo sát (khảo sát chỉ xếp tối đa {status.data?.provisionalCap ?? "L2"}).
                Do chưa có bài đo thực tế nên level cao nhất của bạn hiện chỉ ở {status.data?.provisionalLevel ?? status.data?.provisionalCap ?? "L2"}. Bạn vẫn bắt đầu tập ngay được, và đo bằng camera sau để xác nhận
                (đo định kỳ cần có level đã đo).
              </p>
              <div className="flex gap-2">
                <Button variant="accent" size="sm" onClick={() => defer.mutate()} disabled={defer.isPending}>Tôi hiểu, đo sau</Button>
                <Button variant="outline" size="sm" onClick={() => setDeferOpen(false)}>Quay lại</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {session && !finished && step && (
        <>
          <Staircase current={step.level} />
          <p className="text-xs text-text-secondary">{reasonText(step.reason, step.level)} · lần {step.attemptNo}</p>
          <AttemptStep
            key={`${step.exerciseCode}-${step.level}-${step.attemptNo}`}
            step={step}
            submit={submitAttempt}
            recording={recording}
            onSubmitted={onSubmitted}
          />
          <div className="rounded-xl border border-border bg-surface p-3 text-xs text-text-secondary">
            {!earlyOpen ? (
              <button type="button" className="font-bold text-accent underline" onClick={() => setEarlyOpen(true)}>Không có dụng cụ cho bài này? Kết thúc sớm</button>
            ) : (
              <div className="space-y-2">
                <p>Hệ thống chốt level theo các bài bạn đã đo đủ. Level này là <b>mức tối thiểu</b> (level thực tế có thể cao hơn) và không bị hạ vì bài chưa đo. Nếu chưa đo đủ để kết luận, level tạm thời được giữ nguyên.</p>
                <div className="flex gap-2">
                  <Button variant="accent" size="sm" onClick={() => finishEarly.mutate()} disabled={finishEarly.isPending}>Kết thúc sớm</Button>
                  <Button variant="outline" size="sm" onClick={() => setEarlyOpen(false)}>Tiếp tục đo</Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {session && !finished && !step && progress && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">Chưa có bài tiếp theo. Thử tải lại trang.</p>
      )}

      {finished && progress && (
        <ResultCard progress={progress} status={status.data ?? null}
          onRetake={() => { setSession(null); setProgress(null); start.mutate(); }} retaking={start.isPending} />
      )}

      {session && recording.consent === "GRANTED" && (recording.uploadState !== "IDLE" || upload.pending) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3 text-xs">
          <Upload size={14} aria-hidden />
          {recording.uploadState === "UPLOADING" && <span>Đang tải video lên… {recording.progress}%</span>}
          {recording.uploadState === "DONE" && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={14} />Đã gửi video cho Huấn luyện viên.</span>}
          {recording.uploadState === "FAILED" && (
            <>
              <span className="text-rose-500">Chưa tải được video: {(recording.error ?? "").replace(/^[A-Z][A-Z0-9_]+:\s*/, "")}</span>
              <Button variant="outline" size="sm" onClick={upload.retry}>Thử lại</Button>
            </>
          )}
        </div>
      )}

      {session && recording.consent === "DECLINED" && progress?.l4Review === "RECORDING_CONSENT_REQUIRED" && (
        <p className="text-xs text-amber-600">Bạn đã từ chối ghi hình nên chưa thể gửi yêu cầu xác nhận Level 4 cho Huấn luyện viên.</p>
      )}

      <RecordingConsentDialog open={consentOpen} retentionDays={30} onAccept={() => answerConsent(true)} onDecline={() => answerConsent(false)} />
    </div>
  );
}

function Staircase({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Các bậc đo">
      {LEVELS.map((l) => (
        <li key={l} className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-xs font-bold ${
          l === current ? "border-accent bg-accent/10 text-accent" : l < current ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-border text-text-secondary"}`}>
          L{l}{l < current ? " ✓" : ""}
        </li>
      ))}
    </ol>
  );
}

function ResultCard({ progress, status, onRetake, retaking }: { progress: BaselineProgress; status: LevelStatus | null; onRetake: () => void; retaking: boolean }) {
  const verified = progress.outcome === "VERIFIED";
  const partial = verified && progress.reasonCode === "PARTIAL_EVIDENCE";
  const retake = status?.retake;
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Kết quả</div>
      {verified ? (
        <>
          <h2 className="font-display text-3xl font-black text-text-primary">Level {progress.finalLevel}</h2>
          <p className="flex items-start gap-2 text-sm text-text-secondary"><Info size={15} className="mt-0.5 shrink-0" />Level này đã được xác nhận bằng bài đo thực hành. Các lần đo định kỳ sau sẽ cập nhật level của bạn.</p>
        </>
      ) : (
        <>
          <h2 className="font-display text-xl font-black text-text-primary">Cần đo lại</h2>
          <p className="text-sm text-text-secondary">
            Chưa xác định được level của bạn. Level hiện tại <b>không bị hạ</b>: dữ liệu chưa đủ tin cậy không bị tính là kết quả kém.
            {progress.retestAfter ? ` Có thể đo lại từ ${fmtDate(progress.retestAfter)}.` : ""}
          </p>
        </>
      )}
      {partial && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-sm text-amber-700 dark:text-amber-300">
          Bạn đã kết thúc sớm nên {progress.finalLevel} là mức <b>tối thiểu</b> đã xác nhận, level thực tế có thể cao hơn. Hãy đo đủ các bài sau để xác nhận đầy đủ.
        </p>
      )}
      {verified && retake?.used && (
        <p className="rounded-lg border border-border bg-background p-2.5 text-sm text-text-secondary">Đây là lượt đo lại duy nhất. Level của bạn là mức <b>cao nhất</b> của hai lần đo ({retake.firstLevel} và {retake.retakeLevel}).</p>
      )}
      {verified && retake?.eligible && (
        <div className="space-y-2 rounded-lg border border-accent/30 bg-accent/10 p-2.5 text-sm text-text-primary">
          <p>Kết quả thấp hơn level tạm thời {status?.provisionalLevel}. Bạn có thể đo lại <b>1 lần</b> bất kỳ lúc nào trước <b>{fmtDate(retake.availableUntil)}</b>; hệ thống lấy level cao nhất của hai lần.</p>
          <Button variant="outline" size="sm" onClick={onRetake} disabled={retaking}>Đo lại ngay</Button>
        </div>
      )}
      {progress.l4Review === "PENDING_COACH" && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 p-2.5 text-sm text-text-primary">Bạn đủ điều kiện xét Level 4. Huấn luyện viên sẽ xem video và xác nhận.</p>
      )}
      {progress.rescreenRecommended && (
        <p className="flex flex-wrap items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>Bạn nên làm lại bảng sàng lọc an toàn trước các bài đo tiếp theo. <Link to="/safety-screening" className="font-bold underline">Sàng lọc lại</Link></span>
        </p>
      )}
      {verified && progress.competencies.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {progress.competencies.map((c) => (
            <li key={c.code} className="rounded-lg border border-border bg-background p-2">
              <div className="font-bold text-text-primary">{COMPETENCY_LABEL[c.code] ?? c.code}</div>
              <div className="text-text-secondary">{c.score == null ? "Chưa đủ dữ liệu" : `${Math.round(c.score)}/100`}</div>
            </li>
          ))}
        </ul>
      )}
      {verified && <Link to="/assessment/periodic" className="inline-block text-sm font-bold text-accent underline">Đến trang đánh giá định kỳ</Link>}
    </section>
  );
}
