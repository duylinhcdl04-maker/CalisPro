import { useMemo, useState } from "react";
import { Check, Dumbbell, SearchX } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Button3D, EmptyState, ErrorState, Modal, Skeleton } from "../../ui";
import { DIFFICULTY_LABEL, PATTERN_LABEL } from "../../../constants/labels";
import { useDebouncedValue, useExercises } from "../../../hooks";
import type { ExerciseFilterParams, ExerciseLibraryItem } from "../../../types";
import { ExerciseFilters } from "./ExerciseFilters";
import { ExercisePreview } from "./ExercisePreview";

interface ExerciseSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  onAdd: (item: ExerciseLibraryItem) => void;
}

type Filters = Omit<ExerciseFilterParams, "search">;

/** Library browser: filter, preview and add several exercises without closing. */
export function ExerciseSelectorModal({ open, onOpenChange, sessionTitle, onAdd }: ExerciseSelectorModalProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, number>>({});
  const debounced = useDebouncedValue(search.trim(), 250);

  const list = useExercises({ ...filters, search: debounced || undefined });
  const all = useExercises({});
  const muscles = useMemo(
    () => Array.from(new Set((all.data ?? []).flatMap((e) => [...e.primaryMuscles, ...e.secondaryMuscles]))).sort((a, b) => a.localeCompare(b, "vi")),
    [all.data]
  );
  const selected = list.data?.find((e) => e.id === selectedId) ?? all.data?.find((e) => e.id === selectedId) ?? null;
  const totalAdded = Object.values(added).reduce((a, b) => a + b, 0);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setAdded({});
      setSelectedId(null);
    }
    onOpenChange(next);
  }

  function add(item: ExerciseLibraryItem) {
    onAdd(item);
    setAdded((a) => ({ ...a, [item.id]: (a[item.id] ?? 0) + 1 }));
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      size="xl"
      title="Thư viện bài tập"
      description={`Thêm bài tập vào "${sessionTitle}". Có thể thêm nhiều bài trước khi đóng.`}
      footer={
        <>
          <span className="mr-auto text-xs font-semibold text-text-secondary" aria-live="polite">
            {totalAdded > 0 ? `Đã thêm ${totalAdded} bài tập` : "Chưa thêm bài tập nào"}
          </span>
          <Button3D variant="primary" onClick={() => handleOpenChange(false)}>Xong</Button3D>
        </>
      }
    >
      <ExerciseFilters search={search} onSearch={setSearch} filters={filters} onChange={setFilters} muscles={muscles} />
      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="order-2 md:order-1">
          {list.isLoading ? (
            <div className="grid gap-2.5 sm:grid-cols-2" aria-busy="true" aria-label="Đang tải bài tập">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-[72px] w-full" />
              ))}
            </div>
          ) : list.isError ? (
            <ErrorState onRetry={() => list.refetch()} retrying={list.isFetching} />
          ) : !list.data?.length ? (
            <EmptyState icon={SearchX} title="Không có bài tập phù hợp" description="Thử bỏ bớt bộ lọc hoặc đổi từ khoá." />
          ) : (
            <ul className="grid gap-2.5 sm:grid-cols-2" aria-label="Kết quả bài tập">
              {list.data.map((ex) => {
                const active = ex.id === selectedId;
                return (
                  <li key={ex.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(ex.id)}
                      aria-pressed={active}
                      className={cn(
                        "panel-3d panel-3d-interactive flex w-full items-center gap-3 p-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        active && "border-accent ring-2 ring-accent/30"
                      )}
                    >
                      <span className="well-3d grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-text-secondary">
                        {ex.imageUrl ? <img src={ex.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Dumbbell size={18} aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold text-text-primary">{ex.name}</span>
                        <span className="block truncate text-[11px] font-semibold text-text-secondary">
                          {PATTERN_LABEL[ex.movementPattern]} · {DIFFICULTY_LABEL[ex.difficulty]} · {ex.primaryMuscles.join(", ")}
                        </span>
                      </span>
                      {added[ex.id] ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Check size={11} aria-hidden />
                          {added[ex.id]}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="order-1 md:order-2 md:sticky md:top-0 md:self-start">
          <ExercisePreview exercise={selected} addedCount={selected ? added[selected.id] ?? 0 : 0} onAdd={() => selected && add(selected)} />
        </div>
      </div>
    </Modal>
  );
}
