import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import type { WorkoutSessionSummary } from "../../types";
import { REVIEW_STATUS, SESSION_STATUS } from "../../constants/labels";
import { formatDay, formatTime } from "../../lib/format";
import { ScoreBar, StatusBadge, StudentAvatar } from "../ui";
import { FormScoreBadge, rise } from "./shared";

const sessionHref = (id: string) => `/coach/sessions/${id}`;

function DateCell({ iso }: { iso: string }) {
  return (
    <div className="whitespace-nowrap">
      <div className="text-sm font-bold text-text-primary">{formatDay(iso)}</div>
      <div className="text-[11px] tabular-nums text-text-secondary">{formatTime(iso)}</div>
    </div>
  );
}

function Completion({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <ScoreBar value={value} showValue={false} label={`Hoàn thành ${value}%`} className="w-20" />
      <span className="w-10 text-right text-xs font-extrabold tabular-nums text-text-primary">{value}%</span>
    </div>
  );
}

function Badges({ s }: { s: WorkoutSessionSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={SESSION_STATUS[s.status]} />
      {s.status !== "MISSED" && <StatusBadge status={REVIEW_STATUS[s.reviewStatus]} />}
    </div>
  );
}

const TH = "px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-text-secondary";

/** Desktop table (lg and up). Whole row is clickable; the workout name is the keyboard target. */
export function SessionTable({ items }: { items: WorkoutSessionSummary[] }) {
  const navigate = useNavigate();
  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">Danh sách buổi tập của học viên</caption>
      <thead>
        <tr className="border-b border-border/70">
          <th scope="col" className={TH}>Học viên</th>
          <th scope="col" className={TH}>Buổi tập</th>
          <th scope="col" className={TH}>Thời lượng</th>
          <th scope="col" className={TH}>Hoàn thành</th>
          <th scope="col" className={TH}>Form Score</th>
          <th scope="col" className={TH}>Valid Reps</th>
          <th scope="col" className={TH}>Ngày</th>
          <th scope="col" className={TH}>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s, i) => (
          <tr
            key={s.id}
            onClick={() => navigate(sessionHref(s.id))}
            className="animate-rise cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-surface-sunken/60"
            style={rise(i, 25)}
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <StudentAvatar name={s.studentName} src={s.studentAvatar} size="xs" />
                <span className="max-w-[140px] truncate text-sm font-bold text-text-primary">{s.studentName}</span>
              </div>
            </td>
            <td className="px-4 py-3">
              <Link
                to={sessionHref(s.id)}
                onClick={(e) => e.stopPropagation()}
                className="block max-w-[200px] truncate rounded text-sm font-bold text-text-primary hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
              >
                {s.workoutName}
              </Link>
              <div className="max-w-[200px] truncate text-[11px] text-text-secondary">{s.planName ?? "Buổi tập tự do"}</div>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold tabular-nums text-text-primary">{s.durationMinutes ? `${s.durationMinutes} phút` : "-"}</td>
            <td className="px-4 py-3"><Completion value={s.completionPercent} /></td>
            <td className="px-4 py-3"><FormScoreBadge score={s.formScore} /></td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-bold tabular-nums text-text-primary">
              {s.validReps}
              <span className="font-semibold text-text-secondary"> / {s.totalReps}</span>
            </td>
            <td className="px-4 py-3"><DateCell iso={s.date} /></td>
            <td className="px-4 py-3"><Badges s={s} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Stacked cards for small screens. */
export function SessionCards({ items }: { items: WorkoutSessionSummary[] }) {
  return (
    <ul className="space-y-3">
      {items.map((s, i) => (
        <li key={s.id} className="animate-rise" style={rise(i, 30)}>
          <Link to={sessionHref(s.id)} className="panel-3d panel-3d-interactive block p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <div className="flex items-start gap-3">
              <StudentAvatar name={s.studentName} src={s.studentAvatar} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-text-primary">{s.workoutName}</div>
                <div className="truncate text-xs text-text-secondary">
                  {s.studentName} · {s.planName ?? "Buổi tập tự do"}
                </div>
              </div>
              <ChevronRight size={18} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden />
            </div>
            <div className="mt-3"><Badges s={s} /></div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="well-3d rounded-xl px-2 py-2">
                <dt className="text-[10px] font-bold text-text-secondary">Form Score</dt>
                <dd className="mt-1"><FormScoreBadge score={s.formScore} /></dd>
              </div>
              <div className="well-3d rounded-xl px-2 py-2">
                <dt className="text-[10px] font-bold text-text-secondary">Valid Reps</dt>
                <dd className="mt-1 text-sm font-extrabold tabular-nums text-text-primary">{s.validReps}/{s.totalReps}</dd>
              </div>
              <div className="well-3d rounded-xl px-2 py-2">
                <dt className="text-[10px] font-bold text-text-secondary">Hoàn thành</dt>
                <dd className="mt-1 text-sm font-extrabold tabular-nums text-text-primary">{s.completionPercent}%</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between text-[11px] text-text-secondary">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock size={12} aria-hidden />
                {s.durationMinutes ? `${s.durationMinutes} phút` : "Không tập"}
              </span>
              <span className="tabular-nums">{formatDay(s.date)}, {formatTime(s.date)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
