import { Link, useNavigate } from "react-router-dom";
import { Clock, Dumbbell } from "lucide-react";
import { Button3D, EmptyState, Panel, StatusBadge, StudentAvatar } from "../ui";
import { MiniMeter } from "./MiniMeter";
import { formatDay, scoreTone } from "../../lib/format";
import type { WorkoutSessionSummary } from "../../types";

function FormScore({ score }: { score: number | null }) {
  return (
    <StatusBadge tone={scoreTone(score)} className="tabular-nums">
      {score === null ? "Chưa có" : `${score}/100`}
    </StatusBadge>
  );
}

function Completion({ value }: { value: number }) {
  return <MiniMeter value={value} label={`Hoàn thành ${value}%`} className="w-32" />;
}

export function RecentSessionsPanel({ sessions }: { sessions: WorkoutSessionSummary[] }) {
  const navigate = useNavigate();
  const viewAll = (
    <Link to="/coach/sessions" className="rounded-lg text-xs font-bold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent dark:text-accent">
      Xem tất cả
    </Link>
  );

  return (
    <Panel title="Buổi tập gần đây" description="Kết quả và điểm form từ AI Motion" icon={Dumbbell} actions={viewAll} bodyClassName="px-0 sm:px-0 pb-3 sm:pb-3">
      {sessions.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Chưa có buổi tập nào"
          description="Khi học viên hoàn thành buổi tập, kết quả sẽ xuất hiện ở đây."
          action={
            <Button3D asChild size="sm">
              <Link to="/coach/plans">Xem giáo án</Link>
            </Button3D>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Buổi tập gần đây của học viên</caption>
              <thead>
                <tr className="border-b border-border/70 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="px-6 py-2.5 font-bold">Học viên</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Bài tập</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Hoàn thành</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Form</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-bold">Thời lượng</th>
                  <th scope="col" className="px-6 py-2.5 text-right font-bold">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/coach/sessions/${s.id}`)}
                    className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-accent-soft/40"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <StudentAvatar name={s.studentName} src={s.studentAvatar} size="xs" />
                        <span className="truncate font-bold text-text-primary">{s.studentName}</span>
                      </div>
                    </td>
                    <td className="max-w-[180px] px-3 py-3">
                      <Link
                        to={`/coach/sessions/${s.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate rounded font-semibold text-text-primary hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent dark:hover:text-accent"
                      >
                        {s.workoutName}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <Completion value={s.completionPercent} />
                    </td>
                    <td className="px-3 py-3">
                      <FormScore score={s.formScore} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-secondary">{s.durationMinutes} phút</td>
                    <td className="px-6 py-3 text-right tabular-nums text-text-secondary">
                      <time dateTime={s.date}>{formatDay(s.date)}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2.5 px-4 md:hidden">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/coach/sessions/${s.id}`}
                  className="block rounded-[16px] border border-border/70 bg-surface-elevated/60 p-3.5 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="flex items-center gap-2.5">
                    <StudentAvatar name={s.studentName} src={s.studentAvatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text-primary">{s.studentName}</p>
                      <p className="truncate text-xs text-text-secondary">{s.workoutName}</p>
                    </div>
                    <FormScore score={s.formScore} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Completion value={s.completionPercent} />
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-text-secondary">
                      <Clock size={12} aria-hidden />
                      {s.durationMinutes} phút, {formatDay(s.date)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
