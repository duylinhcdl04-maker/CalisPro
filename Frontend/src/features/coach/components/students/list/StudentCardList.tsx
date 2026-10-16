import { Link } from "react-router-dom";
import { cn } from "../../../../../lib/utils";
import { StatusBadge, StudentAvatar } from "../../ui";
import { GOAL_LABEL, LEVEL_LABEL, STUDENT_STATUS } from "../../../constants/labels";
import { formatRelative } from "../../../lib/format";
import type { Student } from "../../../types";
import { AdherenceCell, FitnessScoreCell, StreakCell } from "./StudentCells";
import { StudentRowActions } from "./StudentRowActions";
import { SelectBox } from "./SelectBox";

interface StudentCardListProps {
  students: Student[];
  selected: ReadonlySet<string>;
  onToggleSelect: (id: string) => void;
  dimmed?: boolean;
}

/** Below md the table becomes cards. The name is a stretched link; controls sit above it. */
export function StudentCardList({ students, selected, onToggleSelect, dimmed }: StudentCardListProps) {
  return (
    <ul className={cn("space-y-3 transition-opacity", dimmed && "opacity-60")} aria-label="Danh sách học viên">
      {students.map((s) => {
        const isSelected = selected.has(s.id);
        return (
          <li
            key={s.id}
            className={cn(
              "relative rounded-[18px] border bg-surface-elevated/60 p-4 transition-colors focus-within:border-accent/50",
              isSelected ? "border-accent/50 bg-accent-soft/50" : "border-border/70"
            )}
          >
            <div className="flex items-start gap-3">
              <StudentAvatar name={s.name} src={s.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/coach/students/${s.id}`}
                  className="block truncate text-sm font-extrabold text-text-primary after:absolute after:inset-0 after:rounded-[18px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent"
                >
                  {s.name}
                </Link>
                <p className="truncate text-[11px] text-text-secondary">
                  <span className="tabular-nums">{s.code}</span>, {LEVEL_LABEL[s.level]}, {GOAL_LABEL[s.goal]}
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={STUDENT_STATUS[s.status]} />
                </div>
              </div>
              <div className="relative z-10">
                <SelectBox checked={isSelected} onChange={() => onToggleSelect(s.id)} label={`Chọn ${s.name}`} />
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="mb-1 font-semibold text-text-secondary">Fitness Score</dt>
                <dd>
                  <FitnessScoreCell student={s} />
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-semibold text-text-secondary">Chuỗi tập</dt>
                <dd className="pt-2.5">
                  <StreakCell streak={s.streak} />
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-semibold text-text-secondary">Tuân thủ</dt>
                <dd>
                  <AdherenceCell value={s.adherence} />
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-semibold text-text-secondary">Buổi tập gần nhất</dt>
                <dd className="text-sm text-text-primary">{formatRelative(s.lastWorkoutAt)}</dd>
              </div>
            </dl>

            <div className="relative z-10 mt-3 border-t border-border/60 pt-3">
              <StudentRowActions student={s} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
