import type { QueryClient } from "@tanstack/react-query";
import type { Conversation, ConversationResponse, ConversationsListResponse } from "@/features/conversations/types/conversation.types";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";

export function upsertConversationList(old: ConversationsListResponse | undefined, conversation: Conversation): ConversationsListResponse {
  if (!old) return { conversations: [conversation] };
  const exists = old.conversations.some((item) => item.id === conversation.id);
  return { conversations: exists ? old.conversations.map((item) => item.id === conversation.id ? conversation : item) : [...old.conversations, conversation] };
}

export function upsertConversationDetail(old: ConversationResponse | undefined, conversation: Conversation): ConversationResponse {
  return { conversation: old ? { ...old.conversation, ...conversation } : conversation };
}

export function upsertConversationCaches(queryClient: QueryClient, conversation: Conversation) {
  queryClient.setQueryData<ConversationsListResponse>(conversationKeys.list(), (old) => upsertConversationList(old, conversation));
  queryClient.setQueryData<ConversationResponse>(conversationKeys.detail(conversation.id), (old) => upsertConversationDetail(old, conversation));
  queryClient.setQueryData<ConversationResponse>(conversationKeys.mine(), (old) => old?.conversation.id === conversation.id ? upsertConversationDetail(old, conversation) : old);
}
