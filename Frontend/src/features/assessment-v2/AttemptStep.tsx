import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Camera, HeartPulse, Loader2, Square, Timer, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { useLivePoseTracking } from "../ai-motion/mediapipe/useLivePoseTracking";
import type { FinishMotionSessionResponse } from "../motion-rules/runtimeApi";
import { AngleAttemptStep } from "./AngleAttemptStep";
import { isAngleTest } from "./angleMeasurement";
import type { StepProps } from "./stepTypes";
import { apiMessage, periodicApi, type SubmitAttempt } from "./api";

const METRIC_HINT: Record<string, string> = {
  VALID_REPS: "Làm càng nhiều lần đúng kỹ thuật càng tốt. Chỉ các lần đúng form mới được tính.",
  HOLD_SEC: "Giữ tư thế càng lâu càng tốt trong khi vẫn đúng form. Hệ thống tự tính thời gian giữ.",
  ANGLE_DEG: "Bài đo độ linh hoạt.",
};

/** Chọn cách đo theo loại bài: góc linh hoạt (ANGLE_DEG) đo bằng khung xương ở frontend; đếm rep/giữ tư thế do Motion Rule Engine chấm. */
export function AttemptStep<P>(props: StepProps<P>) {
  const metric = props.metric ?? props.step.metric;
  return metric === "ANGLE_DEG" && isAngleTest(props.step.exerciseCode) ? <AngleAttemptStep {...props} /> : <RepHoldAttemptStep {...props} />;
}

/** Một bài đo: bật camera + phiên chấm Motion Rule Engine, (nếu đã đồng ý) ghi hình, bấm kết thúc thì nộp attempt. */
function RepHoldAttemptStep<P>({ step, metric: metricProp, submit, recording, onSubmitted }: StepProps<P>) {
  const exercises = useQuery({ queryKey: ["exercises-raw"], queryFn: periodicApi.exercises, staleTime: 5 * 60_000 });
  const exercise = exercises.data?.find((e) => e.code === step.exerciseCode);

  const startedAtRef = useRef<Date | null>(null);
  const abortRef = useRef<"PAIN" | null>(null);
  const [phase, setPhase] = useState<"READY" | "MEASURING" | "SUBMITTING">("READY");
  const [rest, setRest] = useState(step.restRemainingSec);

  useEffect(() => {
    if (rest <= 0) return;
    const t = setTimeout(() => setRest((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const metric = metricProp ?? step.metric ?? "VALID_REPS";

  const handleFinished = useCallback(async (s: FinishMotionSessionResponse) => {
    const startedAt = startedAtRef.current ?? new Date();
    const req: SubmitAttempt = {
      exerciseCode: step.exerciseCode,
      movementSessionId: Number(s.sessionId),
      startedAt: startedAt.toISOString(),
      endedAt: new Date().toISOString(),
      totalReps: s.totalReps,
      validReps: s.validReps,
      holdSec: s.holdSec,
      formScore: s.qualityScore,
      romScore: s.romAvg,
      majorViolations: s.criticalCount,
      poseConfidenceAvg: s.poseConfidenceAvg,
      visibilityAvg: s.visibilityAvg,
      trackedRatio: s.trackedRatio,
      ...(abortRef.current ? { userAborted: true, abortReason: abortRef.current } : {}),
    };
    try {
      onSubmitted(await submit(req));
    } catch (e) {
      toast.error(apiMessage(e, "Không lưu được kết quả bài đo"));
      setPhase("READY");
    }
  }, [submit, step.exerciseCode, onSubmitted]);

  // onSessionFinished phải ổn định: hook dừng camera khi identity của nó đổi
  const handlerRef = useRef(handleFinished);
  handlerRef.current = handleFinished;
  const stableFinished = useCallback((s: FinishMotionSessionResponse) => { void handlerRef.current(s); }, []);

  const tracking = useLivePoseTracking({
    trackingMode: "EXERCISE_RULES",
    exerciseId: exercise?.id,
    exerciseCode: step.exerciseCode,
    // TRAINING: context ASSESSMENT của Motion Runtime ghi kết quả vào bảng test v1; V2 tự lưu attempt qua API riêng
    context: "TRAINING",
    onSessionFinished: stableFinished,
  });

  async function begin() {
    abortRef.current = null;
    startedAtRef.current = new Date();
    setPhase("MEASURING");
    const started = await tracking.startTracking();
    if (!started) { setPhase("READY"); return; }
    if (recording.consent === "GRANTED") recording.start();
  }

  async function end(pain = false) {
    if (pain) abortRef.current = "PAIN";
    setPhase("SUBMITTING");
    await recording.finish();
    tracking.stopTracking();
  }

  const noRule = exercises.isSuccess && !exercise;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Bài đo · lần {step.attemptNo}</div>
          <h3 className="font-display text-lg font-black text-text-primary">{exercise?.name ?? step.exerciseCode}</h3>
          <p className="mt-0.5 text-xs text-text-secondary">{METRIC_HINT[metric]}</p>
        </div>
        {recording.recording && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />Đang ghi hình
          </span>
        )}
      </div>

      {noRule ? (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />Không tìm thấy bài tập {step.exerciseCode} trong thư viện nên chưa đo được.
        </p>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
            <video ref={tracking.videoRef} className="h-full w-full -scale-x-100 object-contain" playsInline muted />
            <canvas ref={tracking.canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />
            {!tracking.isCameraRunning && (
              <div className="absolute inset-0 grid place-items-center text-xs text-white/70">
                {tracking.isInitializing ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2"><Camera size={16} />Camera chưa bật</span>}
              </div>
            )}
            {phase === "MEASURING" && (
              <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 font-mono text-sm font-bold text-white">
                {metric === "HOLD_SEC" ? "Đang giữ…" : `Rep đúng: ${tracking.repState.repCount - tracking.repState.invalidRepCount}`}
              </div>
            )}
          </div>

          {tracking.activeViolations.length > 0 && phase === "MEASURING" && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-300">{tracking.activeViolations[0].title}</p>
          )}
          {tracking.error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500">{tracking.error}</p>}
          {recording.consent === "GRANTED" && recording.error && <p className="text-xs text-amber-600">{recording.error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {phase === "READY" && (
              <Button variant="accent" size="sm" onClick={begin} disabled={rest > 0 || !exercise || exercises.isLoading}>
                {rest > 0 ? <><Timer size={14} aria-hidden />Nghỉ thêm {rest}s</> : <><Video size={14} aria-hidden />Bắt đầu đo</>}
              </Button>
            )}
            {phase === "MEASURING" && (
              <>
                <Button variant="accent" size="sm" onClick={() => end(false)}><Square size={14} aria-hidden />Kết thúc bài</Button>
                <Button variant="outline" size="sm" onClick={() => end(true)}><HeartPulse size={14} aria-hidden />Dừng vì đau / khó chịu</Button>
              </>
            )}
            {phase === "SUBMITTING" && <span className="inline-flex items-center gap-2 text-xs text-text-secondary"><Loader2 size={14} className="animate-spin" />Đang lưu kết quả…</span>}
          </div>
        </>
      )}
    </div>
  );
}
