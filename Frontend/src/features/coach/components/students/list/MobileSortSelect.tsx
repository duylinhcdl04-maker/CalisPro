import { SelectField } from "../../ui";
import type { SortDirection, StudentSortKey } from "../../../types";

const SORT_CHOICES: { value: string; label: string }[] = [
  { value: "", label: "Mặc định (cần chú ý trước)" },
  { value: "name:asc", label: "Tên A đến Z" },
  { value: "fitnessScore:desc", label: "Fitness Score cao nhất" },
  { value: "fitnessScore:asc", label: "Fitness Score thấp nhất" },
  { value: "streak:desc", label: "Chuỗi tập dài nhất" },
  { value: "adherence:asc", label: "Tuân thủ thấp nhất" },
  { value: "lastWorkoutAt:asc", label: "Lâu chưa tập nhất" },
];

interface MobileSortSelectProps {
  sortBy?: StudentSortKey;
  sortDir?: SortDirection;
  onChange: (sortBy: StudentSortKey | undefined, sortDir: SortDirection | undefined) => void;
}

/** Column headers are hidden on small screens, so sorting moves into a select. */
export function MobileSortSelect({ sortBy, sortDir, onChange }: MobileSortSelectProps) {
  const current = sortBy ? `${sortBy}:${sortDir ?? "desc"}` : "";
  const known = SORT_CHOICES.some((c) => c.value === current);
  return (
    <label className="flex flex-col gap-1 md:hidden">
      <span className="text-[11px] font-bold text-text-secondary">Sắp xếp</span>
      <SelectField
        value={current}
        onChange={(e) => {
          const [key, dir] = e.target.value.split(":");
          onChange((key || undefined) as StudentSortKey | undefined, (dir || undefined) as SortDirection | undefined);
        }}
      >
        {!known && <option value={current}>Tuỳ chỉnh</option>}
        {SORT_CHOICES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </SelectField>
    </label>
  );
}
