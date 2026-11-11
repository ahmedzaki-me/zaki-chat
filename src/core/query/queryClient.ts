import { QueryClient, QueryCache, MutationCache, type Query } from "@tanstack/react-query";
import { toast } from "sonner";
import { getProblemMessage } from "@/shared/lib/problemDetails";
import axios from "axios";

export const APP_BOOT_TIME = Date.now();

function isStalePersistedQuery(query: Query, cutoffMs: number): boolean {
  return (
    query.state.dataUpdatedAt > 0 &&
    query.state.dataUpdatedAt < cutoffMs &&
    query.state.fetchStatus !== "fetching" &&
    !query.state.isInvalidated
  );
}

/**
 * Invalidate persisted/pre-connection chat queries without causing duplicate fetches
 * for fresh requests started in the current runtime.
 */
export function invalidateStaleChatQueries(
  client: QueryClient,
  cutoffMs = APP_BOOT_TIME,
): void {
  void client.invalidateQueries({
    queryKey: ["conversations"],
    predicate: (query) => isStalePersistedQuery(query, cutoffMs),
  });
  void client.invalidateQueries({
    queryKey: ["messages"],
    predicate: (query) => isStalePersistedQuery(query, cutoffMs),
  });
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      suppressToast?: boolean;
      errorMessage?: string;
    };
    queryMeta: {
      suppressToast?: boolean;
      errorMessage?: string;
    };
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.suppressToast) return;
      // Do not toast expected query errors (handled by route guards / layout skeletons / empty states)
      if (axios.isAxiosError(error) && [401, 403, 404].includes(error.response?.status ?? 0)) {
        return;
      }
      toast.error(getProblemMessage(error, query.meta?.errorMessage));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Do not toast if the mutation handles errors internally (e.g. form fields)
      if (mutation.meta?.suppressToast) return;
      toast.error(getProblemMessage(error, mutation.meta?.errorMessage));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: (failureCount, error) => {
        // Never retry 4xx client errors (401, 403, 404, 422, etc.)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      networkMode: "online",
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: "online",
    },
  },
});
