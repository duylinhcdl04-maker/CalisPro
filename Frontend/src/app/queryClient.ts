import { QueryClient } from "@tanstack/react-query";

/** Status from either a MockApiError or an axios error. */
function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const e = error as { status?: number; response?: { status?: number } };
  return e.status ?? e.response?.status;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Retry transient failures once; a 4xx (e.g. 404 not found) will not change on retry.
      retry: (failureCount, error) => {
        const status = statusOf(error);
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});
