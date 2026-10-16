import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ClipboardCheck, History, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { AttemptStep } from "../../features/assessment-v2/AttemptStep";
import {
  apiMessage,
  periodicApi,
  type LevelState,
  type PeriodicProgress,
  type StartPeriodic,
  type SubmitAttempt,
} from "../../features/assessment-v2/api";
import { parseApiError } from "../../features/safety-screening/api";
import { RecordingConsentDialog } from "../../features/assessment-recording/RecordingConsentDialog";
import { useAttemptRecording } from "../../features/assessment-recording/useAttemptRecording";
import { useUploadAfterSubmit } from "../../features/assessment-recording/useUploadAfterSubmit";

/** Backend trả "CODE: nội dung" - chỉ hiển thị nội dung cho người dùng. */
const clean = (m: string) => m.replace(/^[A-Z][A-Z0-9_]+:\s*/, "");

const STATUS_LABEL: Record<string, string> = { PROVISIONAL: "Tạm thời", VERIFIED: "Đã xác minh", RETURNING: "Đang quay lại tập" };
const DECISION_LABEL: Record<string, string> = { PROMOTED: "Lên level", MAINTAINED: "Giữ level", REGRESSED: "Hạ level" };
const OUTCOME_LABEL: Record<string, string> = {
  DECIDED: "Đã xét level",
  RETEST_REQUIRED: "Cần đo lại",
  INSUFFICIENT_EVIDENCE: "Chưa đủ dữ liệu để xét level",
};
const GATE_LABEL: Record<string, string> = {
  COMPETENCY: "Năng lực", STABILITY: "Độ ổn định", SAFETY: "An toàn", RELIABILITY: "Độ tin cậy", PROGRESSION: "Tiến trình",
  PERFORMANCE: "Thành tích", QUALITY: "Chất lượng", SKILL: "Kỹ năng", ATTENDANCE: "Chuyên cần",
};

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "–");

export default function PeriodicAssessmentPage() {
  const qc = useQueryClient();
  const level = useQuery({ queryKey: ["v2-level"], queryFn: periodicApi.level, retry: false });
  const review = useQuery({ queryKey: ["v2-l4-review"], queryFn: periodicApi.l4Review, retry: false, enabled: level.isSuccess });

  const [session, setSession] = useState<StartPeriodic | null>(null);
  const [progress, setProgress] = useState<PeriodicProgress | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  // Chặn do an toàn: dẫn người dùng sang trang sàng lọc thay vì chỉ báo lỗi
  const [safetyBlock, setSafetyBlock] = useState<string | null>(null);

  const recording = useAttemptRecording("periodic", session?.sessionId ?? null);
  const upload = useUploadAfterSubmit(recording);

  const start = useMutation({
    mutationFn: periodicApi.start,
    onSuccess: (s) => {
      setSession(s);
      setProgress(null);
      upload.reset();
      // Chỉ phiên hướng tới L4 mới cần video để Coach xác nhận
      if (s.targetLevel === "L4") setConsentOpen(true);
    },
    onError: (e) => {
      const { code, message } = parseApiError(e, "Không bắt đầu được bài đo");
      if (code === "SAFETY_SCREENING_REQUIRED" || code === "ACKNOWLEDGEMENT_REQUIRED" || code === "ASSESSMENT_PARTICIPATION_RESTRICTED") setSafetyBlock(message);
      else toast.error(message);
    },
  });

  const onSubmitted = useCallback((p: PeriodicProgress) => {
    setProgress(p);
    upload.noteSubmitted(p.lastAttempt?.attemptId ?? null, p.outcome === "IN_PROGRESS" || p.l4Review === "PENDING_COACH");
    if (p.lastAttempt?.measurementStatus === "INVALID_MEASUREMENT") toast.warning("Lần đo này chưa đủ tin cậy nên không được tính. Hãy bố trí camera thấy rõ toàn thân và đo lại.");
    if (p.outcome !== "IN_PROGRESS") {
      void qc.invalidateQueries({ queryKey: ["v2-level"] });
      void qc.invalidateQueries({ queryKey: ["v2-l4-review"] });
    }
  }, [qc, upload.noteSubmitted]);

  async function answerConsent(granted: boolean) {
    const ok = await recording.answerConsent(granted);
    if (ok) setConsentOpen(false);
    else toast.error("Không lưu được lựa chọn ghi hình. Thử lại.");
  }

  const submitAttempt = useMemo(() => (req: SubmitAttempt) => periodicApi.submit(session!.sessionId, req), [session]);
  const finished = progress && progress.outcome !== "IN_PROGRESS";
  const step = progress?.next ?? session?.next ?? null;
  const tests = progress?.tests ?? session?.tests ?? [];

  if (level.isLoading) return <div className="grid place-items-center p-16"><Loader2 className="animate-spin text-text-secondary" /></div>;

  const featureOff = level.isError;
  const noBaseline = level.isSuccess && level.data === null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-6">
      <header>
        <h1 className="font-display text-2xl font-black text-text-primary">Đánh giá định kỳ</h1>
        <p className="mt-1 text-sm text-text-secondary">Đo lại thể lực bằng camera để xét level mới và cập nhật lộ trình tập.</p>
      </header>

      {featureOff && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />Tính năng đánh giá định kỳ chưa được bật. Bạn vẫn có thể dùng <Link to="/roadmap" className="underline">trang Lộ trình</Link>.
        </p>
      )}
      {noBaseline && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
          Bạn chưa có level đã xác minh. Hãy hoàn tất bài đánh giá ban đầu (Baseline) trước khi đo định kỳ.
        </p>
      )}

      {level.data && <LevelOverview level={level.data} reviewStatus={review.data?.status ?? null} />}

      {safetyBlock && (
        <p className="flex flex-wrap items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{safetyBlock}. <Link to="/safety-screening" className="font-bold underline">Mở trang sàng lọc an toàn</Link></span>
        </p>
      )}

      {level.data && !session && (
        <div className="space-y-2">
          {level.data.periodicGate === "CYCLE_IN_PROGRESS" && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Bài đánh giá định kỳ mở khi bạn hoàn thành chu kỳ tập hiện tại ({level.data.cycleSessionsDone ?? 0}/{level.data.cycleSessionsPlanned ?? 0} buổi
                {level.data.cycleEnd ? `, kết thúc ${fmtDate(level.data.cycleEnd)}` : ""}).
              </span>
            </p>
          )}
          <Button variant="accent" onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ClipboardCheck size={15} aria-hidden />}Bắt đầu đo định kỳ
          </Button>
          <p className="text-xs text-text-secondary">Bài ở level cao hơn mà bạn chưa tập đủ buổi sẽ được bỏ qua. Việc này chỉ làm thiếu dữ liệu để lên level, không bị tính là trượt.</p>
          {level.data.nextAssessmentEarliest && new Date(level.data.nextAssessmentEarliest) > new Date() && (
            <p className="text-xs text-text-secondary">Lần đo hợp lệ gần nhất chưa đủ thời gian; sớm nhất {fmtDate(level.data.nextAssessmentEarliest)}.</p>
          )}
        </div>
      )}

      {session && !finished && step && (
        <>
          <p className="text-xs text-text-secondary">
            Level hiện tại <b className="text-text-primary">{session.currentLevel}</b> · đang kiểm tra khả năng lên <b className="text-text-primary">{session.targetLevel}</b>.
            Đặt camera thấy rõ toàn thân, mặc đồ gọn, không gian đủ rộng.
          </p>
          <TestChecklist tests={tests} current={step.exerciseCode} />
          <AttemptStep
            key={`${step.exerciseCode}-${step.attemptNo}`}
            step={step}
            metric={tests.find((t) => t.exerciseCode === step.exerciseCode)?.metric}
            submit={submitAttempt}
            recording={recording}
            onSubmitted={onSubmitted}
          />
        </>
      )}

      {session && !finished && !step && progress && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">Không còn bài nào để đo ở bước này. Thử tải lại trang.</p>
      )}

      {finished && progress && <ResultCard progress={progress} />}

      {session && recording.consent === "GRANTED" && (recording.uploadState !== "IDLE" || upload.pending) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3 text-xs">
          <Upload size={14} aria-hidden />
          {recording.uploadState === "UPLOADING" && <span>Đang tải video lên… {recording.progress}%</span>}
          {recording.uploadState === "DONE" && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={14} />Đã gửi video cho Huấn luyện viên.</span>}
          {recording.uploadState === "FAILED" && (
            <>
              <span className="text-rose-500">Chưa tải được video: {clean(recording.error ?? "")}</span>
              <Button variant="outline" size="sm" onClick={upload.retry}>Thử lại</Button>
            </>
          )}
        </div>
      )}

      {session && recording.consent === "DECLINED" && progress?.l4Review === "RECORDING_CONSENT_REQUIRED" && (
        <p className="text-xs text-amber-600">Bạn đã từ chối ghi hình nên chưa thể gửi yêu cầu xác nhận Level 4 cho Huấn luyện viên.</p>
      )}

      <RecordingConsentDialog
        open={consentOpen}
        retentionDays={30}
        onAccept={() => answerConsent(true)}
        onDecline={() => answerConsent(false)}
      />
    </div>
  );
}

function LevelOverview({ level, reviewStatus }: { level: LevelState; reviewStatus: string | null }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Level hiện tại</div>
          <div className="font-display text-3xl font-black text-text-primary">{level.levelCode}</div>
        </div>
        <div className="text-right text-xs text-text-secondary">
          <div className="font-bold text-text-primary">{STATUS_LABEL[level.status] ?? level.status}</div>
          <div>Đo gần nhất: {fmtDate(level.lastAssessedAt)}</div>
        </div>
      </div>
      {reviewStatus === "PENDING" && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 p-2.5 text-xs text-text-primary">Yêu cầu lên Level 4 của bạn đang chờ Huấn luyện viên xác nhận.</p>
      )}
      {reviewStatus === "REJECTED" && <p className="rounded-lg border border-border p-2.5 text-xs text-text-secondary">Lần xác nhận Level 4 gần nhất chưa được chấp thuận. Bạn có thể đo lại sau.</p>}
      {level.history.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary"><History size={13} />Lịch sử</div>
          <ol className="space-y-1.5 border-l border-border pl-3 text-xs">
            {level.history.slice(0, 6).map((h, i) => (
              <li key={i}>
                <b className="text-text-primary">{h.decision ? DECISION_LABEL[h.decision] ?? h.decision : OUTCOME_LABEL[h.outcome] ?? h.outcome}</b>
                {h.levelBefore && h.levelAfter ? ` · ${h.levelBefore} → ${h.levelAfter}` : ""}
                <span className="ml-2 text-text-secondary">{fmtDate(h.at)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function TestChecklist({ tests, current }: { tests: PeriodicProgress["tests"]; current: string }) {
  if (tests.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5 text-[11px]">
      {tests.map((t) => (
        <li key={t.exerciseCode} className={`rounded-full border px-2.5 py-1 font-semibold ${
          t.status === "VALID" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            : t.exerciseCode === current ? "border-accent bg-accent/10 text-accent"
            : t.status === "INVALID_MEASUREMENT" ? "border-amber-500/30 text-amber-600"
            : "border-border text-text-secondary"}`}>
          {t.exerciseCode}{t.status === "VALID" ? " ✓" : ""}
        </li>
      ))}
    </ul>
  );
}

function ResultCard({ progress }: { progress: PeriodicProgress }) {
  const decided = progress.outcome === "DECIDED";
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Kết quả</div>
      <h2 className="font-display text-xl font-black text-text-primary">
        {decided ? `${DECISION_LABEL[progress.decision ?? ""] ?? progress.decision} · ${progress.levelBefore} → ${progress.levelAfter}` : OUTCOME_LABEL[progress.outcome] ?? progress.outcome}
      </h2>
      {!decided && (
        <p className="text-sm text-text-secondary">
          Level của bạn được <b>giữ nguyên</b>. Dữ liệu chưa đủ tin cậy không bị tính là kết quả kém.
          {progress.retestAfter ? ` Có thể đo lại từ ${fmtDate(progress.retestAfter)}.` : ""}
        </p>
      )}
      {progress.l4Review === "PENDING_COACH" && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 p-2.5 text-sm text-text-primary">Bạn đủ điều kiện xét Level 4. Huấn luyện viên sẽ xem video và xác nhận.</p>
      )}
      {progress.rescreenRecommended && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-sm text-amber-600 dark:text-amber-300">Bạn nên làm lại bảng sàng lọc sức khỏe trước các bài đo tiếp theo.</p>
      )}
      {progress.blockedGates && Object.keys(progress.blockedGates).length > 0 && (
        <div className="text-xs text-text-secondary">
          Chưa đạt để lên level: {Object.keys(progress.blockedGates).map((g) => GATE_LABEL[g.toUpperCase()] ?? g).join(", ")}.
        </div>
      )}
      {progress.reasonCode === "PROMOTED_WITH_ATTENDANCE_BONUS" && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-sm text-text-primary">
          Điểm tổng của bạn sát ngưỡng và bạn tập đều đặn, nên điểm cộng chuyên cần giúp bạn lên level. Mọi cổng về thành tích, chất lượng và ổn định vẫn do bạn tự đạt.
        </p>
      )}
      {progress.competencies.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {progress.competencies.map((c) => (
            <li key={c.code} className="rounded-lg border border-border bg-background p-2">
              <div className="font-bold text-text-primary">{c.code}</div>
              <div className="text-text-secondary">{c.score == null ? "Chưa đủ dữ liệu" : `${Math.round(c.score)}/100`}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
