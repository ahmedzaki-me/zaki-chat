import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getMessages, getProfiles } from "@/lib/supabase";
import { PAGE_SIZE } from "@/lib/supabase";

export const messagesKeys = {
  messages: (conversationId: string) => ["messages", conversationId],
  profiles: ["profiles"],
};

export const useMessages = (
  conversationId: string,
  options?: { enabled?: boolean },
) =>
  useInfiniteQuery({
    queryKey: messagesKeys.messages(conversationId),
    queryFn: ({ pageParam }) => getMessages(conversationId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    enabled: !!conversationId,
    ...options,
  });

export const useProfiles = () => useQuery({
  queryKey: messagesKeys.profiles,
  queryFn: getProfiles,
});