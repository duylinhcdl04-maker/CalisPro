import { useState } from "react";
import { CheckCircle2, Flame, HeartPulse, Sparkles } from "lucide-react";
import { EXP_EVENT_LABEL, useDailyCheckin, useExp, type CheckinInput } from "./api";

const SCALES: { key: keyof Omit<CheckinInput, "sleepHours" | "notes">; label: string; low: string; high: string }[] = [
  { key: "energyLevel", label: "Năng lượng", low: "Rất thấp", high: "Rất tốt" },
  { key: "stressLevel", label: "Căng thẳng", low: "Thấp", high: "Cao" },
  { key: "muscleSoreness", label: "Đau mỏi cơ", low: "Không", high: "Nhiều" },
  { key: "motivationLevel", label: "Động lực tập", low: "Thấp", high: "Cao" },
];

const DEFAULTS: CheckinInput = { sleepHours: 7, energyLevel: 3, stressLevel: 3, muscleSoreness: 2, motivationLevel: 3 };

/**
 * Điểm danh hằng ngày = check-in sức khỏe. Một lần mỗi ngày, trong ngày; EXP chỉ ghi khi rule set bật tính năng.
 * EXP chỉ là chuyên cần: không thay điểm bài test hay form, và chỉ điểm danh thì không thể lên level.
 */
export function DailyCheckinCard({ className = "" }: { className?: string }) {
  const exp = useExp();
  const checkin = useDailyCheckin();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CheckinInput>(DEFAULTS);
  if (!exp.isSuccess) return null;
  const d = exp.data;
  const done = d.checkedInToday;
  const pct = Math.min(100, Math.round((d.expInLevel / d.expPerLevel) * 100));

  const submit = () => checkin.mutate(form, { onSuccess: () => setOpen(false) });

  return (
    <section aria-label="Điểm danh hằng ngày" className={`rounded-3xl border border-border bg-surface p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-black text-text-primary">
            {done ? <CheckCircle2 size={18} className="text-emerald-500" aria-hidden /> : <HeartPulse size={18} className="text-accent" aria-hidden />}
            {done ? "Bạn đã điểm danh hôm nay" : "Điểm danh hôm nay bằng check-in sức khỏe"}
          </h2>
          <p className="mt-0.5 max-w-xl text-sm text-text-secondary">
            {done
              ? "Cảm ơn bạn đã cập nhật. Hệ thống dùng dữ liệu này để gợi ý cường độ buổi tập phù hợp."
              : "Trả lời vài câu về giấc ngủ và cảm giác cơ thể, mất chưa đến một phút. Đây cũng là cách điểm danh mỗi ngày."}
          </p>
        </div>
        {!done && !open && (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:opacity-90">
            <HeartPulse size={15} aria-hidden /> Check-in ngay{d.enabled ? " (+EXP)" : ""}
          </button>
        )}
      </div>

      {open && !done && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <label className="block text-sm font-bold text-text-primary">
            Giấc ngủ đêm qua: {form.sleepHours} giờ
            <input type="range" min={0} max={12} step={0.5} value={form.sleepHours} onChange={(e) => setForm({ ...form, sleepHours: Number(e.target.value) })} className="mt-1 w-full accent-[var(--accent,#10b981)]" />
          </label>
          {SCALES.map((s) => (
            <fieldset key={s.key}>
              <legend className="text-sm font-bold text-text-primary">{s.label}</legend>
              <div className="mt-1 flex items-center gap-2">
                <span className="w-16 text-[11px] text-text-secondary">{s.low}</span>
                <div className="flex flex-1 gap-1.5" role="radiogroup" aria-label={s.label}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n} type="button" role="radio" aria-checked={form[s.key] === n}
                      onClick={() => setForm({ ...form, [s.key]: n })}
                      className={`h-9 flex-1 rounded-lg border text-sm font-black transition ${form[s.key] === n ? "border-accent bg-accent text-white" : "border-border bg-background text-text-secondary hover:border-accent/50"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="w-16 text-right text-[11px] text-text-secondary">{s.high}</span>
              </div>
            </fieldset>
          ))}
          {checkin.isError && <p role="alert" className="text-sm font-bold text-red-500">Chưa lưu được check-in. Vui lòng thử lại.</p>}
          <div className="flex gap-2">
            <button type="button" onClick={submit} disabled={checkin.isPending} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:opacity-90 disabled:opacity-60">
              {checkin.isPending ? "Đang lưu..." : "Lưu check-in"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary">Để sau</button>
          </div>
        </div>
      )}

      {d.enabled ? (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
              <span className="flex items-center gap-1.5 text-text-primary"><Sparkles size={14} className="text-amber-500" aria-hidden /> Cấp EXP {d.expLevel}</span>
              <span>{d.expInLevel}/{d.expPerLevel} EXP</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ cấp EXP">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
              <Flame size={13} className="text-amber-500" aria-hidden /> Chuỗi điểm danh: <b className="text-text-primary">{d.streakDays} ngày</b> · Tổng <b className="text-text-primary">{d.totalExp} EXP</b>
            </p>
            <p className="mt-1 text-[11px] text-text-secondary">Cấp EXP chỉ để ghi nhận sự đều đặn, không phải level thể lực của bạn.</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
              <span className="text-text-primary">Chuyên cần {d.windowDays} ngày gần nhất</span>
              <span>{Math.round(d.attendanceScore ?? 0)}/100</span>
            </div>
            <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10" role="progressbar" aria-valuenow={Math.round(d.attendanceScore ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label="Điểm chuyên cần">
              <div className={`h-full rounded-full transition-all ${d.gatePassed ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: `${Math.round(d.attendanceScore ?? 0)}%` }} />
              {d.minScore != null && <div className="absolute inset-y-0 w-0.5 bg-text-primary/60" style={{ left: `${d.minScore}%` }} aria-hidden />}
            </div>
            <p className="mt-1.5 text-xs text-text-secondary">
              {d.gatePassed ? "Bạn đã đạt mức chuyên cần để được xét lên level." : `Cần từ ${d.minScore} điểm để được xét lên level ở lần đánh giá tới.`}
            </p>
            <p className="mt-1 text-[11px] text-text-secondary">Điểm chuyên cần không thay bài đánh giá hay form tập: bạn vẫn cần đạt các yêu cầu về thành tích và chất lượng.</p>
          </div>
          {d.recent.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 sm:col-span-2" aria-label="EXP gần đây">
              {d.recent.map((e, i) => (
                <li key={`${e.type}-${e.ref}-${i}`} className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-300">
                  +{e.points} {EXP_EVENT_LABEL[e.type] ?? e.type}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-text-secondary">Tính năng EXP chuyên cần chưa được bật. Check-in của bạn vẫn được lưu.</p>
      )}
    </section>
  );
}
