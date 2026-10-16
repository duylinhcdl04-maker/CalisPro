import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Check, ChevronDown, Clock, Dumbbell, Flag, Moon } from "lucide-react";
import type { CycleDayDto, CycleDto, CycleExerciseDto } from "./api";

/**
 * Chu kỳ tập dạng roadmap: một con đường uốn lượn, mỗi tuần là một mốc trên đường, trong mốc có các buổi tập và bài tập.
 * Bấm vào một bài tập sẽ mở trang chi tiết động tác (/exercises/:id). Dữ liệu lấy nguyên từ /me/training-cycle, không tự suy diễn thêm.
 * Các buổi tập giống hệt nhau trong một tuần được gộp thành một khối để khỏi lặp lại cùng danh sách bài.
 */

const DAY_MS = 86_400_000;
const NODE_Y = 34;   // vị trí dọc của mốc so với đầu hàng (px): thẳng hàng với tiêu đề thẻ tuần

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDay = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

function dose(e: CycleExerciseDto): string {
  const work = e.holdSec ? `${e.holdSec}s` : e.repMin && e.repMax && e.repMin !== e.repMax ? `${e.repMin}-${e.repMax}` : `${e.repMin ?? e.repMax ?? "?"}`;
  return `${e.sets ?? 1} x ${work}`;
}

/**
 * Lý do chọn bài do backend sinh. Bỏ mã kỹ thuật cuối câu (vd. "(IN_PROGRESS)") và bỏ câu chung chung "giữ nguyên như kế hoạch"
 * vì lặp ở mọi bài và không cho người tập thêm thông tin.
 */
function usefulReason(s: string | null | undefined): string {
  if (!s) return "";
  const cleaned = s.replace(/\s*\([A-Z_]+\)(?=\.?$)/, "");
  return /giữ nguyên như kế hoạch/i.test(cleaned) ? "" : cleaned;
}

type WeekState = "past" | "now" | "upcoming";

interface Week {
  number: number;
  days: CycleDayDto[];
  state: WeekState;
  deload: boolean;
  start: Date | null;
}

function buildWeeks(cycle: CycleDto): Week[] {
  const numbers = [...new Set(cycle.days.map((d) => d.weekNumber ?? 1))].sort((a, b) => a - b);
  const startMs = cycle.startDate ? new Date(cycle.startDate).getTime() : NaN;
  const hasStart = !Number.isNaN(startMs);
  const nowWeek = hasStart ? Math.floor((Date.now() - startMs) / (7 * DAY_MS)) + 1 : null;
  return numbers.map((n) => {
    const days = cycle.days.filter((d) => (d.weekNumber ?? 1) === n);
    const state: WeekState = nowWeek == null ? "upcoming" : n < nowWeek ? "past" : n === nowWeek ? "now" : "upcoming";
    return { number: n, days, state, deload: days.some((d) => d.deload), start: hasStart ? new Date(startMs + (n - 1) * 7 * DAY_MS) : null };
  });
}

interface SessionGroup { key: string; days: CycleDayDto[] }

/** Gộp các buổi có cùng danh sách bài và cùng liều tập thành một nhóm. Giữ nguyên thứ tự xuất hiện. */
function groupSessions(days: CycleDayDto[]): SessionGroup[] {
  const groups: SessionGroup[] = [];
  for (const d of days) {
    const key = d.restDay ? "rest" : d.exercises.map((e) => `${e.exerciseId}:${dose(e)}:${e.rpe ?? ""}`).join("|") + `|${d.estimatedMinutes ?? ""}`;
    const g = groups.find((x) => x.key === key);
    if (g) g.days.push(d); else groups.push({ key, days: [d] });
  }
  return groups;
}

/** Tên buổi bỏ phần "Tuần N · " ở đầu cho gọn. */
const sessionName = (d: CycleDayDto) => d.name.replace(/^Tuần\s*\d+\s*[·\-:]\s*/i, "");

/** Chiều cao thực của một phần tử, để vẽ đường theo pixel (thẻ mở ra hay thu lại thì đường vẫn bám theo). */
function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [h, setH] = useState(160);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setH(Math.max(el.getBoundingClientRect().height, NODE_Y * 2));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, h] as const;
}

/**
 * Một đoạn đường của một hàng: vào từ giữa cạnh trên, lượn qua mốc (lệch trái hoặc phải) rồi ra ở giữa cạnh dưới.
 * Toạ độ ngang theo phần trăm, toạ độ dọc theo pixel nên mốc luôn thẳng hàng với tiêu đề thẻ.
 */
function RoadSegment({ nodeX, height, first, last }: { nodeX: number; height: number; first?: boolean; last?: boolean }) {
  const into = first ? `M${nodeX} ${NODE_Y}` : `M50 0 C50 ${NODE_Y * 0.6}, ${nodeX} ${NODE_Y * 0.3}, ${nodeX} ${NODE_Y}`;
  const rest = height - NODE_Y;
  const d = last ? into : `${into} C${nodeX} ${NODE_Y + rest * 0.5}, 50 ${NODE_Y + rest * 0.5}, 50 ${height}`;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" strokeWidth={30} className="stroke-slate-200 dark:stroke-slate-700" />
      <path d={d} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" strokeWidth={2} strokeDasharray="7 9" className="stroke-white/90 dark:stroke-slate-400/70" />
    </svg>
  );
}

function Node({ week }: { week: Week }) {
  const base = "grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 text-sm font-black shadow-md";
  if (week.state === "past") return <span className={`${base} border-white bg-emerald-500 text-white dark:border-slate-900`}><Check size={18} strokeWidth={3} aria-label="Đã qua" /></span>;
  if (week.state === "now") {
    return (
      <span className={`${base} border-white bg-accent text-white ring-4 ring-accent/25 dark:border-slate-900`}>
        <span className="motion-safe:animate-pulse">{week.number}</span>
      </span>
    );
  }
  return <span className={`${base} border-accent/40 bg-white text-accent dark:bg-slate-900`}>{week.number}</span>;
}

function ExerciseRow({ e, index }: { e: CycleExerciseDto; index: number }) {
  const reason = usefulReason(e.selectionReason);
  return (
    <li>
      <Link
        to={`/exercises/${e.exerciseId}`}
        className="group flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="relative mt-0.5 shrink-0">
          {e.thumbnailUrl ? (
            <img src={e.thumbnailUrl} alt="" loading="lazy" className="h-11 w-11 rounded-xl object-cover" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><Dumbbell size={18} aria-hidden /></span>
          )}
          <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-text-primary px-1 text-[9px] font-black text-surface">{index + 1}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-snug text-text-primary group-hover:text-accent">{e.exerciseName}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1 font-mono text-[11px]">
            <span className="rounded-md bg-background px-1.5 py-0.5 font-bold text-text-primary">{dose(e)}</span>
            {e.rpe ? <span className="rounded-md bg-background px-1.5 py-0.5 text-text-secondary">RPE {e.rpe}</span> : null}
            {e.restSec ? <span className="rounded-md bg-background px-1.5 py-0.5 text-text-secondary">nghỉ {e.restSec}s</span> : null}
          </span>
          {reason && <span className="mt-1 block text-[11px] leading-snug text-text-secondary">{reason}</span>}
        </span>
        <ArrowUpRight size={15} className="mt-1 shrink-0 text-text-secondary/60 transition-colors group-hover:text-accent" aria-hidden />
      </Link>
    </li>
  );
}

function SessionBlock({ group }: { group: SessionGroup }) {
  const first = group.days[0];
  const count = group.days.length;
  if (first.restDay) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-3 text-xs text-text-secondary">
        <Moon size={13} aria-hidden /> Nghỉ và hồi phục{count > 1 ? ` (${count} ngày)` : ""}
      </p>
    );
  }
  return (
    <section className="rounded-xl border border-border/70 bg-background">
      <header className="flex items-start justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <div className="min-w-0">
          <h4 className="text-xs font-black text-text-primary">
            {first.focus || sessionName(first)}
            {count > 1 && <span className="ml-2 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-black text-accent">{count} buổi giống nhau</span>}
          </h4>
          <p className="mt-0.5 text-[11px] text-text-secondary">{group.days.map(sessionName).join(", ")}</p>
        </div>
        {first.estimatedMinutes != null && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-text-secondary"><Clock size={11} aria-hidden /> {first.estimatedMinutes} phút</span>
        )}
      </header>
      <ol className="p-1">{first.exercises.map((e, i) => <ExerciseRow key={e.id} e={e} index={i} />)}</ol>
    </section>
  );
}

function WeekCard({ week, open }: { week: Week; open: boolean }) {
  const sessions = week.days.filter((d) => !d.restDay).length;
  const end = week.start ? new Date(week.start.getTime() + 6 * DAY_MS) : null;
  const groups = groupSessions(week.days);
  const distinct = groups.filter((g) => !g.days[0].restDay).reduce((n, g) => n + g.days[0].exercises.length, 0);
  return (
    <details open={open} className="group rounded-2xl border border-border bg-surface shadow-sm open:border-accent/30">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-text-primary">Tuần {week.number}</h3>
            {week.state === "now" && <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-black text-white">Tuần này</span>}
            {week.state === "past" && <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Đã qua</span>}
            {week.deload && <span className="rounded-md bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">Tuần giảm tải</span>}
          </div>
          <p className="mt-0.5 text-[11px] text-text-secondary">
            {week.start && end ? `${fmtDay(week.start)} - ${fmtDay(end)}. ` : ""}{sessions} buổi tập, {distinct} bài mỗi buổi
          </p>
        </div>
        <ChevronDown size={16} className="shrink-0 text-text-secondary transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2.5 border-t border-border/70 p-3">
        {groups.map((g) => <SessionBlock key={g.key + g.days[0].id} group={g} />)}
      </div>
    </details>
  );
}

function RoadRow({ index, left, first, week, open }: { index: number; left: boolean; first: boolean; week: Week; open: boolean }) {
  const [ref, height] = useHeight<HTMLLIElement>();
  const nodeX = left ? 32 : 68;   // vị trí ngang của mốc trên đoạn đường, theo phần trăm
  return (
    <li ref={ref} data-row={index} className="grid grid-cols-[64px_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)]">
      <div className="relative col-start-1 row-start-1 md:col-start-2">
        <RoadSegment nodeX={nodeX} height={height} first={first} />
        <div className="absolute" style={{ left: `${nodeX}%`, top: NODE_Y }}><Node week={week} /></div>
      </div>
      <div className={`col-start-2 row-start-1 min-w-0 py-2.5 pl-2 ${left ? "md:col-start-1 md:pl-0 md:pr-2" : "md:col-start-3 md:pl-2"}`}>
        <WeekCard week={week} open={open} />
      </div>
    </li>
  );
}

export function CycleRoadmap({ cycle }: { cycle: CycleDto }) {
  const weeks = buildWeeks(cycle);
  const [endRef, endHeight] = useHeight<HTMLLIElement>();
  if (weeks.length === 0) return <p className="rounded-2xl border border-dashed border-border p-4 text-xs text-text-secondary">Chu kỳ này chưa có buổi tập nào.</p>;

  const nowIdx = weeks.findIndex((w) => w.state === "now");
  const openIdx = nowIdx >= 0 ? nowIdx : Math.max(0, weeks.findIndex((w) => w.state === "upcoming"));
  const done = weeks.filter((w) => w.state === "past").length;
  const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
  const total = weeks.length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-surface px-4 py-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-text-primary">
          <CalendarDays size={14} className="text-accent" aria-hidden />
          {total} tuần{cycle.startDate ? `, ${fmtDay(new Date(cycle.startDate))}` : ""}{endDate ? ` - ${fmtDay(endDate)}` : ""}
        </span>
        <div className="flex min-w-[160px] flex-1 items-center gap-2" role="img" aria-label={`Đã qua ${done} trên ${total} tuần`}>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/70"><div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done / total) * 100}%` }} /></div>
          <span className="text-[11px] font-bold tabular-nums text-text-secondary">{done}/{total}</span>
        </div>
      </div>

      <ol className="relative">
        {weeks.map((w, i) => <RoadRow key={w.number} index={i} left={i % 2 === 0} first={i === 0} week={w} open={i === openIdx} />)}
        <li ref={endRef} className="grid grid-cols-[64px_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)]">
          <div className="relative col-start-1 row-start-1 md:col-start-2">
            <RoadSegment nodeX={50} height={endHeight} last />
            <div className="absolute" style={{ left: "50%", top: NODE_Y }}>
              <span className="grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-slate-700 text-white shadow-md dark:border-slate-900 dark:bg-slate-200 dark:text-slate-900"><Flag size={17} aria-hidden /></span>
            </div>
          </div>
          <div className="col-start-2 row-start-1 min-w-0 py-2.5 pl-2 md:col-start-3">
            <div className="rounded-2xl border border-dashed border-border px-4 py-3">
              <p className="text-sm font-black text-text-primary">Kết thúc chu kỳ</p>
              <p className="text-[11px] text-text-secondary">{endDate ? `Dự kiến ${fmtDay(endDate)}. ` : ""}Sau đó bạn làm bài đánh giá để cập nhật level và nhận chu kỳ mới.</p>
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}
