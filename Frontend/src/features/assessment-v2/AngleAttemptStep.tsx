import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Camera, HeartPulse, Loader2, Square, Timer, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { useLivePoseTracking } from "../ai-motion/mediapipe/useLivePoseTracking";
import { motionRuntimeApi } from "../motion-rules/runtimeApi";
import { AngleTracker, ANGLE_TESTS, isAngleTest, type AngleTestCode } from "./angleMeasurement";
import { apiMessage, periodicApi, type SubmitAttempt } from "./api";
import type { StepProps } from "./stepTypes";

const MAX_MEASURE_SECONDS = 20;

/**
 * Bài đo độ linh hoạt (ANGLE_DEG): góc được tính ở frontend từ khung xương (angleMeasurement.ts), không qua Motion Rule Engine.
 * Backend vẫn cần một `movementSessionId` duy nhất cho mỗi attempt (bảo đảm các lần đo độc lập), nên mở rồi đóng ngay một phiên Motion
 * (context TRAINING) chỉ để lấy id, không gửi khung hình nào.
 */
export function AngleAttemptStep<P>({ step, submit, recording, onSubmitted }: StepProps<P>) {
  const code = step.exerciseCode as AngleTestCode;
  const spec = isAngleTest(code) ? ANGLE_TESTS[code] : null;
  const exercises = useQuery({ queryKey: ["exercises-raw"], queryFn: periodicApi.exercises, staleTime: 5 * 60_000 });
  const exercise = exercises.data?.find((e) => e.code === step.exerciseCode);

  const trackerRef = useRef<AngleTracker | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const abortRef = useRef<"PAIN" | null>(null);
  const endingRef = useRef(false);
  const [phase, setPhase] = useState<"READY" | "STARTING" | "MEASURING" | "SUBMITTING">("READY");
  const [rest, setRest] = useState(step.restRemainingSec);
  const [live, setLive] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (rest <= 0) return;
    const t = setTimeout(() => setRest((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const tracking = useLivePoseTracking({ trackingMode: "UNIVERSAL_POSE_TEST", exerciseCode: step.exerciseCode, autoVoiceWarning: false });

  // mỗi khung xương mới đưa vào bộ đo góc khi đang đo
  const { rawLandmarks } = tracking;
  useEffect(() => {
    if (phase !== "MEASURING" || !trackerRef.current) return;
    trackerRef.current.addFrame(rawLandmarks.length >= 33 ? rawLandmarks : null);
    setLive(trackerRef.current.live());
  }, [rawLandmarks, phase]);

  const end = useCallback(async (pain = false) => {
    if (endingRef.current || !trackerRef.current) return;
    endingRef.current = true;
    if (pain) abortRef.current = "PAIN";
    setPhase("SUBMITTING");
    const result = trackerRef.current.result();
    await recording.finish();
    tracking.stopTracking();
    try {
      if (!exercise) throw new Error("Không tìm thấy bài tập trong thư viện");
      const session = await motionRuntimeApi.start({ exerciseId: exercise.id, context: "TRAINING" });
      await motionRuntimeApi.finish(session.sessionId);   // chỉ để có id duy nhất; không có khung nào được gửi
      const req: SubmitAttempt = {
        exerciseCode: step.exerciseCode,
        movementSessionId: Number(session.sessionId),
        startedAt: (startedAtRef.current ?? new Date()).toISOString(),
        endedAt: new Date().toISOString(),
        angleDeg: result.angleDeg ?? undefined,
        poseConfidenceAvg: result.poseConfidenceAvg,
        visibilityAvg: result.visibilityAvg,
        trackedRatio: result.trackedRatio,
        ...(abortRef.current ? { userAborted: true, abortReason: abortRef.current } : {}),
      };
      onSubmitted(await submit(req));
    } catch (e) {
      toast.error(apiMessage(e, "Không lưu được kết quả bài đo"));
      endingRef.current = false;
      setPhase("READY");
    }
  }, [exercise, recording, tracking, step.exerciseCode, submit, onSubmitted]);

  // tự kết thúc khi đủ thời gian đo tối đa. end đổi identity mỗi lần render nên giữ qua ref, tránh reset bộ đếm theo từng khung hình
  const endRef = useRef(end);
  endRef.current = end;
  useEffect(() => {
    if (phase !== "MEASURING") return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      setElapsed(s);
      if (s >= MAX_MEASURE_SECONDS) void endRef.current(false);
    }, 500);
    return () => clearInterval(id);
  }, [phase]);

  async function begin() {
    if (!spec) return;
    abortRef.current = null;
    endingRef.current = false;
    startedAtRef.current = new Date();
    setLive(null);
    setElapsed(0);
    setPhase("STARTING");
    const started = await tracking.startTracking();
    if (!started) { setPhase("READY"); return; }
    // toạ độ x chuẩn hoá theo chiều rộng: phải nhân với tỉ lệ khung hình của video thì góc mới đúng
    const v = tracking.videoRef.current;
    const ar = v && v.videoHeight > 0 ? v.videoWidth / v.videoHeight : 16 / 9;
    trackerRef.current = new AngleTracker(code, 0.5, ar);
    setPhase("MEASURING");
    if (recording.consent === "GRANTED") recording.start();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Bài đo độ linh hoạt · lần {step.attemptNo}</div>
          <h3 className="font-display text-lg font-black text-text-primary">{exercise?.name ?? step.exerciseCode}</h3>
          <p className="mt-0.5 text-xs text-text-secondary">{spec?.instruction}</p>
        </div>
        {recording.recording && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />Đang ghi hình
          </span>
        )}
      </div>

      {!spec ? (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />Bài đo này chưa được hỗ trợ đo bằng camera.
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
                Góc hiện tại: {live === null ? "chưa thấy" : `${Math.round(live)}°`} · {Math.max(0, MAX_MEASURE_SECONDS - elapsed)}s
              </div>
            )}
          </div>
          {tracking.error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500">{tracking.error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            {phase === "READY" && (
              <Button variant="accent" size="sm" onClick={begin} disabled={rest > 0 || !exercise || exercises.isLoading}>
                {rest > 0 ? <><Timer size={14} aria-hidden />Nghỉ thêm {rest}s</> : <><Video size={14} aria-hidden />Bắt đầu đo</>}
              </Button>
            )}
            {phase === "MEASURING" && (
              <>
                <Button variant="accent" size="sm" onClick={() => void end(false)}><Square size={14} aria-hidden />Kết thúc bài</Button>
                <Button variant="outline" size="sm" onClick={() => void end(true)}><HeartPulse size={14} aria-hidden />Dừng vì đau / khó chịu</Button>
              </>
            )}
            {phase === "STARTING" && <span className="inline-flex items-center gap-2 text-xs text-text-secondary"><Loader2 size={14} className="animate-spin" />Đang bật camera…</span>}
            {phase === "SUBMITTING" && <span className="inline-flex items-center gap-2 text-xs text-text-secondary"><Loader2 size={14} className="animate-spin" />Đang lưu kết quả…</span>}
          </div>
        </>
      )}
    </div>
  );
}
