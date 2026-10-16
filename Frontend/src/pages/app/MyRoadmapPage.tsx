import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity, CheckCircle2, ClipboardCheck, Dumbbell, RefreshCw, Target, XCircle, MinusCircle, Info, MapPin, Flag, Lock,
  CalendarDays, Clock, Settings2, ChevronDown, History, Moon, TrendingDown, TrendingUp, type LucideIcon,
} from "lucide-react";
import { CycleRoadmap } from "../../features/level/CycleRoadmap";
import { LevelPendingBanner } from "../../features/level/LevelPendingBanner";
import { PlanChoiceBanner, PlanModeNote } from "../../features/plan-choice/PlanChoiceBanner";
import {
  apiErrorMessage,
  levelApi,
  type CompetencyDto,
  type CompletePeriodicResponse,
  type CycleDto,
  type EvaluationDto,
  type GapDto,
  type LevelDto,
  type SkillTreeDto,
  type StartPeriodicResponse,
  type TestItemDto,
} from "../../features/level/api";

/**
 * Thang level hiển thị (khớp DefaultLevelEngineConfig.LEVELS ở backend). Chỉ dùng để vẽ hành trình;
 * level thực tế luôn lấy từ /me/fitness-state. Level lạ (admin cấu hình thêm) vẫn hiển thị ở thẻ "Vị trí hiện tại".
 */
const LEVEL_LADDER = [
  { code: "L0", name: "FOUNDATION", label: "Nền tảng", score: 0 },
  { code: "L1", name: "BEGINNER", label: "Cơ bản", score: 25 },
  { code: "L2", name: "INTERMEDIATE", label: "Trung cấp", score: 50 },
  { code: "L3", name: "ADVANCED", label: "Nâng cao", score: 72 },
  { code: "L4", name: "ELITE", label: "Tinh hoa", score: 88 },
];

const ladderIndex = (level: LevelDto | null) =>
  level ? LEVEL_LADDER.findIndex((l) => l.code === level.code || l.name === level.name?.toUpperCase()) : -1;

const GATE_LABELS: Record<string, string> = {
  RELIABILITY: "Độ tin cậy đo",
  PERFORMANCE: "Thành tích",
  QUALITY: "Chất lượng động tác",
  COMPETENCY: "Năng lực",
  SKILL: "Kỹ năng tiên quyết",
  STABILITY: "Ổn định",
};

const DECISION_LABELS: Record<string, string> = {
  PROVISIONAL_ASSIGNED: "Xếp level tạm thời",
  PROMOTED: "Lên level",
  MAINTAINED: "Giữ level",
  REGRESSED: "Điều chỉnh xuống",
  RETEST_REQUIRED: "Cần làm lại bài test",
  COACH_OVERRIDE: "Coach điều chỉnh",
};

const STATUS_LABELS: Record<string, string> = {
  PROVISIONAL: "Tạm thời (tự khai báo)",
  VERIFIED: "Đã xác nhận bằng đo thực tế",
  RETURNING: "Quay lại sau thời gian nghỉ",
};

const EQUIPMENT = [
  { code: "PULL_UP_BAR", label: "Xà đơn" },
  { code: "PARALLEL_BARS", label: "Xà kép" },
  { code: "LOW_BAR", label: "Xà thấp" },
  { code: "RINGS", label: "Vòng treo" },
  { code: "RESISTANCE_BAND", label: "Dây kháng lực" },
];

function dose(e: { sets?: number; repMin?: number | null; repMax?: number | null; holdSec?: number | null }) {
  const work = e.holdSec ? `${e.holdSec}s` : e.repMin && e.repMax && e.repMin !== e.repMax ? `${e.repMin}–${e.repMax}` : `${e.repMin ?? e.repMax ?? "?"}`;
  return `${e.sets ?? 1} × ${work}`;
}

function GateChip({ name, status }: { name: string; status: string }) {
  const Icon = status === "PASS" ? CheckCircle2 : status === "FAIL" ? XCircle : MinusCircle;
  const color = status === "PASS" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
    : status === "FAIL" ? "text-rose-500 border-rose-500/30 bg-rose-500/10" : "text-text-secondary border-border bg-background";
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${color}`}>
      <Icon size={12} /> {GATE_LABELS[name] ?? name}
    </span>
  );
}

function EvaluationCard({ ev }: { ev: EvaluationDto }) {
  const failed = ev.reasons.filter((r) => !r.passed && r.gate !== "DECISION");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-black text-text-primary">{DECISION_LABELS[ev.decision] ?? ev.decision}</span>
        <span className="text-text-secondary">
          {ev.previousLevel ?? "–"} → {ev.finalLevel} · {new Date(ev.createdAt).toLocaleDateString("vi-VN")} · {ev.ruleSet}
        </span>
      </div>
      {Object.keys(ev.gates).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ev.gates).map(([k, v]) => <GateChip key={k} name={k} status={v} />)}
        </div>
      )}
      {ev.explanation && <p className="text-xs text-text-secondary">{ev.explanation}</p>}
      {failed.length > 0 && (
        <ul className="list-disc pl-5 text-[11px] text-text-secondary space-y-0.5">
          {failed.slice(0, 6).map((r, i) => <li key={i}>{r.message}</li>)}
        </ul>
      )}
    </div>
  );
}

// ============================== Khối roadmap ==============================

/** Một chặng trên trục lộ trình: số thứ tự + đường nối dọc. */
function Stage({ n, icon: Icon, title, subtitle, action, last, children }: {
  n: number; icon: LucideIcon; title: string; subtitle?: string; action?: ReactNode; last?: boolean; children: ReactNode;
}) {
  return (
    <section className="relative flex gap-3 sm:gap-5">
      <div className="flex flex-col items-center">
        <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#AAC4F5] via-[#8CA9FF] to-[#6384FF] text-white shadow-[0_4px_14px_rgba(140,169,255,0.4)] sm:h-11 sm:w-11">
          <Icon size={18} strokeWidth={2.4} />
        </span>
        {!last && <span className="mt-2 w-0.5 flex-1 rounded-full bg-gradient-to-b from-accent/50 to-border" />}
      </div>
      <div className={`min-w-0 flex-1 ${last ? "" : "pb-8"}`}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2 pt-1">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-accent">Chặng {n}</div>
            <h2 className="text-base font-black text-text-primary sm:text-lg">{title}</h2>
            {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Hành trình level L0 → L4 với vị trí hiện tại. */
function LevelJourney({ level, score }: { level: LevelDto | null; score: number | null }) {
  const idx = ladderIndex(level);
  return (
    <div className="rounded-3xl border border-border bg-surface p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary"><MapPin size={13} /> Hành trình level</div>
        {score != null && <div className="text-xs text-text-secondary">Điểm tổng <b className="text-text-primary">{score}</b>/100</div>}
      </div>
      <ol className="grid grid-cols-5">
        {LEVEL_LADDER.map((l, i) => {
          const state = idx < 0 ? "locked" : i < idx ? "done" : i === idx ? "current" : i === idx + 1 ? "next" : "locked";
          return (
            <li key={l.code} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span className={`absolute right-1/2 top-[18px] h-1 w-full -translate-y-1/2 rounded-full sm:top-[22px] ${i <= idx ? "bg-gradient-to-r from-emerald-500 to-accent" : "bg-border"}`} />
              )}
              <span className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 text-xs font-black sm:h-11 sm:w-11 ${
                state === "done" ? "border-emerald-500 bg-emerald-500 text-white"
                  : state === "current" ? "border-accent bg-accent text-white shadow-[0_0_0_6px_rgba(140,169,255,0.2)]"
                  : state === "next" ? "border-accent border-dashed bg-surface text-accent"
                  : "border-border bg-background text-text-secondary"
              }`}>
                {state === "done" ? <CheckCircle2 size={16} /> : state === "locked" ? <Lock size={13} /> : state === "next" ? <Flag size={14} /> : l.code}
              </span>
              <span className={`mt-2 text-[11px] font-black sm:text-xs ${state === "current" ? "text-accent" : "text-text-primary"}`}>{l.code}</span>
              <span className="hidden text-[11px] text-text-secondary sm:block">{l.label}</span>
              {state === "current" && <span className="mt-1 rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-black uppercase text-accent">Bạn ở đây</span>}
              {state === "next" && <span className="mt-1 text-[9px] font-bold uppercase text-text-secondary">Tiếp theo</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CompetencyBars({ items, weakest }: { items: CompetencyDto[]; weakest?: string | null }) {
  if (items.length === 0) return <p className="text-xs text-text-secondary">Chưa có dữ liệu năng lực.</p>;
  return (
    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((c) => {
        const weak = c.code === weakest;
        const TrendIcon = c.trend === "IMPROVING" ? TrendingUp : c.trend === "DECLINING" ? TrendingDown : null;
        return (
          <li key={c.code} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 font-bold text-text-primary">
                <span className="truncate">{c.name}</span>
                {weak && <span className="shrink-0 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-500">Ưu tiên</span>}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-text-secondary">
                {TrendIcon && <TrendIcon size={12} />}
                <b className="text-text-primary">{c.score ?? "–"}</b> · {c.band}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-background">
              <div className={`h-2 rounded-full ${weak ? "bg-rose-500" : "bg-accent"}`} style={{ width: `${Math.max(0, Math.min(100, c.score ?? 0))}%` }} />
            </div>
            <div className="mt-0.5 text-[10px] text-text-secondary">Độ tin cậy {Math.round(c.confidence * 100)}%</div>
          </li>
        );
      })}
    </ul>
  );
}

function GoalPanel({ skills }: { skills: SkillTreeDto }) {
  const r = skills.goalReadiness;
  const pct = Math.max(0, Math.min(100, r?.percent ?? 0));
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      {r && (
        <div className="flex flex-row items-center gap-4 rounded-2xl border border-border bg-surface p-4 lg:flex-col lg:justify-center lg:text-center">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" className="stroke-border" />
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" strokeLinecap="round"
                className={r.status === "READY" ? "stroke-emerald-500" : "stroke-accent"}
                strokeDasharray={`${(pct / 100) * 97.4} 97.4`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-lg font-black text-text-primary">{pct}%</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">Sẵn sàng cho</div>
            <div className="text-base font-black text-text-primary">{r.targetCode}</div>
            <div className={`text-xs font-bold ${r.status === "READY" ? "text-emerald-500" : "text-amber-500"}`}>
              {r.status === "READY" ? "Đã đủ điều kiện" : "Chưa đủ điều kiện"}
            </div>
          </div>
        </div>
      )}
      <div className={`rounded-2xl border border-border bg-surface p-4 ${r ? "" : "lg:col-span-2"}`}>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-text-secondary">Các mốc cần đạt ({skills.gaps.length})</div>
        {skills.gaps.length === 0 ? (
          <p className="flex items-center gap-2 text-xs text-emerald-500"><CheckCircle2 size={14} /> Không còn khoảng trống kỹ năng.</p>
        ) : (
          <ol className="space-y-3">
            {skills.gaps.map((g, i) => <GapRow key={i} gap={g} n={i + 1} />)}
          </ol>
        )}
      </div>
    </div>
  );
}

function GapRow({ gap, n }: { gap: GapDto; n: number }) {
  const pct = gap.required > 0 ? Math.max(0, Math.min(100, (gap.current / gap.required) * 100)) : 0;
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-background text-[10px] font-black text-text-secondary">{n}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-semibold text-text-primary">{gap.message}</span>
          <span className="shrink-0 font-mono text-[11px] text-text-secondary">{gap.current}/{gap.required}</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-background">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-accent" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </li>
  );
}

function LevelHistory({ items }: { items: EvaluationDto[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary"><History size={13} /> Lịch sử xét level</div>
      <ol className="relative space-y-3 border-l border-border pl-4">
        {items.slice(0, 6).map((ev) => (
          <li key={ev.id} className="relative text-xs">
            <span className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
              ev.decision === "PROMOTED" ? "bg-emerald-500" : ev.decision === "REGRESSED" ? "bg-rose-500" : ev.decision === "RETEST_REQUIRED" ? "bg-amber-500" : "bg-accent"
            }`} />
            <div className="font-bold text-text-primary">{DECISION_LABELS[ev.decision] ?? ev.decision} · {ev.previousLevel ?? "–"} → {ev.finalLevel}</div>
            <div className="text-[11px] text-text-secondary">{new Date(ev.createdAt).toLocaleDateString("vi-VN")}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PeriodicAssessment({ onDone }: { onDone: () => void }) {
  const [session, setSession] = useState<StartPeriodicResponse | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [result, setResult] = useState<CompletePeriodicResponse | null>(null);

  const start = useMutation({
    mutationFn: levelApi.startPeriodic,
    onSuccess: (s) => { setSession(s); setResult(null); },
    onError: (e) => toast.error(apiErrorMessage(e, "Không bắt đầu được bài đánh giá")),
  });

  const submit = useMutation({
    mutationFn: async (item: TestItemDto) => {
      const v = values[item.itemId] ?? {};
      const num = (k: string) => (v[k] === undefined || v[k] === "" ? undefined : Number(v[k]));
      return levelApi.submitResult(session!.sessionId, item.itemId, {
        validReps: num("validReps"), totalReps: num("totalReps") ?? num("validReps"), holdSec: num("holdSec"),
        angleDeg: num("angleDeg"), formScore: num("formScore"), source: "SELF_REPORTED",
      });
    },
    onSuccess: (r) => {
      setSession((s) => s && { ...s, items: s.items.map((i) => (i.itemId === r.itemId ? { ...i, result: r } : i)) });
      toast.success(r.status === "VALID" ? "Đã ghi nhận kết quả" : r.statusReason ?? "Cần làm lại bài này");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Không lưu được kết quả")),
  });

  const complete = useMutation({
    mutationFn: () => levelApi.completePeriodic(session!.sessionId),
    onSuccess: (r) => {
      setResult(r);
      if (r.evaluation.decision !== "RETEST_REQUIRED") { setSession(null); onDone(); }
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Chưa hoàn tất được bài đánh giá")),
  });

  if (!session) {
    return (
      <div className="space-y-3">
        {result && <EvaluationCard ev={result.evaluation} />}
        <button
          type="button"
          onClick={() => start.mutate()}
          disabled={start.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-black text-white cursor-pointer disabled:opacity-60"
        >
          <ClipboardCheck size={14} /> {start.isPending ? "Đang chuẩn bị..." : "Bắt đầu bài đánh giá thực hành"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-text-secondary space-y-1">
        <p className="font-bold text-text-primary">
          {session.purpose === "BASELINE" ? "Baseline Test – xác nhận level tạm thời" : "Đánh giá định kỳ"} · ~{session.estimatedMinutes} phút
        </p>
        <ul className="list-disc pl-5">{session.instructions.map((i) => <li key={i}>{i}</li>)}</ul>
        <p className="flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-600 dark:text-amber-300">
          <Info size={13} className="mt-0.5 shrink-0" />
          Nhập tay được tính là dữ liệu tự khai (độ tin cậy thấp, không đủ để mở khoá kỹ năng). Kết quả đo bằng camera AI sẽ được ưu tiên.
        </p>
      </div>
      <div className="space-y-2">
        {session.items.map((item) => {
          const v = values[item.itemId] ?? {};
          const set = (k: string, val: string) => setValues((p) => ({ ...p, [item.itemId]: { ...p[item.itemId], [k]: val } }));
          const field = (k: string, label: string) => (
            <input
              type="number"
              min={0}
              placeholder={label}
              value={v[k] ?? ""}
              onChange={(e) => set(k, e.target.value)}
              className="w-28 rounded-lg border border-border bg-background p-1.5 text-xs text-text-primary"
            />
          );
          return (
            <div key={item.itemId} className="rounded-xl border border-border bg-background p-3 flex flex-wrap items-center gap-2 text-xs">
              <div className="min-w-48 flex-1">
                <div className="font-bold text-text-primary">
                  {item.exerciseName} {item.mandatory ? <span className="text-rose-500">*</span> : <span className="text-text-secondary">(tuỳ chọn)</span>}
                </div>
                <div className="text-[10px] text-text-secondary">{item.competency}{item.protocol?.instruction ? ` · ${item.protocol.instruction}` : ""}</div>
              </div>
              {item.metric === "VALID_REPS" && <>{field("validReps", "Rep đúng")}{field("totalReps", "Tổng rep")}</>}
              {item.metric === "HOLD_SEC" && field("holdSec", "Giây giữ")}
              {item.metric === "ANGLE_DEG" && field("angleDeg", "Góc (độ)")}
              <button
                type="button"
                onClick={() => submit.mutate(item)}
                disabled={submit.isPending}
                className="rounded-lg border border-accent px-3 py-1.5 font-bold text-accent cursor-pointer disabled:opacity-60"
              >
                Lưu
              </button>
              {item.result && (
                <span className={`font-bold ${item.result.status === "VALID" ? "text-emerald-500" : "text-rose-500"}`}>
                  {item.result.status === "VALID" ? "✓ Đã ghi nhận" : item.result.statusReason ?? "Làm lại"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {result && result.evaluation.decision === "RETEST_REQUIRED" && <EvaluationCard ev={result.evaluation} />}
      <button
        type="button"
        onClick={() => complete.mutate()}
        disabled={complete.isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-black text-white cursor-pointer disabled:opacity-60"
      >
        {complete.isPending ? "Đang xét level..." : "Hoàn tất & xét level"}
      </button>
    </div>
  );
}

export default function MyRoadmapPage() {
  const qc = useQueryClient();
  const state = useQuery({ queryKey: ["fitness-state"], queryFn: levelApi.state });
  const skills = useQuery({ queryKey: ["skill-tree"], queryFn: levelApi.skills, enabled: state.isSuccess });
  const cycle = useQuery({ queryKey: ["training-cycle"], queryFn: levelApi.cycle, enabled: Boolean(state.data?.activeCycleId), retry: false });
  const history = useQuery({ queryKey: ["level-history"], queryFn: levelApi.history, enabled: state.isSuccess, retry: false });
  const [days, setDays] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<string[] | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["fitness-state"] });
    qc.invalidateQueries({ queryKey: ["skill-tree"] });
    qc.invalidateQueries({ queryKey: ["training-cycle"] });
    qc.invalidateQueries({ queryKey: ["level-history"] });
  };

  const saveConstraints = useMutation({
    mutationFn: () => levelApi.updateConstraints({
      daysPerWeek: days ?? state.data?.constraints.daysPerWeek,
      sessionMinutes: minutes ?? state.data?.constraints.sessionMinutes,
      equipment: equipment ?? state.data?.constraints.equipment,
      regenerate: true,
    }),
    onSuccess: () => { toast.success(state.data?.level ? "Đã cập nhật lịch tập và tạo lại chu kỳ" : "Đã lưu lịch tập. Chu kỳ theo level sẽ có sau khi bạn được phân level."); refresh(); },
    onError: (e) => toast.error(apiErrorMessage(e, "Không cập nhật được")),
  });

  const regenerate = useMutation({
    mutationFn: () => levelApi.regenerate("CONSTRAINT_CHANGED"),
    onSuccess: () => { toast.success("Đã tạo chu kỳ tập mới từ trạng thái hiện tại"); refresh(); },
    onError: (e) => toast.error(apiErrorMessage(e, "Không tạo được chu kỳ")),
  });

  if (state.isLoading) return <div className="p-6 text-sm text-text-secondary">Đang tải lộ trình...</div>;
  if (state.isError) return <div className="p-6 text-sm text-rose-500">{apiErrorMessage(state.error, "Không tải được lộ trình")}</div>;
  const s = state.data!;
  const eq = equipment ?? s.constraints.equipment;
  const eqLabels = EQUIPMENT.filter((o) => s.constraints.equipment.includes(o.code)).map((o) => o.label);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-text-primary sm:text-2xl">Lộ trình của tôi</h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary">
            Vòng lặp tự động: đánh giá → năng lực → level → khoảng trống kỹ năng → giáo án. Mỗi lần đánh giá, lộ trình được tính lại.
          </p>
        </div>
        {s.nextAssessmentDue && (
          <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
            s.assessmentDue ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300" : "border-border bg-surface text-text-secondary"
          }`}>
            <CalendarDays size={14} />
            Đánh giá tiếp theo: {new Date(s.nextAssessmentDue).toLocaleDateString("vi-VN")}{s.assessmentDue ? " · đã đến hạn" : ""}
          </div>
        )}
      </header>

      <LevelPendingBanner />
      <PlanChoiceBanner />
      <PlanModeNote />

      <LevelJourney level={s.level} score={s.overallScore} />

      <div className="pt-2">
        {/* Chặng 1: Vị trí hiện tại */}
        <Stage n={1} icon={MapPin} title="Bạn đang ở đâu" subtitle="Level hiện tại và 6 năng lực nền tảng (0–100).">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
            <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Level hiện tại</div>
              {s.level ? (
                <>
                  <div>
                    <div className="text-2xl font-black text-text-primary">{s.level.code} · {s.level.name}</div>
                    <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      s.level.status === "VERIFIED" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                    }`}>
                      {STATUS_LABELS[s.level.status] ?? s.level.status}
                    </span>
                  </div>
                  {s.level.description && <p className="text-xs text-text-secondary">{s.level.description}</p>}
                </>
              ) : <p className="text-xs text-text-secondary">Chưa có level – hãy hoàn thành bài test đầu vào hoặc bài đánh giá thực hành.</p>}
              {s.baselineRecommended && (
                <p className="flex gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-600 dark:text-amber-300">
                  <Info size={13} className="mt-0.5 shrink-0" /> Nên làm Baseline Test để xác nhận level bằng đo thực tế.
                </p>
              )}
              {s.lastEvaluation && (
                <div className="border-t border-border pt-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary">Lần xét gần nhất</div>
                  <EvaluationCard ev={s.lastEvaluation} />
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary"><Activity size={13} /> Năng lực</div>
              <CompetencyBars items={s.competencies} weakest={s.weakestCompetency} />
            </div>
          </div>
        </Stage>

        {/* Chặng 2: Mục tiêu */}
        <Stage n={2} icon={Target} title="Mục tiêu tiếp theo" subtitle="Những mốc kỹ năng còn thiếu, xếp theo mức ưu tiên.">
          {skills.data ? <GoalPanel skills={skills.data} /> : (
            <p className="rounded-2xl border border-dashed border-border p-4 text-xs text-text-secondary">{skills.isLoading ? "Đang tải mục tiêu..." : "Chưa có dữ liệu mục tiêu."}</p>
          )}
        </Stage>

        {/* Chặng 3: Chu kỳ tập */}
        <Stage
          n={3}
          icon={Dumbbell}
          title="Chu kỳ tập hiện tại"
          subtitle={cycle.data ? `${cycle.data.name}${cycle.data.description ? ` · ${cycle.data.description}` : ""}` : undefined}
          action={
            <button
              type="button"
              onClick={() => regenerate.mutate()}
              disabled={regenerate.isPending || !s.level}
              title={!s.level ? "Cần có level trước: hãy làm bài đánh giá" : undefined}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text-primary cursor-pointer hover:border-accent disabled:opacity-60"
            >
              <RefreshCw size={12} className={regenerate.isPending ? "animate-spin" : ""} /> Tạo lại chu kỳ
            </button>
          }
        >
          <div className="space-y-4">
            {cycle.data ? <CycleRoadmap cycle={cycle.data} /> : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-xs text-text-secondary">{s.level ? "Chưa có chu kỳ tập đang hoạt động." : "Chu kỳ tập theo level sẽ có sau khi bạn làm bài đánh giá và được phân level."}</p>
            )}

            {/* Tuỳ chỉnh lịch tập (thu gọn) */}
            <details className="group rounded-2xl border border-border bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 items-center gap-2 text-xs">
                  <Settings2 size={14} className="shrink-0 text-accent" />
                  <b className="shrink-0 text-text-primary">Tuỳ chỉnh lịch tập</b>
                  <span className="truncate text-text-secondary">
                    {s.constraints.daysPerWeek} buổi/tuần · {s.constraints.sessionMinutes} phút{eqLabels.length ? ` · ${eqLabels.join(", ")}` : ""}
                  </span>
                </span>
                <ChevronDown size={16} className="shrink-0 text-text-secondary transition-transform group-open:rotate-180" />
              </summary>
              <div className="flex flex-wrap items-end gap-4 border-t border-border px-4 py-4 text-xs">
                <label className="space-y-1">
                  <span className="block font-bold text-text-primary">Buổi/tuần</span>
                  <input type="number" min={1} max={7} value={days ?? s.constraints.daysPerWeek} onChange={(e) => setDays(Number(e.target.value))}
                    className="w-20 rounded-lg border border-border bg-background p-2 text-text-primary" />
                </label>
                <label className="space-y-1">
                  <span className="block font-bold text-text-primary">Phút/buổi</span>
                  <input type="number" min={10} max={240} value={minutes ?? s.constraints.sessionMinutes} onChange={(e) => setMinutes(Number(e.target.value))}
                    className="w-20 rounded-lg border border-border bg-background p-2 text-text-primary" />
                </label>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="block font-bold text-text-primary">Dụng cụ có sẵn</span>
                  <div className="flex flex-wrap gap-1.5">
                    {EQUIPMENT.map((o) => {
                      const on = eq.includes(o.code);
                      return (
                        <button key={o.code} type="button" onClick={() => setEquipment(on ? eq.filter((x) => x !== o.code) : [...eq, o.code])}
                          className={`rounded-lg border px-2.5 py-1.5 font-bold cursor-pointer ${on ? "border-accent bg-accent/15 text-accent" : "border-border text-text-secondary"}`}>
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button type="button" onClick={() => saveConstraints.mutate()} disabled={saveConstraints.isPending}
                  className="rounded-xl bg-accent px-4 py-2 font-black text-white cursor-pointer disabled:opacity-60">
                  {saveConstraints.isPending ? "Đang lưu..." : "Lưu & tạo lại chu kỳ"}
                </button>
              </div>
            </details>
          </div>
        </Stage>

        {/* Chặng 4: Trạm kiểm tra */}
        <Stage n={4} icon={ClipboardCheck} title="Trạm kiểm tra" subtitle="Làm bài đánh giá thực hành để xét level và tạo lại lộ trình." last>
          <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,300px)]">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <PeriodicAssessment onDone={refresh} />
            </div>
            {history.data && history.data.length > 0 && <LevelHistory items={history.data} />}
          </div>
        </Stage>
      </div>
    </div>
  );
}
