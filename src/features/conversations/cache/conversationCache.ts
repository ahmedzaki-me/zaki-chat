import type { QueryClient } from "@tanstack/react-query";
import type { User } from "@/features/auth/types/auth.types";
import type {
  Conversation,
  ConversationResponse,
  ConversationsListResponse,
} from "@/features/conversations/types/conversation.types";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";

const ACCOUNT_QUERY_KEY = ["auth", "me"] as const;

export interface UserAvatarUpdate {
  id: string;
  avatarUrl: string | null;
}

export interface AuthAvatarApi {
  currentUserId?: string;
  updateAvatar: (avatarUrl: string | null) => void;
}

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

function patchConversationAvatar(
  conversation: Conversation,
  id: string,
  avatarUrl: string | null,
): Conversation {
  const nextUser =
    conversation.user?.id === id && conversation.user.avatarUrl !== avatarUrl
      ? { ...conversation.user, avatarUrl }
      : conversation.user;
  const nextOwner =
    conversation.owner &&
    conversation.owner.id === id &&
    conversation.owner.avatarUrl !== avatarUrl
      ? { ...conversation.owner, avatarUrl }
      : conversation.owner;

  if (nextUser === conversation.user && nextOwner === conversation.owner) {
    return conversation;
  }

  const next: Conversation = { ...conversation, user: nextUser };
  if (nextOwner !== conversation.owner) {
    next.owner = nextOwner;
  }
  return next;
}

function patchConversationCacheEntry(
  data: unknown,
  id: string,
  avatarUrl: string | null,
): unknown {
  if (!data || typeof data !== "object") return data;

  if ("conversations" in data && Array.isArray(data.conversations)) {
    const list = data as ConversationsListResponse;
    let changed = false;
    const conversations = list.conversations.map((conversation) => {
      const next = patchConversationAvatar(conversation, id, avatarUrl);
      if (next !== conversation) changed = true;
      return next;
    });
    return changed ? { ...list, conversations } : data;
  }

  if (
    "conversation" in data &&
    data.conversation &&
    typeof data.conversation === "object"
  ) {
    const detail = data as ConversationResponse;
    const next = patchConversationAvatar(detail.conversation, id, avatarUrl);
    return next !== detail.conversation
      ? { ...detail, conversation: next }
      : data;
  }

  return data;
}

export function applyUserAvatarUpdate(
  queryClient: QueryClient,
  { id, avatarUrl }: UserAvatarUpdate,
  authApi?: AuthAvatarApi,
) {
  if (!id) return;

  if (authApi && authApi.currentUserId === id) {
    authApi.updateAvatar(avatarUrl);
    const cachedAccount = queryClient.getQueryData<{ user: User }>(
      ACCOUNT_QUERY_KEY,
    );
    if (
      cachedAccount &&
      cachedAccount.user.id === id &&
      cachedAccount.user.avatarUrl !== avatarUrl
    ) {
      queryClient.setQueryData<{ user: User }>(ACCOUNT_QUERY_KEY, {
        ...cachedAccount,
        user: { ...cachedAccount.user, avatarUrl },
      });
    }
  }

  for (const [queryKey, data] of queryClient.getQueriesData<unknown>({
    queryKey: conversationKeys.all,
  })) {
    const next = patchConversationCacheEntry(data, id, avatarUrl);
    if (next !== data) {
      queryClient.setQueryData(queryKey, next);
    }
  }
}
