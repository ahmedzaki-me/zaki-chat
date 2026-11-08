import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessages } from "@/features/chat/api/messages.service";

import { PAGE_SIZE } from "@/core/config/constants";

export const messagesKeys = {
  messages: (conversationId: string) => ["messages", conversationId],
};

export const useMessages = (
  conversationId: string,
  options?: { enabled?: boolean },
) =>
  useInfiniteQuery({
    queryKey: messagesKeys.messages(conversationId),

    queryFn: ({ pageParam }) =>
      getMessages(conversationId, {
        before: pageParam ?? undefined,
        limit: PAGE_SIZE,
      }),

    initialPageParam: null as string | null,

    getNextPageParam: (lastPage) =>
      lastPage.nextCursor ?? undefined,

    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
    ...options,
  });
