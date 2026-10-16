import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Loader2, RotateCcw, ScanLine, Square, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useLivePoseTracking } from "../ai-motion/mediapipe/useLivePoseTracking";
import { AngleCalculator } from "../ai-motion/analysis/angleCalculator";
import type { FinishMotionSessionResponse } from "../motion-rules/runtimeApi";
import type { SetResult, TodayExercise } from "./api";

type Phase = "idle" | "starting" | "tracking" | "finishing" | "review";

interface Props {
  exercise: TodayExercise;
  setNumber: number;
  totalSets: number;
  /** Có khi tập trong buổi tập; thiếu khi luyện thử ở trang chi tiết bài (không ghi vào buổi tập, không tính level). */
  workoutSessionId?: number;
  /** Luyện thử: chỉ đo và hiện kết quả, không có bước ghi nhận hiệp. */
  practice?: boolean;
  /** Học viên chọn tự nhập thay vì dùng camera cho hiệp này. Không truyền thì ẩn lựa chọn này. */
  onManual?: () => void;
  onDone?: (result: SetResult) => void;
}

const FINISH_TIMEOUT_MS = 6000;

/**
 * Một hiệp tập với AI: camera đếm rep (hoặc giây giữ) theo profile chuyển động của bài, đo góc khớp chính, so với ngưỡng đỉnh/đáy
 * và hiện phản hồi form theo rule đã xuất bản. Chỉ gửi toạ độ khớp lên máy chủ, không gửi video. Kết quả đo không tin cậy
 * (thiếu dữ liệu) không bị tính là kém: học viên đo lại hoặc tự nhập.
 */
export function AiSetPanel({ exercise, setNumber, totalSets, workoutSessionId, practice = false, onManual, onDone }: Props) {
  const setLabel = practice ? "Luyện thử" : `Hiệp ${setNumber}/${totalSets}`;
  const ai = exercise.ai;
  const hold = ai.movementType === "HOLD";
  const target = hold ? exercise.holdSec ?? 15 : exercise.repMax ?? exercise.repMin ?? 10;

  const [phase, setPhase] = useState<Phase>("idle");
  const [voiceOn, setVoiceOn] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [holdMs, setHoldMs] = useState(0);
  const [angleRange, setAngleRange] = useState<{ min: number; max: number } | null>(null);
  const [summary, setSummary] = useState<FinishMotionSessionResponse | null>(null);

  // phiên Motion đóng lại trả về tóm tắt qua callback: dùng resolver để chờ kết quả (callback phải ổn định, nếu không hook sẽ dừng camera)
  const resolverRef = useRef<((s: FinishMotionSessionResponse | null) => void) | null>(null);
  const onSessionFinished = useCallback((s: FinishMotionSessionResponse) => { resolverRef.current?.(s); resolverRef.current = null; }, []);

  const tracking = useLivePoseTracking({
    trackingMode: "EXERCISE_RULES",
    exerciseCode: exercise.code,
    exerciseId: exercise.exerciseId,
    context: "TRAINING",
    workoutSessionId,
    autoVoiceWarning: voiceOn,
    onSessionFinished,
  });
  const { videoRef, canvasRef, repState, activeViolations, formScore, rawLandmarks, detectedLandmarksCount, poseConfidenceScore, isInitializing, error, fps, sessionWarnings, startTracking, stopTracking } = tracking;

  const validReps = Math.max(0, repState.repCount - repState.invalidRepCount);

  // góc đo chính của bài (cùng 3 khớp với profile) tính ở trình duyệt chỉ để hiển thị
  const angle = useMemo(() => {
    if (rawLandmarks.length < 33 || ai.metricPoints.length < 3) return null;
    const [a, b, c] = ai.metricPoints.map((i) => rawLandmarks[i]);
    if (![a, b, c].every((p) => p && (p.visibility ?? 1) >= 0.4)) return null;
    return AngleCalculator.calculateAngle(a, b, c);
  }, [rawLandmarks, ai.metricPoints]);
  const angleRef = useRef<number | null>(null);
  angleRef.current = angle;

  useEffect(() => {
    if (phase !== "tracking" || angle == null) return;
    setAngleRange((r) => (r ? { min: Math.min(r.min, angle), max: Math.max(r.max, angle) } : { min: angle, max: angle }));
  }, [angle, phase]);

  // bài giữ tĩnh: đếm giây khi góc đang nằm trong vùng chuẩn của bài
  const inZone = angle != null && ai.repBottom != null && ai.repTop != null && angle >= Math.min(ai.repBottom, ai.repTop) && angle <= Math.max(ai.repBottom, ai.repTop);
  useEffect(() => {
    if (!hold || phase !== "tracking") return;
    const t = setInterval(() => {
      const a = angleRef.current;
      if (a != null && ai.repBottom != null && ai.repTop != null && a >= Math.min(ai.repBottom, ai.repTop) && a <= Math.max(ai.repBottom, ai.repTop)) setHoldMs((m) => m + 200);
    }, 200);
    return () => clearInterval(t);
  }, [hold, phase, ai.repBottom, ai.repTop]);

  // đếm lùi 3 giây "vào tư thế" ngay sau khi camera chạy
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const reset = () => { setHoldMs(0); setAngleRange(null); setSummary(null); };

  async function begin() {
    reset();
    setPhase("starting");
    const ok = await startTracking();
    if (ok) { setPhase("tracking"); setCountdown(3); } else setPhase("idle");
  }

  const finish = useCallback(async () => {
    setPhase("finishing");
    const result = new Promise<FinishMotionSessionResponse | null>((resolve) => {
      resolverRef.current = resolve;
      setTimeout(() => { if (resolverRef.current === resolve) { resolverRef.current = null; resolve(null); } }, FINISH_TIMEOUT_MS);
    });
    stopTracking();
    const s = await result;
    if (!s) toast.error("Không nhận được kết quả đo. Bạn có thể đo lại hoặc tự nhập.");
    setSummary(s);
    setPhase("review");
  }, [stopTracking]);

  // đạt mục tiêu của hiệp thì tự kết thúc
  const reached = phase === "tracking" && countdown === 0 && (hold ? holdMs / 1000 >= target : validReps >= target);
  useEffect(() => { if (reached) void finish(); }, [reached, finish]);

  const reliable = summary?.reliability === "RELIABLE";
  const savedReps = summary ? summary.validReps : 0;
  const savedHold = summary ? Math.round(summary.holdSec) : 0;

  function save() {
    if (!summary || !onDone) return;
    onDone({
      setNumber, reps: hold ? null : savedReps, durationSeconds: hold ? savedHold : null, restSeconds: exercise.restSec,
      source: "AI", movementSessionId: Number(summary.sessionId), quality: summary.qualityScore,
    });
  }

  const running = phase === "tracking" || phase === "starting" || phase === "finishing";
  const framing = phase === "tracking" && detectedLandmarksCount < 20;
  const top = ai.repTop, bottom = ai.repBottom;

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-neutral-950 shadow-lg">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full -scale-x-100 object-cover" />

        {!running && phase !== "review" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center text-white">
            <Camera size={34} aria-hidden />
            <p className="text-lg font-black">{setLabel} · {exercise.name}</p>
            <p className="max-w-md text-sm text-white/75">
              Đặt điện thoại hoặc máy tính ở góc <b>{ai.cameraView === "FRONT" ? "chính diện" : "nhìn nghiêng"}</b>, lùi ra để camera thấy toàn thân. AI sẽ {hold ? "tính số giây bạn giữ đúng tư thế" : "đếm rep và đo biên độ góc"}.
            </p>
            {error && <p className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200"><AlertTriangle size={14} aria-hidden />{error}</p>}
            <button type="button" onClick={begin} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-black text-white shadow-md transition hover:opacity-90 active:scale-[0.98]">
              <ScanLine size={16} aria-hidden />{practice ? "Bắt đầu luyện thử" : `Bắt đầu hiệp ${setNumber}`}
            </button>
            {onManual && <button type="button" onClick={onManual} className="text-xs font-bold text-white/70 underline">Tập không dùng camera, tự nhập kết quả</button>}
          </div>
        )}

        {(isInitializing || phase === "starting") && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/70 text-white"><Loader2 className="animate-spin" aria-hidden /><span className="text-sm font-bold">Đang khởi động camera và AI...</span></div>
        )}
        {phase === "finishing" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/60 text-white"><Loader2 className="animate-spin" aria-hidden /><span className="text-sm font-bold">Đang tổng hợp kết quả hiệp...</span></div>
        )}

        {phase === "tracking" && (
          <>
            <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2 text-[11px] font-black">
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-white">{setLabel}</span>
              <span className={`rounded-full px-2.5 py-1 ${detectedLandmarksCount >= 20 ? "bg-emerald-500/80 text-white" : "bg-amber-500/90 text-black"}`}>Nhận diện {poseConfidenceScore}%</span>
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-white/80">{fps} FPS</span>
            </div>
            <button type="button" onClick={() => setVoiceOn((v) => !v)} aria-label={voiceOn ? "Tắt giọng nhắc" : "Bật giọng nhắc"} className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-white">
              {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <div className="absolute bottom-3 left-3 z-20 rounded-2xl bg-black/65 px-4 py-2 text-white backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/60">{hold ? "Giữ đúng tư thế" : "Rep hợp lệ"}</div>
              <div className="text-4xl font-black leading-none tabular-nums">{hold ? (holdMs / 1000).toFixed(1) : validReps}<span className="ml-1 text-base font-bold text-white/60">/ {target}{hold ? "s" : ""}</span></div>
            </div>
            <div className="absolute bottom-3 right-3 z-20 flex max-w-[55%] flex-col items-end gap-1.5">
              {activeViolations.slice(0, 2).map((v) => (
                <span key={v.code} className={`rounded-xl px-3 py-1.5 text-xs font-bold shadow ${v.severity === "ERROR" ? "bg-red-600 text-white" : "bg-amber-400 text-black"}`}>{v.title}</span>
              ))}
              {!hold && activeViolations.length === 0 && repState.repCount > 0 && <span className="rounded-xl bg-emerald-500/90 px-3 py-1.5 text-xs font-bold text-white">Form tốt</span>}
            </div>
            {countdown > 0 && <div className="absolute inset-0 z-20 grid place-items-center bg-black/40 text-white"><div className="text-center"><div className="text-7xl font-black tabular-nums">{countdown}</div><div className="text-sm font-bold">Vào tư thế bắt đầu</div></div></div>}
            {framing && countdown === 0 && <div className="absolute inset-x-0 top-14 z-20 mx-auto w-fit rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-black">Chưa thấy đủ cơ thể. Hãy lùi ra xa camera.</div>}
          </>
        )}

        {phase === "review" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75 p-6 text-center text-white">
            {!summary ? (
              <p className="text-sm font-bold">Không nhận được kết quả đo cho hiệp này.</p>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-white/60">{practice ? "Kết quả luyện thử" : `Kết quả hiệp ${setNumber}`}</p>
                <p className="text-5xl font-black tabular-nums">{hold ? `${savedHold}s` : `${savedReps} rep`}</p>
                <p className="text-sm text-white/80">
                  {hold ? `Giữ đúng tư thế ${savedHold} giây` : `${summary.validReps} hợp lệ trên ${summary.totalReps} lần, ${summary.invalidReps} lần sai form`} · Điểm form {summary.qualityScore}/100 · Biên độ TB {Math.round(summary.romAvg)}°
                </p>
                {Object.keys(summary.violationCounts).length > 0 && <p className="text-xs text-amber-300">Lỗi thường gặp: {Object.entries(summary.violationCounts).map(([k, n]) => `${k} (${n})`).join(", ")}</p>}
                {!reliable && <p className="flex items-center gap-1.5 text-xs font-bold text-amber-300"><AlertTriangle size={14} aria-hidden />Độ tin cậy của lần đo thấp (camera thấy chưa đủ cơ thể). {practice ? "Hãy lùi ra để camera thấy toàn thân rồi đo lại." : "Kết quả này không được ghi nhận, hãy đo lại hoặc tự nhập."}</p>}
                {practice && <p className="text-xs text-white/60">Luyện thử không ghi vào giáo án và không ảnh hưởng level hay EXP.</p>}
              </>
            )}
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {summary && reliable && onDone && !practice && <button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-white shadow active:scale-[0.98]"><CheckCircle2 size={16} aria-hidden />Ghi nhận hiệp này</button>}
              <button type="button" onClick={() => { reset(); setPhase("idle"); }} className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold text-white"><RotateCcw size={15} aria-hidden />Đo lại</button>
              {onManual && <button type="button" onClick={onManual} className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold text-white">Tự nhập kết quả</button>}
            </div>
          </div>
        )}
      </div>

      {phase === "tracking" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">{sessionWarnings.length > 0 ? sessionWarnings[0] : hold ? "Đồng hồ chỉ chạy khi góc của bạn nằm trong vùng chuẩn." : "Chỉ rep đủ biên độ và đúng form mới được tính."}</p>
          <button type="button" onClick={() => void finish()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-black text-text-primary transition hover:border-accent active:scale-[0.98]"><Square size={14} aria-hidden />Kết thúc hiệp</button>
        </div>
      )}

      <AngleComparison angle={angle} top={top} bottom={bottom} range={angleRange} movement={ai.movementType} formScore={phase === "tracking" ? formScore : null} formScoring={ai.formScoring} inZone={inZone} />
    </div>
  );
}

/** So góc đo được với ngưỡng đỉnh và đáy đã cài trong rule của bài. */
function AngleComparison({ angle, top, bottom, range, movement, formScore, formScoring, inZone }: {
  angle: number | null; top: number | null; bottom: number | null; range: { min: number; max: number } | null; movement: string | null;
  formScore: number | null; formScoring: boolean; inZone: boolean;
}) {
  if (top == null || bottom == null) return null;
  const lo = Math.min(top, bottom), hi = Math.max(top, bottom);
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / 200) * 100))}%`;
  const hold = movement === "HOLD";
  const bottomOk = range != null && range.min <= bottom + 5;
  const topOk = range != null && range.max >= top - 5;
  return (
    <section aria-label="So sánh biên độ góc" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-wide text-text-secondary">Góc đo được so với chuẩn của bài</h3>
        <span className="text-2xl font-black tabular-nums text-text-primary">{angle == null ? "--" : `${Math.round(angle)}°`}</span>
      </div>
      <div className="relative mt-3 h-3 rounded-full bg-background" role="img" aria-label={`Góc hiện tại ${angle == null ? "chưa đo được" : Math.round(angle) + " độ"}, vùng chuẩn từ ${lo} đến ${hi} độ`}>
        <div className="absolute inset-y-0 rounded-full bg-emerald-500/30" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
        {!hold && <><span className="absolute -top-1 h-5 w-0.5 bg-accent" style={{ left: pct(bottom) }} /><span className="absolute -top-1 h-5 w-0.5 bg-accent" style={{ left: pct(top) }} /></>}
        {angle != null && <span className={`absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 rounded-full ${inZone || !hold ? "bg-text-primary" : "bg-amber-500"}`} style={{ left: pct(angle) }} />}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-bold text-text-secondary"><span>0°</span><span>100°</span><span>200°</span></div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-[11px] text-text-secondary">{hold ? "Vùng chuẩn" : "Góc đáy chuẩn"}</dt><dd className="font-black text-text-primary">{hold ? `${lo}° - ${hi}°` : `${bottom}°`}</dd></div>
        {!hold && <div><dt className="text-[11px] text-text-secondary">Góc đỉnh chuẩn</dt><dd className="font-black text-text-primary">{top}°</dd></div>}
        {!hold && <div><dt className="text-[11px] text-text-secondary">Đáy đạt được</dt><dd className={`font-black ${range == null ? "text-text-secondary" : bottomOk ? "text-emerald-500" : "text-amber-500"}`}>{range ? `${Math.round(range.min)}°${bottomOk ? " đủ sâu" : " chưa đủ sâu"}` : "--"}</dd></div>}
        {!hold && <div><dt className="text-[11px] text-text-secondary">Đỉnh đạt được</dt><dd className={`font-black ${range == null ? "text-text-secondary" : topOk ? "text-emerald-500" : "text-amber-500"}`}>{range ? `${Math.round(range.max)}°${topOk ? " duỗi đủ" : " chưa duỗi đủ"}` : "--"}</dd></div>}
        {hold && <div><dt className="text-[11px] text-text-secondary">Trạng thái</dt><dd className={`font-black ${inZone ? "text-emerald-500" : "text-amber-500"}`}>{angle == null ? "Chưa đo được" : inZone ? "Đúng tư thế" : "Lệch tư thế"}</dd></div>}
        {formScore != null && formScoring && <div><dt className="text-[11px] text-text-secondary">Điểm form (rep gần nhất)</dt><dd className="font-black text-text-primary">{formScore}/100</dd></div>}
      </dl>
    </section>
  );
}
