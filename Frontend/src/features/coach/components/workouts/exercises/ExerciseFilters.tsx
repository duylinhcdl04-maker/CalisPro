import { Field, SearchInput, SelectField } from "../../ui";
import { DIFFICULTY_LABEL, EQUIPMENT_LABEL, PATTERN_LABEL } from "../../../constants/labels";
import type { Equipment, ExerciseDifficulty, ExerciseFilterParams, MovementPattern } from "../../../types";

interface ExerciseFiltersProps {
  search: string;
  onSearch: (v: string) => void;
  filters: Omit<ExerciseFilterParams, "search">;
  onChange: (next: Omit<ExerciseFilterParams, "search">) => void;
  muscles: string[];
}

const EQUIPMENT = Object.entries(EQUIPMENT_LABEL) as [Equipment, string][];
const DIFFICULTY = Object.entries(DIFFICULTY_LABEL) as [ExerciseDifficulty, string][];
const PATTERNS = Object.entries(PATTERN_LABEL) as [MovementPattern, string][];

/** Search + four library filters. Empty string means "any". */
export function ExerciseFilters({ search, onSearch, filters, onChange, muscles }: ExerciseFiltersProps) {
  return (
    <div className="space-y-3">
      <SearchInput value={search} onChange={onSearch} label="Tìm bài tập" placeholder="Tìm theo tên hoặc nhóm cơ..." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Field label="Nhóm cơ">
          {(id) => (
            <SelectField id={id} value={filters.muscle ?? ""} onChange={(e) => onChange({ ...filters, muscle: e.target.value || undefined })}>
              <option value="">Tất cả</option>
              {muscles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Dụng cụ">
          {(id) => (
            <SelectField id={id} value={filters.equipment ?? ""} onChange={(e) => onChange({ ...filters, equipment: (e.target.value || undefined) as Equipment | undefined })}>
              <option value="">Tất cả</option>
              {EQUIPMENT.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Độ khó">
          {(id) => (
            <SelectField id={id} value={filters.difficulty ?? ""} onChange={(e) => onChange({ ...filters, difficulty: (e.target.value || undefined) as ExerciseDifficulty | undefined })}>
              <option value="">Tất cả</option>
              {DIFFICULTY.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Kiểu chuyển động">
          {(id) => (
            <SelectField id={id} value={filters.pattern ?? ""} onChange={(e) => onChange({ ...filters, pattern: (e.target.value || undefined) as MovementPattern | undefined })}>
              <option value="">Tất cả</option>
              {PATTERNS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </SelectField>
          )}
        </Field>
      </div>
    </div>
  );
}
