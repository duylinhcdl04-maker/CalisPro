import { useCallback, useState } from "react";
import type { StudentSortKey } from "../../../types";

/** Optional columns. "student" and "actions" are always visible. */
export type ColumnId = "level" | "goal" | "fitnessScore" | "streak" | "adherence" | "lastWorkoutAt" | "status";

export interface ColumnDef {
  id: ColumnId;
  label: string;
  sortKey?: StudentSortKey;
  align?: "left" | "right" | "center";
}

export const COLUMNS: ColumnDef[] = [
  { id: "level", label: "Cấp độ", sortKey: "level" },
  { id: "goal", label: "Mục tiêu" },
  { id: "fitnessScore", label: "Fitness Score", sortKey: "fitnessScore" },
  { id: "streak", label: "Chuỗi tập", sortKey: "streak", align: "right" },
  { id: "adherence", label: "Tuân thủ", sortKey: "adherence" },
  { id: "lastWorkoutAt", label: "Buổi tập gần nhất", sortKey: "lastWorkoutAt" },
  { id: "status", label: "Trạng thái" },
];

const STORAGE_KEY = "coach.students.columns";
const DEFAULT_VISIBLE: ColumnId[] = COLUMNS.map((c) => c.id);

function readStored(): ColumnId[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_VISIBLE;
    return DEFAULT_VISIBLE.filter((id) => parsed.includes(id));
  } catch {
    return DEFAULT_VISIBLE;
  }
}

/** Column visibility, remembered per browser (a viewer convenience, safe to lose). */
export function useColumnVisibility() {
  const [visible, setVisible] = useState<ColumnId[]>(readStored);

  const persist = (next: ColumnId[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: keep in memory only */
    }
    return next;
  };

  const toggle = useCallback((id: ColumnId) => {
    setVisible((prev) => persist(prev.includes(id) ? prev.filter((c) => c !== id) : DEFAULT_VISIBLE.filter((c) => c === id || prev.includes(c))));
  }, []);

  const reset = useCallback(() => setVisible(persist(DEFAULT_VISIBLE)), []);

  return { visible, isVisible: (id: ColumnId) => visible.includes(id), toggle, reset };
}
