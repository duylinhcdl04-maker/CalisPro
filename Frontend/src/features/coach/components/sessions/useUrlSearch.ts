import { useEffect, useState } from "react";
import type { SetURLSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../hooks";

/**
 * Keeps a text input in local state and writes the debounced value to `?key=`.
 * Resets `?page` whenever the search term actually changes.
 */
export function useUrlSearch(params: URLSearchParams, setParams: SetURLSearchParams, key = "q") {
  const urlValue = params.get(key) ?? "";
  const [input, setInput] = useState(urlValue);
  const debounced = useDebouncedValue(input.trim(), 300);

  useEffect(() => {
    if (debounced === urlValue) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debounced) next.set(key, debounced);
        else next.delete(key);
        next.delete("page");
        return next;
      },
      { replace: true }
    );
    // urlValue intentionally omitted: only react to user typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return { input, setInput, value: urlValue };
}
