import { Trophy } from "lucide-react";
import { formatRelative } from "../../lib/format";
import type { PersonalRecordEntry } from "../../types";
import { Delta, EmptyState, Panel } from "../ui";
import { formatRecord, recordDelta } from "./performanceUtils";

interface PersonalRecordsPanelProps {
  records: PersonalRecordEntry[];
  cohort: boolean;
}

function RecordCard({ r, cohort, index }: { r: PersonalRecordEntry; cohort: boolean; index: number }) {
  const shown = formatRecord(r);
  const delta = recordDelta(r);
  return (
    <li className="well-3d animate-rise rounded-[18px] p-4" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-extrabold text-text-primary">{r.exerciseName}</h3>
        {delta !== null && delta !== 0 && <Delta value={delta} suffix={r.unit === "sec" ? "s" : ""} />}
      </div>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-black tabular-nums leading-none tracking-tight text-text-primary">{shown.value}</span>
        <span className="text-xs font-bold text-text-secondary">{shown.unit}</span>
      </p>
      <p className="mt-2 truncate text-[11px] text-text-secondary">
        {cohort && r.holderName ? <span className="font-bold text-text-primary">{r.holderName}</span> : null}
        {cohort && r.holderName ? " · " : null}
        {delta === 0 ? "Chưa phá kỷ lục cũ · " : null}
        {formatRelative(r.achievedAt)}
      </p>
    </li>
  );
}

export function PersonalRecordsPanel({ records, cohort }: PersonalRecordsPanelProps) {
  return (
    <Panel
      title="Kỷ lục cá nhân"
      description={cohort ? "Thành tích tốt nhất trong nhóm và người giữ kỷ lục" : "Thành tích tốt nhất và mức tăng so với kỷ lục trước"}
      icon={Trophy}
      className="animate-rise"
    >
      {records.length === 0 ? (
        <EmptyState icon={Trophy} title="Chưa có kỷ lục nào" />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {records.map((r, i) => (
            <RecordCard key={r.id} r={r} cohort={cohort} index={i} />
          ))}
        </ul>
      )}
    </Panel>
  );
}
