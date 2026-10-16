import { CheckCircle2, Gauge, HeartPulse, MessageCircleQuestion, XCircle } from "lucide-react";
import type { WorkoutSessionDetail } from "../../types";
import { ScoreBar, ScoreRing } from "../ui";
import { StatTile, rise } from "./shared";

/** Summary tiles for a session: completion, form score, reps, RPE, heart rate. */
export function SessionSummary({ session }: { session: WorkoutSessionDetail }) {
  const invalid = Math.max(0, session.totalReps - session.validReps);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <StatTile label="Hoàn thành" value={`${session.completionPercent}%`} hint={<ScoreBar value={session.completionPercent} showValue={false} label="Tỉ lệ hoàn thành" />} style={rise(0)} />
      <div className="well-3d flex items-center gap-3 rounded-2xl p-4 animate-rise" style={rise(1)}>
        <ScoreRing value={session.formScore} size={64} stroke={6} label="Form Score" />
        <div className="min-w-0">
          <div className="text-xs font-bold text-text-secondary">Form Score TB</div>
          <div className="text-[11px] text-text-secondary">{session.formScore === null ? "Chưa có dữ liệu AI" : "trên 100 điểm"}</div>
        </div>
      </div>
      <StatTile icon={CheckCircle2} label="Valid reps" value={<span className="text-emerald-600 dark:text-emerald-400">{session.validReps}</span>} hint={`trên ${session.totalReps} rep`} style={rise(2)} />
      <StatTile icon={XCircle} label="Invalid reps" value={<span className={invalid ? "text-rose-600 dark:text-rose-400" : undefined}>{invalid}</span>} hint="AI đánh giá chưa đạt" style={rise(3)} />
      <StatTile icon={Gauge} label="RPE" value={session.rpe === null ? "-" : <>{session.rpe}<span className="text-sm font-bold text-text-secondary">/10</span></>} hint="Mức gắng sức tự đánh giá" style={rise(4)} />
      <StatTile icon={HeartPulse} label="Nhịp tim TB" value={session.avgHeartRate === null ? "-" : <>{session.avgHeartRate}<span className="text-sm font-bold text-text-secondary"> bpm</span></>} style={rise(5)} />
    </div>
  );
}

/** Callout quoting the student's own note about the session. */
export function StudentNoteCallout({ name, note }: { name: string; note: string }) {
  return (
    <aside className="flex gap-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 animate-rise" aria-label="Ghi chú của học viên">
      <MessageCircleQuestion size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
      <div>
        <div className="text-xs font-extrabold text-blue-700 dark:text-blue-300">Ghi chú từ {name}</div>
        <p className="mt-1 text-sm leading-relaxed text-text-primary">"{note}"</p>
      </div>
    </aside>
  );
}
