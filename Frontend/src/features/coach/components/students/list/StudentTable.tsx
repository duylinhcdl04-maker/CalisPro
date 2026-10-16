import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import type { SortDirection, Student, StudentSortKey } from "../../../types";
import { COLUMNS, type ColumnDef, type ColumnId } from "./columns";
import { StudentCell, StudentIdentity } from "./StudentCells";
import { StudentRowActions } from "./StudentRowActions";
import { SelectBox } from "./SelectBox";

interface SortState {
  sortBy?: StudentSortKey;
  sortDir?: SortDirection;
}

function SortHeader({ label, sortKey, sort, onSort, align }: { label: string; sortKey: StudentSortKey; sort: SortState; onSort: (k: StudentSortKey) => void; align?: ColumnDef["align"] }) {
  const active = sort.sortBy === sortKey;
  const Icon = !active ? ArrowUpDown : sort.sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (sort.sortDir === "asc" ? "ascending" : "descending") : "none"} className={cn("px-3 py-3", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wide transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent",
          active && "text-accent-strong dark:text-accent"
        )}
      >
        {label}
        <Icon size={12} aria-hidden className={active ? "" : "opacity-50"} />
      </button>
    </th>
  );
}

interface StudentTableProps {
  students: Student[];
  isVisible: (id: ColumnId) => boolean;
  sort: SortState;
  onSort: (key: StudentSortKey) => void;
  selected: ReadonlySet<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  dimmed?: boolean;
}

export function StudentTable({ students, isVisible, sort, onSort, selected, onToggleSelect, onToggleAll, dimmed }: StudentTableProps) {
  const navigate = useNavigate();
  const columns = COLUMNS.filter((c) => isVisible(c.id));
  const allSelected = students.length > 0 && students.every((s) => selected.has(s.id));
  const someSelected = !allSelected && students.some((s) => selected.has(s.id));

  return (
    <div className={cn("overflow-x-auto scrollbar-thin transition-opacity", dimmed && "opacity-60")}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">Danh sách học viên. Nhấn vào tiêu đề cột để sắp xếp.</caption>
        <thead>
          <tr className="border-b border-border/70 text-[11px] text-text-secondary">
            <th scope="col" className="w-10 py-3 pl-5 pr-1">
              <SelectBox checked={allSelected} indeterminate={someSelected} onChange={onToggleAll} label="Chọn tất cả học viên trên trang" />
            </th>
            <SortHeader label="Học viên" sortKey="name" sort={sort} onSort={onSort} />
            {columns.map((c) =>
              c.sortKey ? (
                <SortHeader key={c.id} label={c.label} sortKey={c.sortKey} sort={sort} onSort={onSort} align={c.align} />
              ) : (
                <th key={c.id} scope="col" className="px-3 py-3 font-bold uppercase tracking-wide">
                  {c.label}
                </th>
              )
            )}
            <th scope="col" className="py-3 pl-3 pr-5 text-right font-bold uppercase tracking-wide">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const isSelected = selected.has(s.id);
            return (
              <tr
                key={s.id}
                onClick={() => navigate(`/coach/students/${s.id}`)}
                className={cn(
                  "cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-accent-soft/40",
                  isSelected && "bg-accent-soft/50"
                )}
              >
                <td className="py-3 pl-5 pr-1" onClick={(e) => e.stopPropagation()}>
                  <SelectBox checked={isSelected} onChange={() => onToggleSelect(s.id)} label={`Chọn ${s.name}`} />
                </td>
                <th scope="row" className="max-w-[240px] px-3 py-3 font-normal">
                  <StudentIdentity student={s} />
                </th>
                {columns.map((c) => (
                  <td key={c.id} className={cn("px-3 py-3", c.align === "right" && "text-right")}>
                    <StudentCell column={c.id} student={s} />
                  </td>
                ))}
                <td className="py-3 pl-3 pr-5">
                  <StudentRowActions student={s} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
