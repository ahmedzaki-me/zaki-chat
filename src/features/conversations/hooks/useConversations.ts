import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ConversationResponse,
  ConversationsListResponse,
} from "@/features/conversations/types/conversation.types";
import {
  getConversation,
  getConversations,
  getMyConversation,
  pinConversation,
  unpinConversation,
} from "@/features/conversations/api/conversation.service";
import {
  syncConversationsToCachedDetails,
  syncConversationToCachedList,
  upsertConversationCaches,
} from "@/features/conversations/cache/conversationCache";

export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
  mine: () => [...conversationKeys.all, "me"] as const,
};

export const useConversation = (id: string | undefined) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: conversationKeys.detail(id ?? ""),
    queryFn: async () => {
      const data = await getConversation(id!);
      syncConversationToCachedList(queryClient, data.conversation);
      return data;
    },
    enabled: !!id,
    initialData: () => {
      if (!id) return undefined;
      const listState = queryClient.getQueryState<ConversationsListResponse>(
        conversationKeys.list(),
      );
      if (!listState || listState.isInvalidated) return undefined;
      const match = listState.data?.conversations.find((c) => c.id === id);
      return match ? { conversation: match } : undefined;
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(conversationKeys.list())?.dataUpdatedAt,
  });
};

export const useConversationQuery = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: conversationKeys.mine(),
    queryFn: () => getMyConversation(),
    enabled: options?.enabled ?? true,
  });

export const useConversationsList = () => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: conversationKeys.list(),
    queryFn: async () => {
      const data = await getConversations();
      syncConversationsToCachedDetails(queryClient, data.conversations);
      return data;
    },
  });
};

export function usePinMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      pinned ? pinConversation(id) : unpinConversation(id),
    meta: { errorMessage: "Could not update pin" },
    onSuccess: (result: ConversationResponse) => {
      upsertConversationCaches(queryClient, result.conversation);
      toast.success(
        result.conversation.pinnedAt
          ? "Conversation pinned"
          : "Conversation unpinned",
      );
    },
  });
}
