import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../../hooks";
import type { SortDirection, StudentListParams, StudentSortKey } from "../../../types";
import {
  FREQUENCY_OPTIONS,
  GOAL_OPTIONS,
  LAST_ACTIVE_OPTIONS,
  LEVEL_OPTIONS,
  PERFORMANCE_OPTIONS,
  SORT_DIRS,
  SORT_KEYS,
  STATUS_OPTIONS,
  pick,
  values,
} from "./filterOptions";

export const PAGE_SIZE = 10;

/** URL keys for filters; `page`, `sortBy`, `sortDir`, `search` are handled separately. */
export type FilterKey = "level" | "goal" | "status" | "frequency" | "performance" | "lastActive" | "needsAttention";
const FILTER_KEYS: FilterKey[] = ["level", "goal", "status", "frequency", "performance", "lastActive", "needsAttention"];

/**
 * The URL is the single source of truth for filters, sort and page so that
 * dashboard KPI links (?needsAttention=true, ?lastActive=7D) and shared links work.
 */
export function useStudentListState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          if (resetPage) next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Push the debounced search into the URL (only when it actually differs, so ?page survives mount).
  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    update((p) => {
      if (debouncedSearch) p.set("search", debouncedSearch);
      else p.delete("search");
    });
    // Only react to the debounced input; urlSearch is read as the latest value.
  }, [debouncedSearch]);

  const params = useMemo<StudentListParams>(() => {
    const page = Number(searchParams.get("page"));
    return {
      search: urlSearch || undefined,
      level: pick(searchParams.get("level"), values(LEVEL_OPTIONS)),
      goal: pick(searchParams.get("goal"), values(GOAL_OPTIONS)),
      status: pick(searchParams.get("status"), values(STATUS_OPTIONS)),
      frequency: pick(searchParams.get("frequency"), values(FREQUENCY_OPTIONS)),
      performance: pick(searchParams.get("performance"), values(PERFORMANCE_OPTIONS)),
      lastActive: pick(searchParams.get("lastActive"), values(LAST_ACTIVE_OPTIONS)),
      needsAttention: searchParams.get("needsAttention") === "true" || undefined,
      sortBy: pick(searchParams.get("sortBy"), SORT_KEYS),
      sortDir: pick(searchParams.get("sortDir"), SORT_DIRS),
      page: Number.isInteger(page) && page > 0 ? page : 1,
      pageSize: PAGE_SIZE,
    };
  }, [searchParams, urlSearch]);

  const setFilter = useCallback(
    (key: FilterKey, value: string | boolean | undefined) => {
      update((p) => {
        if (value === undefined || value === "" || value === false) p.delete(key);
        else p.set(key, String(value));
      });
    },
    [update]
  );

  /** Cycle: new column starts desc (numbers) or asc (name); same column flips; third click clears. */
  const toggleSort = useCallback(
    (key: StudentSortKey) => {
      update((p) => {
        const initial = key === "name" ? "asc" : "desc";
        if (p.get("sortBy") !== key) {
          p.set("sortBy", key);
          p.set("sortDir", initial);
        } else if (p.get("sortDir") === initial) {
          p.set("sortDir", initial === "asc" ? "desc" : "asc");
        } else {
          p.delete("sortBy");
          p.delete("sortDir");
        }
      });
    },
    [update]
  );

  const setSort = useCallback(
    (sortBy: StudentSortKey | undefined, sortDir: SortDirection | undefined) => {
      update((p) => {
        if (sortBy) p.set("sortBy", sortBy);
        else p.delete("sortBy");
        if (sortBy && sortDir) p.set("sortDir", sortDir);
        else p.delete("sortDir");
      });
    },
    [update]
  );

  const setPage = useCallback(
    (page: number) => update((p) => (page > 1 ? p.set("page", String(page)) : p.delete("page")), false),
    [update]
  );

  const activeFilterCount = FILTER_KEYS.filter((k) => searchParams.has(k)).length + (urlSearch ? 1 : 0);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    update((p) => {
      FILTER_KEYS.forEach((k) => p.delete(k));
      p.delete("search");
    });
  }, [update]);

  return { params, searchInput, setSearchInput, setFilter, toggleSort, setSort, setPage, clearFilters, activeFilterCount };
}

export type StudentListState = ReturnType<typeof useStudentListState>;
