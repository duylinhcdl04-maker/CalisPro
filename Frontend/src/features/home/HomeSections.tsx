import { Link } from "react-router-dom";
import { Activity, ArrowRight, Battery, Calendar, Clock, Dumbbell, Flame, Frown, Lightbulb, Moon, Play, Sparkles, Target, Trophy, TrendingUp, Minus } from "lucide-react";
import { Progress } from "antd";
import { ClayTileIcon } from "../../components/ui/ClayTileIcon";
import { FitnessScoreRadial } from "../../components/fitness/FitnessScoreRadial";
import { levelName } from "../level/levelLabels";
import type { HomeCompetency, HomeCycle, HomeData, HomeInsight, HomeReadiness, HomeRecord, HomeToday, HomeWeek } from "./api";

const clayHeader = "flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4";

// ------------------------------------------------------------------ buổi tập hôm nay

/** Buổi tập kế tiếp theo giáo án đang tập (cùng nguồn với trang Luyện tập). */
export function HomeTodayCard({ today, className = "" }: { today: HomeToday; className?: string }) {
  const source = today.planSource === "SELF" ? "Danh sách tự tạo" : "Giáo án của hệ thống";
  return (
    <div className={`clay-card p-6 sm:p-7 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-sky-700 dark:text-sky-400">
        <ClayTileIcon icon={Dumbbell} color="sky" size="xs" />
        <span>Hôm nay tập gì</span>
        {today.state === "READY" && <span className="ml-auto rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[11px] normal-case tracking-normal">{source}</span>}
      </div>

      {today.state === "READY" ? (
        <>
          <h2 className="mt-4 font-display text-xl font-black tracking-tight text-text-primary sm:text-2xl">{today.dayName}</h2>
          {today.focus && <p className="mt-1 text-sm font-medium text-text-secondary">{today.focus}</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-text-secondary">
            {today.estimatedMinutes != null && <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 dark:bg-white/10"><Clock size={13} aria-hidden />~{today.estimatedMinutes} phút</span>}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 dark:bg-white/10"><Dumbbell size={13} aria-hidden />{today.exerciseCount} bài</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 dark:bg-white/10"><Calendar size={13} aria-hidden />Đã tập {today.sessionsDone}/{today.sessionsPlanned} buổi của chu kỳ</span>
          </div>
          <Link to="/workout/12" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-black text-white shadow-md transition hover:opacity-90 active:scale-[0.98]">
            <Play size={15} aria-hidden />{today.activeSessionId ? "Tiếp tục buổi tập" : "Bắt đầu buổi tập"}
          </Link>
        </>
      ) : today.state === "CYCLE_DONE" ? (
        <>
          <h2 className="mt-4 font-display text-xl font-black text-text-primary">Bạn đã hoàn thành chu kỳ</h2>
          <p className="mt-1 text-sm text-text-secondary">{today.message ?? "Đã tập hết các buổi của chu kỳ hiện tại."}</p>
          <Link to="/workout/12" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-black text-white shadow-md transition hover:opacity-90">Xem bước tiếp theo <ArrowRight size={15} aria-hidden /></Link>
        </>
      ) : (
        <>
          <h2 className="mt-4 font-display text-xl font-black text-text-primary">Chưa có buổi tập</h2>
          <p className="mt-1 text-sm text-text-secondary">{today.message ?? "Bạn chưa có giáo án đang tập."}</p>
          <Link to="/plan-choice" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-black text-white shadow-md transition hover:opacity-90">Chọn cách tập <ArrowRight size={15} aria-hidden /></Link>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ tuần của chu kỳ

export function HomeCycleCard({ cycle, week, goal, className = "" }: { cycle?: HomeCycle; week?: HomeWeek; goal?: string; className?: string }) {
  const pct = week && week.plannedWorkouts > 0 ? Math.min(100, Math.round((week.completedWorkouts / week.plannedWorkouts) * 100)) : 0;
  return (
    <div className={`clay-card relative w-full overflow-hidden border border-sky-500/20 bg-gradient-to-br from-surface via-surface to-sky-500/5 p-6 ${className}`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-400/15 blur-2xl" />
      <div className="flex items-center justify-between border-b border-black/[0.04] pb-3.5 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-sky-700 dark:text-sky-400">
          <ClayTileIcon icon={Sparkles} color="sky" size="xs" />
          <span>Chu kỳ tập</span>
        </div>
        {cycle && <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-600">Tuần {cycle.weekIndex}/{cycle.weeksTotal}</span>}
      </div>

      {goal && (
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Mục tiêu của bạn</div>
          <div className="mt-1 flex items-center gap-2 text-lg font-black tracking-tight text-text-primary"><ClayTileIcon icon={Target} color="sky" size="xs" /><span>{goal}</span></div>
        </div>
      )}

      {cycle && week ? (
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-text-secondary">Tiến độ tuần này</span>
            <span className="font-extrabold text-sky-600 dark:text-sky-400">{pct}%</span>
          </div>
          <Progress percent={pct} showInfo={false} strokeColor={{ "0%": "#38bdf8", "100%": "#0284c7" }} strokeWidth={8} trailColor="rgba(0,0,0,0.05)" />
          <div className="flex items-center justify-between pt-1 text-[11px] font-medium text-text-secondary">
            <span>Hoàn thành: <strong className="text-text-primary">{week.completedWorkouts}/{week.plannedWorkouts}</strong> buổi</span>
            <span>Cả chu kỳ: <strong className="text-text-primary">{cycle.sessionsDone}/{cycle.sessionsPlanned}</strong></span>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-text-secondary">Chọn giáo án để theo dõi tiến độ từng tuần.</p>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-black/[0.04] pt-4 dark:border-white/[0.06]">
        <span className="truncate pr-3 text-xs font-medium text-text-secondary">{cycle?.planName ?? "Chưa có chu kỳ"}</span>
        <Link to="/roadmap" className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-sky-600 transition-colors hover:text-sky-700">
          <span>Lộ trình</span><ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ thể lực tổng thể (Level Engine)

const COMPETENCY_ORDER = ["PUSH", "PULL", "LEGS", "CORE", "MOBILITY", "SKILL"];

export function HomeFitnessCard({ data }: { data: HomeData }) {
  const byCode = new Map<string, HomeCompetency>(data.competencies.map((c) => [c.code, c]));
  const rows = COMPETENCY_ORDER.map((code) => byCode.get(code)).filter((c): c is HomeCompetency => !!c);
  return (
    <div className="clay-card p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-black/[0.04] pb-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 font-display text-base font-extrabold text-text-primary">
          <ClayTileIcon icon={Trophy} color="amber" size="sm" />
          <span>Thể lực tổng thể</span>
        </div>
        <div className="flex items-center gap-2.5">
          {data.level && <span className="rounded-full border border-sky-500/20 bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">Level {data.level.code}{levelName(data.level.code) ? ` · ${levelName(data.level.code)}` : ""}{data.level.status === "PROVISIONAL" ? " (tạm thời)" : ""}</span>}
          <Link to="/fitness-profile" className="inline-flex items-center gap-1 text-xs font-black text-[#547EFF] transition-transform hover:translate-x-0.5 hover:text-[#3864e0] dark:text-[#8CA9FF]">Hồ sơ thể chất <ArrowRight size={13} /></Link>
        </div>
      </div>

      {data.overallScore == null ? (
        <p className="text-sm text-text-secondary">Bạn chưa có điểm thể lực. Hoàn thành bài đánh giá đầu vào để hệ thống chấm điểm các năng lực của bạn.</p>
      ) : (
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
          <FitnessScoreRadial score={data.overallScore} />
          <div className="w-full flex-1">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Điểm từng năng lực">
              {rows.map((c) => (
                <li key={c.code} className={`clay-well p-3.5 ${c.code === data.weakestCompetency ? "ring-1 ring-amber-500/50" : ""}`}>
                  <div className="text-[11px] font-semibold text-text-secondary">{c.name}</div>
                  <div className="mt-0.5 text-lg font-black text-text-primary">{c.score == null ? <span className="text-sm font-bold text-text-secondary">Chưa đo</span> : <>{Math.round(c.score)}<span className="text-xs font-bold text-text-secondary">/100</span></>}</div>
                  {c.code === data.weakestCompetency && c.score != null && <div className="mt-0.5 text-[10px] font-bold text-amber-600">Cần cải thiện nhất</div>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-text-secondary">Điểm lấy từ kết quả đánh giá gần nhất của bạn. Năng lực "Chưa đo" sẽ có điểm sau khi bạn làm bài đo tương ứng.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ bốn ô tuần này

export function HomeWeekTiles({ week, streakDays }: { week?: HomeWeek; streakDays: number }) {
  const pct = week && week.plannedWorkouts > 0 ? Math.min(100, Math.round((week.completedWorkouts / week.plannedWorkouts) * 100)) : null;
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-4">
      <div className="clay-card-interactive p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary"><span>Buổi tập tuần này</span><ClayTileIcon icon={Calendar} color="sky" size="xs" /></div>
        <div className="mt-3 text-2xl font-black tracking-tight text-text-primary">{week ? week.completedWorkouts : "--"}{week && <span className="text-sm font-bold text-text-secondary">/{week.plannedWorkouts}</span>}</div>
        <div className="mt-2 text-[11px] font-medium text-sky-600">{week ? (week.completedWorkouts >= week.plannedWorkouts ? "Đã đủ buổi của tuần" : `Còn ${week.plannedWorkouts - week.completedWorkouts} buổi`) : "Chưa có giáo án"}</div>
      </div>
      <div className="clay-card-interactive p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary"><span>Thời gian tập tuần này</span><ClayTileIcon icon={Clock} color="indigo" size="xs" /></div>
        <div className="mt-3 text-2xl font-black tracking-tight text-text-primary">{week ? week.totalMinutes : "--"}{week && <span className="ml-1 text-xs font-bold text-text-secondary">phút</span>}</div>
        <div className="mt-2 text-[11px] font-medium text-indigo-600">{week && week.totalMinutes > 0 ? `~${(week.totalMinutes / 60).toFixed(1)} giờ` : "Chưa có buổi hoàn thành"}</div>
      </div>
      <div className="clay-card-interactive p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary"><span>Chuỗi điểm danh</span><ClayTileIcon icon={Flame} color="amber" size="xs" /></div>
        <div className="mt-3 flex items-baseline gap-1 text-2xl font-black tracking-tight text-text-primary"><span>{streakDays}</span><span className="text-xs font-bold text-text-secondary">ngày liên tiếp</span></div>
        <div className="mt-2 text-[11px] font-bold text-amber-600">{streakDays > 0 ? "Giữ vững nhịp điểm danh mỗi ngày" : "Check-in hôm nay để bắt đầu chuỗi"}</div>
      </div>
      <div className="clay-card-interactive p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary"><span>Hoàn thành kế hoạch tuần</span><ClayTileIcon icon={Sparkles} color="emerald" size="xs" /></div>
        <div className="mt-3 text-2xl font-black tracking-tight text-text-primary">{pct == null ? "--" : `${pct}%`}</div>
        {pct != null && <div className="mt-2"><Progress percent={pct} showInfo={false} strokeColor={{ "0%": "#38bdf8", "100%": "#0284c7" }} strokeWidth={5} trailColor="rgba(0,0,0,0.04)" /></div>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ sự sẵn sàng từ check-in

const READINESS_TEXT = {
  GOOD: "Cơ thể bạn đang sẵn sàng cho buổi tập hôm nay. Bạn có thể tập đúng giáo án.",
  MEDIUM: "Mức sẵn sàng trung bình. Hãy khởi động kỹ và theo dõi cảm giác của cơ thể khi tập.",
  LOW: "Mức sẵn sàng đang thấp. Cân nhắc giảm số hiệp hoặc chọn bài nhẹ hơn, và nghỉ ngơi đủ giấc.",
} as const;

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("vi-VN");

export function HomeReadinessCard({ readiness }: { readiness?: HomeReadiness }) {
  return (
    <div className="clay-card p-6 sm:p-8">
      <div className={clayHeader}>
        <div className="flex items-center gap-3 font-display text-base font-extrabold text-text-primary"><ClayTileIcon icon={Activity} color="rose" size="xs" /><span>Sự sẵn sàng của cơ thể</span></div>
        {readiness && <span className="text-xs font-bold text-text-secondary">{readiness.today ? "Check-in hôm nay" : `Check-in ngày ${fmtDate(readiness.checkinDate)}`}</span>}
      </div>

      {!readiness ? (
        <p className="mt-5 text-sm text-text-secondary">Chưa có check-in trong 3 ngày gần đây. Hãy check-in sức khỏe ở khung "Điểm danh" phía trên để xem mức sẵn sàng của bạn.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex items-baseline gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-5 py-3 shadow-inner">
              <span className="font-display text-4xl font-black text-sky-700 dark:text-sky-400">{readiness.score}</span>
              <span className="text-xs font-bold uppercase text-sky-700/60 dark:text-sky-400/60">/ 100</span>
            </div>
            <div>
              <p className="text-sm font-medium leading-relaxed text-text-secondary">{READINESS_TEXT[readiness.level]}</p>
              <p className="mt-1 text-[11px] text-text-secondary">Điểm này chỉ để gợi ý cường độ buổi tập, không ảnh hưởng level của bạn.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              { icon: Battery, color: "emerald" as const, label: "Năng lượng", value: readiness.energy != null ? `${readiness.energy}/5` : null },
              { icon: Moon, color: "indigo" as const, label: "Giấc ngủ", value: readiness.sleepHours != null ? `${readiness.sleepHours}h` : null },
              { icon: Frown, color: "amber" as const, label: "Đau mỏi cơ", value: readiness.soreness != null ? `${readiness.soreness}/5` : null },
              { icon: Activity, color: "sky" as const, label: "Căng thẳng", value: readiness.stress != null ? `${readiness.stress}/5` : null },
            ].map((m) => (
              <div key={m.label} className="clay-well flex items-center gap-3 p-3.5">
                <ClayTileIcon icon={m.icon} color={m.color} size="sm" />
                <div><div className="text-[11px] font-semibold text-text-secondary">{m.label}</div><div className="text-sm font-extrabold text-text-primary">{m.value ?? "Chưa khai"}</div></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ nhận xét từ dữ liệu

export function HomeInsightCard({ insight }: { insight: HomeInsight }) {
  return (
    <div className="clay-card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <ClayTileIcon icon={Lightbulb} color="amber" size="sm" />
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Nhận xét từ dữ liệu của bạn</div>
          <h3 className="mt-0.5 font-display text-base font-black text-text-primary">{insight.headline}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary">{insight.message}</p>
        </div>
      </div>
      <Link to="/progress" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-sky-600 hover:underline">{insight.ctaLabel}<ArrowRight size={13} aria-hidden /></Link>
    </div>
  );
}

// ------------------------------------------------------------------ kỷ lục cá nhân

export function HomeRecords({ records }: { records: HomeRecord[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 font-display text-base font-extrabold text-text-primary"><ClayTileIcon icon={Trophy} color="amber" size="sm" /><span>Kỷ lục cá nhân</span></div>
        <Link to="/progress" className="text-xs font-bold text-sky-600 hover:underline">Xem tất cả</Link>
      </div>
      {records.length === 0 ? (
        <p className="clay-card p-5 text-sm text-text-secondary">Chưa có kỷ lục. Hoàn thành buổi tập đầu tiên để hệ thống ghi nhận hiệp tốt nhất của bạn.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {records.map((r) => {
            const up = r.trend === "up";
            const Icon = up ? TrendingUp : Minus;
            return (
              <div key={r.exercise} className="clay-card-interactive flex flex-col justify-between p-4 sm:p-5">
                <div>
                  <div className="truncate text-xs font-semibold text-text-secondary">{r.exercise}</div>
                  <div className="mt-2 text-2xl font-black tracking-tight text-text-primary">{r.value}{r.unit && <span className="ml-1 text-xs font-semibold text-text-secondary">{r.unit}</span>}</div>
                </div>
                <div className={`mt-3 inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-xs font-bold ${up ? "bg-emerald-500/10 text-emerald-500" : "bg-black/5 text-text-secondary dark:bg-white/10"}`}><Icon size={12} aria-hidden /><span>{r.changeLabel}</span></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
