import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Bot, CheckCircle2, ChevronRight, Clock, Dumbbell, Flag, Hand, Loader2, PlayCircle, SkipForward, Trophy } from "lucide-react";
import { RestTimer } from "../../components/workout/RestTimer";
import { RecommendedBadge } from "../plan-choice/RecommendedBadge";
import { errorMessage } from "../plan-choice/api";
import { AiSetPanel } from "./AiSetPanel";
import { ExerciseMedia } from "./ExerciseMedia";
import { ManualSetPanel } from "./ManualSetPanel";
import { SECTION_LABELS, prescriptionLabel, useFinishSession, useStartSession, useTodayWorkout, type FinishResult, type SetResult, type TodayExercise, type TodayWorkout } from "./api";

type Mode = "AI" | "MANUAL";

const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function AiChip({ e }: { e: TodayExercise }) {
  return e.ai.ready
    ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-500"><Bot size={10} aria-hidden />{e.ai.formScoring ? "AI đếm rep + chấm form" : "AI đếm rep"}</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-black text-text-secondary"><Hand size={10} aria-hidden />Tự nhập</span>;
}

/**
 * Trang luyện tập. Bài trong buổi tập lấy từ giáo án học viên đang tập (số hiệp, số lần, thời gian nghỉ do Coach đặt).
 * Mỗi bài tập được với AI (camera đếm rep, đo biên độ góc theo rule của bài) hoặc tự nhập. Buổi tập chỉ được ghi nhận khi kết thúc.
 */
export default function AiTrainingPage() {
  const today = useTodayWorkout();
  if (today.isLoading) return <div className="mx-auto max-w-5xl p-6 text-sm text-text-secondary">Đang tải buổi tập...</div>;
  if (today.isError || !today.data) return <div className="mx-auto max-w-5xl p-6 text-sm text-text-secondary">Không tải được buổi tập. Vui lòng thử lại.</div>;
  return <Session data={today.data} />;
}

function Gate({ title, text, to, cta }: { title: string; text: string; to: string; cta: string }) {
  return (
    <div className="mx-auto max-w-xl p-6 sm:p-10">
      <div className="rounded-3xl border border-border bg-surface p-8 text-center">
        <Dumbbell className="mx-auto text-accent" size={30} aria-hidden />
        <h1 className="mt-3 font-display text-2xl font-black text-text-primary">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{text}</p>
        <Link to={to} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-black text-white shadow-md hover:opacity-90">{cta}<ChevronRight size={16} aria-hidden /></Link>
      </div>
    </div>
  );
}

function Session({ data }: { data: TodayWorkout }) {
  const startMutation = useStartSession();
  const finishMutation = useFinishSession();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, SetResult[]>>({});
  const [mode, setMode] = useState<Mode>("AI");
  const [resting, setResting] = useState<number | null>(null);
  const [wrap, setWrap] = useState(false);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<FinishResult | null>(null);
  const [pendingNext, setPendingNext] = useState<number | null>(null);

  useEffect(() => {
    if (startedAt == null || outcome) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt, outcome]);

  const exercises = data.exercises;
  const current = exercises[index];
  const doneSets = (e: TodayExercise) => results[e.exerciseId]?.length ?? 0;
  const totalPlanned = useMemo(() => exercises.reduce((n, e) => n + e.sets, 0), [exercises]);
  const totalDone = exercises.reduce((n, e) => n + Math.min(doneSets(e), e.sets), 0);
  const grouped = useMemo(() => {
    const order = ["WARMUP", "MAIN", "ACCESSORY", "COOLDOWN"];
    const map = new Map<string, TodayExercise[]>();
    exercises.forEach((e) => map.set(e.section, [...(map.get(e.section) ?? []), e]));
    return [...map.entries()].sort((a, b) => (order.indexOf(a[0]) + 99) % 99 - (order.indexOf(b[0]) + 99) % 99);
  }, [exercises]);

  if (data.state !== "READY") {
    return data.state === "CYCLE_DONE"
      ? <Gate title="Bạn đã tập hết các buổi của chu kỳ" text={data.message ?? ""} to="/assessment/periodic" cta="Làm đánh giá định kỳ" />
      : <Gate title="Chưa có giáo án để tập" text={data.message ?? "Hãy chọn cách tập của bạn."} to="/plan-choice" cta="Chọn cách tập" />;
  }

  function selectExercise(i: number) {
    setIndex(i);
    setResting(null);
    setMode(exercises[i].ai.ready ? "AI" : "MANUAL");
  }

  function start() {
    if (data.planId == null || data.dayId == null) return;
    startMutation.mutate({ planId: data.planId, dayId: data.dayId }, {
      onSuccess: (r) => { setSessionId(r.sessionId); setStartedAt(Date.now()); selectExercise(0); },
      onError: (e) => toast.error(errorMessage(e, "Không bắt đầu được buổi tập. Thử lại sau.")),
    });
  }

  /** Bài kế tiếp chưa xong: ưu tiên các bài phía sau, nếu hết thì quay lại bài đã bỏ qua phía trước. */
  function nextIncomplete(done: (x: TodayExercise) => number): number {
    const after = exercises.findIndex((x, i) => i > index && done(x) < x.sets);
    return after !== -1 ? after : exercises.findIndex((x, i) => i !== index && done(x) < x.sets);
  }

  function recordSet(r: SetResult) {
    const e = current;
    const next = [...(results[e.exerciseId] ?? []), r];
    setResults({ ...results, [e.exerciseId]: next });
    if (next.length < e.sets) { setResting(e.restSec ?? 60); setPendingNext(null); return; }
    const nextIdx = nextIncomplete((x) => (x.exerciseId === e.exerciseId ? next.length : doneSets(x)));
    if (nextIdx === -1) { setWrap(true); return; }
    toast.success(`Xong bài ${e.name}`);
    setResting(e.restSec ?? 30);
    setPendingNext(nextIdx);
  }

  function afterRest() {
    setResting(null);
    if (pendingNext != null && pendingNext >= 0) selectExercise(pendingNext);
    setPendingNext(null);
  }

  function skipExercise() {
    const nextIdx = nextIncomplete(doneSets);
    if (nextIdx === -1) { setWrap(true); return; }
    selectExercise(nextIdx);
  }

  function submit(status: "COMPLETED" | "ABANDONED") {
    if (sessionId == null) return;
    finishMutation.mutate({
      sessionId,
      payload: {
        status, durationSeconds: elapsed, difficultyRating: difficulty,
        exercises: exercises.filter((e) => doneSets(e) > 0).map((e) => ({
          exerciseId: e.exerciseId, plannedSets: e.sets,
          sets: results[e.exerciseId].map(({ quality: _q, ...rest }) => rest),
        })),
      },
    }, {
      onSuccess: (r) => setOutcome(r),
      onError: (e) => toast.error(errorMessage(e, "Không lưu được buổi tập. Thử lại sau.")),
    });
  }

  // ---------------------------------------------------------------- màn kết quả
  if (outcome) {
    const ok = outcome.status === "COMPLETED";
    return (
      <div className="mx-auto max-w-xl space-y-5 p-6 text-center sm:p-10">
        <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full border-2 ${ok ? "border-emerald-500 bg-emerald-500/15 text-emerald-500" : "border-amber-500 bg-amber-500/15 text-amber-500"}`}><Trophy size={36} aria-hidden /></div>
        <h1 className="font-display text-3xl font-black text-text-primary">{ok ? "Hoàn thành buổi tập!" : "Buổi tập chưa được tính"}</h1>
        <p className="text-sm text-text-secondary">
          {ok ? "Buổi tập đã được ghi nhận vào chu kỳ của bạn." : `Bạn mới làm ${Math.round(outcome.completionRatio * 100)}% số hiệp. Cần ít nhất 60% để buổi tập được tính vào chu kỳ.`}
        </p>
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-surface p-4">
          <div><div className="text-xs text-text-secondary">Thời gian</div><div className="text-lg font-black text-text-primary">{Math.max(1, Math.round(elapsed / 60))} phút</div></div>
          <div><div className="text-xs text-text-secondary">Số hiệp</div><div className="text-lg font-black text-text-primary">{outcome.completedSets}/{outcome.plannedSets}</div></div>
          <div><div className="text-xs text-text-secondary">AI đã đo</div><div className="text-lg font-black text-text-primary">{outcome.aiMeasuredSets} hiệp</div></div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/roadmap" className="rounded-xl bg-accent px-5 py-3 text-sm font-black text-white shadow-md hover:opacity-90">Xem lộ trình</Link>
          <Link to="/home" className="rounded-xl border border-border px-5 py-3 text-sm font-black text-text-primary hover:border-accent">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- tổng quan trước khi tập
  if (sessionId == null) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 p-5 sm:p-8">
        <header>
          <p className="text-xs font-black uppercase tracking-wide text-accent">{data.planSource === "SELF" ? "Danh sách của bạn" : `Chu kỳ ${data.cycleNumber ?? ""} · ${data.levelCode ?? ""}`}</p>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{data.dayName ?? "Buổi tập hôm nay"}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
            <span>{data.planName}</span>
            {data.estimatedMinutes ? <span className="inline-flex items-center gap-1"><Clock size={13} aria-hidden />~{data.estimatedMinutes} phút</span> : null}
            {data.planSource === "SYSTEM" && <span>Buổi {data.sessionsDone + 1}/{data.sessionsPlanned} của chu kỳ</span>}
          </p>
        </header>
        <div className="space-y-4">
          {grouped.map(([section, list]) => (
            <section key={section} aria-label={SECTION_LABELS[section] ?? section} className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-xs font-black uppercase tracking-wide text-text-secondary">{SECTION_LABELS[section] ?? section}</h2>
              <ul className="mt-2 divide-y divide-border/60">
                {list.map((e) => (
                  <li key={e.sequenceNo} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1 basis-48">
                      <span className="block truncate text-sm font-bold text-text-primary">{e.name}</span>
                      <span className="text-xs text-text-secondary">{prescriptionLabel(e)} · nghỉ {e.restSec ?? 60} giây</span>
                    </span>
                    {e.recommended && <RecommendedBadge />}
                    <AiChip e={e} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
          <p className="max-w-md text-xs text-text-secondary">Bài có nhãn <b>AI</b> dùng camera để đếm rep và đo góc. Hình ảnh được xử lý ngay trên thiết bị, chỉ gửi toạ độ khớp lên máy chủ. Bạn luôn có thể chuyển sang tự nhập.</p>
          <button type="button" onClick={start} disabled={startMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-black text-white shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60">
            {startMutation.isPending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <PlayCircle size={16} aria-hidden />}Bắt đầu buổi tập
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- đang tập
  const setNumber = Math.min(doneSets(current) + 1, current.sets);
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-accent">{data.dayName}</p>
          <h1 className="truncate font-display text-xl font-black text-text-primary sm:text-2xl">{current.name}</h1>
          <p className="text-xs text-text-secondary">{SECTION_LABELS[current.section] ?? current.section} · {prescriptionLabel(current)} · nghỉ {current.restSec ?? 60} giây{current.tempo ? ` · nhịp ${current.tempo}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-black tabular-nums text-text-primary">{fmtClock(elapsed)}</span>
          <button type="button" onClick={() => setWrap(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-black text-text-primary hover:border-accent"><Flag size={14} aria-hidden />Kết thúc buổi</button>
        </div>
      </header>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/60" role="progressbar" aria-valuemin={0} aria-valuemax={totalPlanned} aria-valuenow={totalDone} aria-label="Tiến độ buổi tập"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${totalPlanned ? (totalDone / totalPlanned) * 100 : 0}%` }} /></div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {resting != null ? (
            <div className="grid place-items-center rounded-3xl border border-border bg-surface p-8">
              <p className="mb-3 text-sm font-bold text-text-secondary">{pendingNext != null ? `Nghỉ trước bài ${exercises[pendingNext]?.name ?? "tiếp theo"}` : `Nghỉ trước hiệp ${setNumber}/${current.sets}`}</p>
              <RestTimer key={`${current.exerciseId}-${doneSets(current)}`} seconds={resting} onComplete={afterRest} onSkip={afterRest} />
            </div>
          ) : (
            <>
              {current.ai.ready && (
                <div role="tablist" aria-label="Cách tập" className="inline-flex rounded-xl border border-border bg-surface p-1 text-sm font-black">
                  {(["AI", "MANUAL"] as Mode[]).map((m) => (
                    <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${mode === m ? "bg-accent text-white shadow" : "text-text-secondary hover:text-text-primary"}`}>
                      {m === "AI" ? <><Bot size={14} aria-hidden />Tập với AI</> : <><Hand size={14} aria-hidden />Tự nhập</>}
                    </button>
                  ))}
                </div>
              )}
              {!current.ai.ready && <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary">{current.ai.note}</p>}
              {mode === "AI" && current.ai.ready ? (
                <AiSetPanel key={`${current.exerciseId}-${setNumber}`} exercise={current} setNumber={setNumber} totalSets={current.sets} workoutSessionId={sessionId}
                  onManual={() => setMode("MANUAL")} onDone={recordSet} />
              ) : (
                <ManualSetPanel key={`m-${current.exerciseId}-${setNumber}`} exercise={current} setNumber={setNumber} totalSets={current.sets} onDone={recordSet}
                  onUseAi={current.ai.ready ? () => setMode("AI") : undefined} />
              )}
              <div className="flex justify-end">
                <button type="button" onClick={skipExercise} className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-accent"><SkipForward size={14} aria-hidden />Bỏ qua bài này</button>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <div>
            <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-text-secondary">Video mẫu</p>
            <ExerciseMedia videoUrl={current.videoUrl} thumbnailUrl={current.thumbnailUrl} name={current.name} />
            {current.instructions && <p className="mt-2 line-clamp-4 text-xs leading-5 text-text-secondary">{current.instructions}</p>}
            {current.notes && <p className="mt-1 text-xs italic text-text-secondary">{current.notes}</p>}
          </div>
          <nav aria-label="Các bài trong buổi" className="rounded-2xl border border-border bg-surface p-3">
            <ul className="space-y-1">
              {exercises.map((e, i) => {
                const n = doneSets(e);
                const full = n >= e.sets;
                return (
                  <li key={e.sequenceNo}>
                    <button type="button" onClick={() => selectExercise(i)} aria-current={i === index ? "step" : undefined}
                      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition ${i === index ? "bg-accent/10 ring-1 ring-accent/40" : "hover:bg-background"}`}>
                      {full ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" aria-label="Đã xong" /> : <span className="grid h-4 w-4 shrink-0 place-items-center text-[10px] font-black text-text-secondary">{i + 1}</span>}
                      <span className="min-w-0 flex-1"><span className={`block truncate font-bold ${full ? "text-text-secondary line-through" : "text-text-primary"}`}>{e.name}</span><span className="text-[11px] text-text-secondary">{Math.min(n, e.sets)}/{e.sets} hiệp</span></span>
                      <AiChip e={e} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>

      {wrap && (
        <div role="dialog" aria-modal="true" aria-label="Kết thúc buổi tập" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-black text-text-primary">Kết thúc buổi tập?</h2>
            <p className="mt-1 text-sm text-text-secondary">Bạn đã làm {totalDone}/{totalPlanned} hiệp. Buổi tập được tính vào chu kỳ khi đạt từ 60% số hiệp.</p>
            <p className="mt-4 text-xs font-bold text-text-secondary">Bạn thấy buổi tập này nặng thế nào?</p>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Mức độ khó">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={difficulty === n} onClick={() => setDifficulty(n)} className={`h-10 w-10 rounded-xl border text-sm font-black transition ${difficulty === n ? "border-accent bg-accent text-white" : "border-border text-text-primary hover:border-accent"}`}>{n}</button>
              ))}
              <span className="ml-1 self-center text-[11px] text-text-secondary">1 nhẹ · 5 rất nặng</span>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setWrap(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-text-secondary hover:bg-background">Tiếp tục tập</button>
              <button type="button" disabled={finishMutation.isPending} onClick={() => submit("COMPLETED")} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-black text-white shadow-md hover:opacity-90 disabled:opacity-60">
                {finishMutation.isPending && <Loader2 size={14} className="animate-spin" aria-hidden />}Lưu buổi tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
