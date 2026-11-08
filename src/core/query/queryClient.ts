import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { getProblemMessage } from "@/shared/lib/problemDetails";
import axios from "axios";

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
