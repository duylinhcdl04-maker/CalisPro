import { CalendarCheck, Trophy } from "lucide-react";
import { formatDate, formatRelative } from "../../../lib/format";
import type { AdherenceStats, PersonalRecordEntry } from "../../../types";
import { Delta, EmptyState, Panel, ScoreBar } from "../../ui";
import { stagger } from "./detailConfig";

const UNIT_LABEL: Record<PersonalRecordEntry["unit"], string> = { reps: "rep", sec: "giây" };

export function PersonalRecordsPanel({ records }: { records: PersonalRecordEntry[] }) {
  return (
    <Panel title="Kỷ lục cá nhân" description="PR tốt nhất trong khoảng thời gian đã chọn" icon={Trophy} className="h-full">
      {records.length === 0 ? (
        <EmptyState icon={Trophy} title="Chưa có kỷ lục" description="Chưa ghi nhận PR nào trong khoảng này." className="py-8" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {records.map((r, i) => (
            <li key={r.id} className="well-3d animate-rise rounded-[14px] px-4 py-3" style={stagger(i, 40)}>
              <p className="truncate text-xs font-bold text-text-secondary">{r.exerciseName}</p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums leading-none text-text-primary">{r.value}</span>
                <span className="text-xs font-semibold text-text-secondary">{UNIT_LABEL[r.unit]}</span>
                {r.previousValue !== null && <Delta value={r.value - r.previousValue} className="ml-auto" />}
              </p>
              <p className="mt-1.5 text-[11px] text-text-secondary">
                <time dateTime={r.achievedAt} title={formatDate(r.achievedAt)}>
                  {formatRelative(r.achievedAt)}
                </time>
                {r.previousValue !== null && <> · trước đó {r.previousValue}</>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function AdherencePanel({ stats }: { stats: AdherenceStats }) {
  const items = [
    { label: "Buổi hoàn thành", value: `${stats.sessionsCompleted}/${stats.sessionsPlanned}` },
    { label: "Tần suất", value: `${stats.trainingFrequency.toFixed(1)}/tuần` },
    { label: "Chuỗi hiện tại", value: `${stats.currentStreak} ngày` },
    { label: "Chuỗi dài nhất", value: `${stats.longestStreak} ngày` },
  ];
  const recentWeeks = stats.weekly.slice(-6);
  return (
    <Panel title="Tuân thủ tập luyện" description="Buổi hoàn thành so với kế hoạch" icon={CalendarCheck} className="h-full">
      <div className="space-y-5">
        <ScoreBar label="Tỷ lệ tuân thủ" value={stats.adherencePercent} />
        <dl className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.label} className="well-3d rounded-[14px] px-3.5 py-2.5">
              <dt className="text-[11px] font-bold text-text-secondary">{it.label}</dt>
              <dd className="mt-0.5 text-lg font-black tabular-nums text-text-primary">{it.value}</dd>
            </div>
          ))}
        </dl>
        {recentWeeks.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-bold text-text-secondary">Các tuần gần đây</h3>
            <ul className="space-y-2">
              {recentWeeks.map((w) => (
                <li key={w.weekStart} className="flex items-center gap-3 text-xs">
                  <span className="w-12 shrink-0 tabular-nums text-text-secondary">{formatDate(w.weekStart, "dd/MM")}</span>
                  <div className="flex-1" aria-hidden><ScoreBar value={w.completed} max={Math.max(1, w.planned)} showValue={false} /></div>
                  <span className="w-10 shrink-0 text-right font-bold tabular-nums text-text-primary">
                    {w.completed}/{w.planned}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}
