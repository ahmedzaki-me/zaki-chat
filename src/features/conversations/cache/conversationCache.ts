import type { QueryClient } from "@tanstack/react-query";
import type {
  Conversation,
  ConversationResponse,
  ConversationsListResponse,
} from "@/features/conversations/types/conversation.types";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";

export function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aPinned = !!a.pinnedAt;
    const bPinned = !!b.pinnedAt;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const timeA = new Date(a.lastMessageAt ?? a.createdAt).getTime();
    const timeB = new Date(b.lastMessageAt ?? b.createdAt).getTime();
    return timeB - timeA;
  });
}

export function upsertConversationList(
  old: ConversationsListResponse | undefined,
  conversation: Conversation,
): ConversationsListResponse {
  if (!old) return { conversations: [conversation] };
  const filtered = old.conversations.filter((item) => item.id !== conversation.id);
  const updatedList = sortConversations([conversation, ...filtered]);
  return { conversations: updatedList };
}

export function upsertConversationDetail(
  old: ConversationResponse | undefined,
  conversation: Conversation,
): ConversationResponse {
  return {
    conversation: old
      ? { ...old.conversation, ...conversation }
      : conversation,
  };
}

export function upsertConversationCaches(
  queryClient: QueryClient,
  conversation: Conversation,
) {
  queryClient.setQueryData<ConversationsListResponse>(
    conversationKeys.list(),
    (old) => upsertConversationList(old, conversation),
  );
  queryClient.setQueryData<ConversationResponse>(
    conversationKeys.detail(conversation.id),
    (old) => upsertConversationDetail(old, conversation),
  );
  queryClient.setQueryData<ConversationResponse>(
    conversationKeys.mine(),
    (old) =>
      old?.conversation.id === conversation.id
        ? upsertConversationDetail(old, conversation)
        : old,
  );
}
