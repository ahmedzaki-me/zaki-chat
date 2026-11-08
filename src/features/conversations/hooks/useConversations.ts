import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ConversationResponse } from "@/features/conversations/types/conversation.types";
import {
  getConversation,
  getConversations,
  getMyConversation,
  pinConversation,
  unpinConversation,
} from "@/features/conversations/api/conversation.service";
import { upsertConversationCaches } from "@/features/conversations/cache/conversationCache";

export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
  mine: () => [...conversationKeys.all, "me"] as const,
};

export const useConversation = (id: string | undefined) =>
  useQuery({
    queryKey: conversationKeys.detail(id ?? ""),
    queryFn: () => getConversation(id!),
    enabled: !!id,
  });

export const useConversationQuery = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: conversationKeys.mine(),
    queryFn: () => getMyConversation(),
    enabled: options?.enabled ?? true,
  });

export const useConversationsList = () =>
  useQuery({
    queryKey: conversationKeys.list(),
    queryFn: getConversations,
  });

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
