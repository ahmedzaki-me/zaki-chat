import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMessages, messagesKeys } from "@/features/chat/hooks/useMessagesQuery";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";
import type { Message, MessagesResponse, PendingMessage } from "@/features/chat/types/chat.types";
import type { Conversation, ConversationResponse } from "@/features/conversations/types/conversation.types";
import { emitWithAck, socket } from "@/core/socket/socket";
import { clearMessages, patchMessage, removeMessage, upsertMessage } from "@/features/chat/cache/messageCache";
import { upsertConversationCaches, upsertConversationDetail } from "@/features/conversations/cache/conversationCache";
import { playOutgoingSound } from "@/shared/lib/sounds";
import { sendMediaMessage, type MediaMessagePayload, interceptPendingMediaMessage } from "@/features/chat/api/mediaMessage.api";
import { remove as removeCachedMedia } from "@/features/chat/cache/mediaCache";
import { canUseChatConnection } from "@/shared/lib/offlineGuard";
import { getClientIdForServerId, linkServerIdToClientId } from "@/features/chat/utils/clientMessageMap";

export function useChatMessages(conversationId: string | undefined, currentUserId: string | undefined) {
  const queryClient = useQueryClient();
  const key = useMemo(() => messagesKeys.messages(conversationId ?? ""), [conversationId]);
  const query = useMessages(conversationId ?? "", { enabled: !!conversationId });
  const fetchNextPage = query.fetchNextPage;
  const hasNextPage = query.hasNextPage;
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const [missingIds, setMissingIds] = useState<Set<string>>(() => new Set());
  const creationTime = useRef(0);

  const confirmedMessages = useMemo(() => {
    const pagedMessages = query.data?.pages
      .flatMap((page) => page.messages)
      .reverse() ?? [];
    const uniqueMessages = [
      ...new Map(pagedMessages.map((message) => [message.id, message])).values(),
    ];
    return uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [query.data]);

  const messages = useMemo(() => {
    return [...confirmedMessages, ...pending];
  }, [confirmedMessages, pending]);

  const messagesById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );
  const messagesByIdRef = useRef(messagesById);
  messagesByIdRef.current = messagesById;
  const missingIdsRef = useRef(missingIds);
  missingIdsRef.current = missingIds;

  const updateCache = useCallback((fn: (data: InfiniteData<MessagesResponse> | undefined) => InfiniteData<MessagesResponse> | undefined) => {
    queryClient.setQueryData<InfiniteData<MessagesResponse>>(key, fn);
  }, [key, queryClient]);

  const transmit = useCallback(async (item: PendingMessage) => {
    if (!socket.connected || !conversationId) {
      toast.error("You are offline. Connect to the internet to send messages.");
      setPending((old) => old.filter((message) => message.clientId !== item.clientId));
      return;
    }
    try {
      const result = await emitWithAck<{ message: Message }>("message:send", {
        conversationId,
        text: item.text ?? "",
        replyToId: item.replyToId ?? null,
      });
      linkServerIdToClientId(result.message.id, item.clientId);
      setPending((old) => old.filter((message) => message.clientId !== item.clientId));
      updateCache((data) => upsertMessage(data, result.message));
    } catch (error) {
      if (!pendingRef.current.some((message) => message.clientId === item.clientId)) {
        return;
      }
      setPending((old) =>
        old.map((message) =>
          message.clientId === item.clientId ? { ...message, status: "error" } : message,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Message could not be sent");
    }
  }, [conversationId, updateCache]);

  const send = useCallback((text: string, replyToId?: string | null): boolean => {
    if (!canUseChatConnection(true)) return false;
    const clientId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const timestamp = Math.max(Date.now(), creationTime.current + 1);
    creationTime.current = timestamp;
    const item: PendingMessage = {
      id: `tmp-${clientId}`,
      clientId,
      conversationId: conversationId ?? "",
      senderId: currentUserId ?? "",
      type: "text",
      createdAt: new Date(timestamp).toISOString(),
      text,
      media: null,
      reactions: [],
      editedAt: null,
      deletedAt: null,
      replyToId: replyToId ?? null,
      status: "sending",
    };
    setPending((old) => [...old, item]);
    void playOutgoingSound();
    void transmit(item);
    return true;
  }, [conversationId, currentUserId, transmit]);

  const retry = useCallback((item: PendingMessage) => {
    if (!canUseChatConnection(true)) return;
    const sending = { ...item, status: "sending" as const };
    setPending((old) => old.map((message) => message.clientId === item.clientId ? sending : message));
    void transmit(sending);
  }, [transmit]);

  const sendMedia = useCallback(async (payload: MediaMessagePayload) => {
    if (!canUseChatConnection(true)) throw new Error("You are offline. Connect to the internet to send messages.");
    const { message } = await sendMediaMessage(payload);
    void playOutgoingSound();
    return message;
  }, []);

  const acceptMediaMessage = useCallback((message: Message) => {
    updateCache((data) => upsertMessage(data, message));
  }, [updateCache]);

  const deleteMessage = useCallback(async (id: string) => {
    if (!canUseChatConnection(true)) return;
    try {
      const result = await emitWithAck<{ message: Message }>("message:delete", { id });
      updateCache((data) => patchMessage(data, result.message));
      if (result.message.deletedAt) void removeCachedMedia(id);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Message could not be deleted"); }
  }, [updateCache]);

  const editMessage = useCallback(async (message: Message, text: string) => {
    const trimmed = text.trim();
    if (trimmed === message.text) return true;
    if (!canUseChatConnection(true)) return false;
    const optimisticEditedAt = new Date().toISOString();
    updateCache((data) => patchMessage(data, { ...message, text: trimmed, editedAt: optimisticEditedAt }));
    try {
      const result = await emitWithAck<{ message: Message }>("message:edit", { id: message.id, text: trimmed });
      updateCache((data) => patchMessage(data, result.message));
      return true;
    } catch (error) {
      updateCache((data) => data?.pages.some((page) => page.messages.some((item) => item.id === message.id && item.editedAt === optimisticEditedAt))
        ? patchMessage(data, message)
        : data);
      toast.error(error instanceof Error ? error.message : "Message could not be edited");
      return false;
    }
  }, [updateCache]);

  const deletePermanently = useCallback(async (id: string) => {
    if (!canUseChatConnection(true)) return;
    try {
      await emitWithAck<null>("message:delete-permanent", { id });
      updateCache((data) => removeMessage(data, id));
      void removeCachedMedia(id);
      setMissingIds((old) => new Set(old).add(id));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Message could not be deleted"); }
  }, [updateCache]);

  const toggleReaction = useCallback(async (id: string, emoji: string) => {
    if (!canUseChatConnection(true)) return;
    const message = messagesByIdRef.current.get(id);
    if (!message || message.deletedAt || id.startsWith("tmp-")) return;
    const event = message.reactions.some((reaction) => reaction.userId === currentUserId && reaction.emoji === emoji) ? "reaction:remove" : "reaction:add";
    try {
      const result = await emitWithAck<{ message: Message }>(event, { id, emoji });
      updateCache((data) => patchMessage(data, result.message));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Reaction could not be updated"); }
  }, [currentUserId, updateCache]);

  const goToReply = useCallback(async (id: string) => {
    if (missingIdsRef.current.has(id)) { toast.error("Message not found or deleted"); return; }
    let target = messagesByIdRef.current.get(id);
    if (!target && !canUseChatConnection(true)) return;
    while (!target && hasNextPage) {
      const result = await fetchNextPage();
      target = result.data?.pages.flatMap((page) => page.messages).find((message) => message.id === id);
      if (target) break;
      if (!result.hasNextPage) break;
    }
    if (!target) {
      setMissingIds((old) => new Set(old).add(id));
      toast.error("Message not found or deleted");
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(`msg-${id}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-msg");
      window.setTimeout(() => el.classList.remove("highlight-msg"), 2000);
    }));
  }, [fetchNextPage, hasNextPage]);

  useEffect(() => {
    if (!conversationId) return;
    const onNew = ({ message }: { message: Message }) => {
      if (message.conversationId !== conversationId) return;
      if (message.media && interceptPendingMediaMessage(message)) return;
      const cached = queryClient.getQueryData<InfiniteData<MessagesResponse>>(key);
      if (!cached) return;
      updateCache((data) => upsertMessage(data, message));

      if (message.senderId === currentUserId) {
        setPending((old) => {
          const mappedClientId = getClientIdForServerId(message.id);
          if (mappedClientId) {
            return old.filter((item) => item.clientId !== mappedClientId);
          }

          const matchIndex = old.findIndex(
            (item) =>
              item.type === "text" &&
              message.type === "text" &&
              item.status === "sending" &&
              (item.text ?? "") === (message.text ?? "") &&
              (item.replyToId ?? null) === (message.replyToId ?? null),
          );

          if (matchIndex < 0) return old;
          const matchedItem = old[matchIndex];
          linkServerIdToClientId(message.id, matchedItem.clientId);
          return old.filter((_, index) => index !== matchIndex);
        });
      }
    };
    const onUpdated = ({ message }: { message: Message }) => {
      if (message.conversationId !== conversationId) return;
      updateCache((data) => patchMessage(data, message));
      if (message.deletedAt) void removeCachedMedia(message.id);
    };
    const onDeleted = ({ id, conversationId: idConversation }: { id: string; conversationId: string }) => {
      if (idConversation !== conversationId) return;
      setMissingIds((old) => new Set(old).add(id));
      updateCache((data) => removeMessage(data, id));
      void removeCachedMedia(id);
    };
    const onCleared = ({ conversationId: idConversation }: { conversationId: string }) => {
      if (idConversation !== conversationId) return;
      const cached = queryClient.getQueryData<InfiniteData<MessagesResponse>>(key);
      for (const message of cached?.pages.flatMap((page) => page.messages) ?? []) {
        if (message.media) void removeCachedMedia(message.id);
      }
      updateCache(clearMessages);
      setPending([]);
    };
    const onConversation = ({ conversation }: { conversation: Conversation }) => {
      if (conversation.id !== conversationId) return;
      upsertConversationCaches(queryClient, conversation);
      queryClient.setQueryData<ConversationResponse>(conversationKeys.detail(conversationId), (old) => upsertConversationDetail(old, conversation));
      queryClient.setQueryData<ConversationResponse>(conversationKeys.mine(), (old) => old?.conversation.id === conversationId ? { conversation: { ...old.conversation, ...conversation } } : old);
    };
    socket.on("message:new", onNew); socket.on("message:updated", onUpdated); socket.on("message:deleted", onDeleted);
    socket.on("conversation:cleared", onCleared); socket.on("conversation:updated", onConversation);
    return () => { socket.off("message:new", onNew); socket.off("message:updated", onUpdated); socket.off("message:deleted", onDeleted); socket.off("conversation:cleared", onCleared); socket.off("conversation:updated", onConversation); };
  }, [conversationId, currentUserId, key, queryClient, updateCache]);

  return {
    messages,
    confirmedMessages,
    pendingTextMessages: pending,
    messagesById,
    missingIds,
    goToReply,
    send,
    sendMedia,
    acceptMediaMessage,
    retry,
    deleteMessage,
    editMessage,
    deletePermanently,
    toggleReaction,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
  };
}
