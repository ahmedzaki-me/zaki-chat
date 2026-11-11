import { memo, useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useChatMessages } from "@/features/chat/hooks/useChatMessages";
import type { Message, PendingMessage } from "@/features/chat/types/chat.types";
import {
  groupMessagesByDate,
  isSameMessageGroup,
} from "@/features/chat/utils/chat.grouping";
import { formatDateLabel } from "@/features/chat/utils/chat.utils";
import { useTypingEmitter } from "@/features/presence/hooks/useTypingEmitter";
import { useMarkRead } from "@/features/chat/hooks/useMarkRead";
import { DateSeparator } from "@/features/chat/components/DateSeparator";
import { MessageBubble } from "@/features/chat/components/bubble/MessageBubble";
import { MessageInput } from "@/features/chat/components/input/MessageInput";
import { useQueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";
import { messagesKeys } from "@/features/chat/hooks/useMessagesQuery";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/api/auth.service";
import { usePendingUploads } from "@/features/chat/hooks/usePendingUploads";
import { OfflineBanner } from "@/shared/components/feedback/OfflineBanner";
import { useChatScroll } from "@/features/chat/hooks/useChatScroll";
import { downloadMedia } from "@/features/chat/utils/downloadMedia";
import { getClientIdForServerId } from "@/features/chat/utils/clientMessageMap";

interface ChatViewProps {
  conversationId?: string;
  currentUserId?: string;
  header: ReactNode;
  subtitleDate?: string;
  isConversationLoading?: boolean;
  introText?: string;
  otherName?: string;
  peerDeliveredUpTo?: string | null;
  peerReadUpTo?: string | null;
  unreadCount?: number;
  isOwner?: boolean;
  peerUser?: { name: string; avatarUrl: string | null };
}

export const ChatView = memo(function ChatView({
  conversationId,
  currentUserId,
  header,
  subtitleDate,
  isConversationLoading = false,
  introText = "Your private conversation is protected.",
  otherName,
  peerDeliveredUpTo,
  peerReadUpTo,
  unreadCount,
  isOwner = false,
  peerUser,
}: ChatViewProps) {
  const queryClient = useQueryClient();
  const { user, accessToken, setAuth } = useAuth();

  const peerDisplayName =
    peerUser?.name ?? otherName ?? (user?.role === "owner" ? "User" : "Owner");

  const getSenderName = useCallback(
    (senderId: string) => {
      if (senderId === currentUserId) {
        return user?.name || "You";
      }
      return peerDisplayName;
    },
    [currentUserId, user?.name, peerDisplayName],
  );

  const {
    confirmedMessages,
    pendingTextMessages,
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useChatMessages(conversationId, currentUserId);

  const pendingUploads = usePendingUploads(
    conversationId,
    currentUserId,
    sendMedia,
    acceptMediaMessage,
  );
  const typing = useTypingEmitter(conversationId);

  const confirmed = useMemo(
    () => [...confirmedMessages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [confirmedMessages],
  );

  const pending = useMemo(
    () =>
      [...pendingTextMessages, ...pendingUploads.messages].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      ),
    [pendingTextMessages, pendingUploads.messages],
  );

  const messages = useMemo(
    () => [...confirmed, ...pending],
    [confirmed, pending],
  );

  const messagesById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  useMarkRead(conversationId, unreadCount, messages, currentUserId);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const refreshedMediaIds = useRef(new Set<string>());

  const groupedMessages = useMemo(
    () => groupMessagesByDate(messages),
    [messages],
  );

  const pendingById = useMemo(
    () =>
      new Map(
        messages.flatMap((message) =>
          "clientId" in message
            ? [[message.id, message as PendingMessage] as const]
            : [],
        ),
      ),
    [messages],
  );

  const loading = isConversationLoading || isLoading;

  const { containerRef, handleScroll, handleGoToReply, scrollToBottom } =
    useChatScroll({
      conversationId,
      currentUserId,
      messages,
      loading,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      goToReply,
    });

  const handleDownloadMedia = useCallback(
    (message: Message) => downloadMedia(message, conversationId, queryClient),
    [conversationId, queryClient],
  );

  const pendingUploadsRef = useRef(pendingUploads);
  pendingUploadsRef.current = pendingUploads;
  const retryRef = useRef(retry);
  retryRef.current = retry;
  const deleteMessageRef = useRef(deleteMessage);
  deleteMessageRef.current = deleteMessage;
  const deletePermanentlyRef = useRef(deletePermanently);
  deletePermanentlyRef.current = deletePermanently;
  const toggleReactionRef = useRef(toggleReaction);
  toggleReactionRef.current = toggleReaction;
  const handleGoToReplyRef = useRef(handleGoToReply);
  handleGoToReplyRef.current = handleGoToReply;
  const authRef = useRef({ accessToken, setAuth });
  authRef.current = { accessToken, setAuth };

  const handleRetry = useCallback((retryItem: PendingMessage) => {
    if (retryItem.upload) {
      pendingUploadsRef.current.retry(retryItem.clientId);
    } else {
      retryRef.current(retryItem);
    }
  }, []);

  const handleCancelUpload = useCallback((cancelItem: PendingMessage) => {
    pendingUploadsRef.current.cancel(cancelItem.clientId);
  }, []);

  const handleDeleteUpload = useCallback((deleteItem: PendingMessage) => {
    pendingUploadsRef.current.removeFailed(deleteItem.clientId);
  }, []);

  const handleDeleteMessage = useCallback((id: string) => {
    void deleteMessageRef.current(id);
  }, []);

  const handleDeletePermanently = useCallback((id: string) => {
    void deletePermanentlyRef.current(id);
  }, []);

  const handleReact = useCallback((id: string, emoji: string) => {
    void toggleReactionRef.current(id, emoji);
  }, []);

  const onGoToReply = useCallback((replyToId: string) => {
    void handleGoToReplyRef.current(replyToId);
  }, []);

  const handleReply = useCallback((msg: Message) => {
    setEditingMessage(null);
    setReplyTo(msg);
  }, []);

  const handleEdit = useCallback((msg: Message) => {
    setReplyTo(null);
    setEditingMessage(msg);
  }, []);

  const handleAvatarExpired = useCallback(
    (senderId?: string) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });
      if (senderId === currentUserId)
        void getCurrentUser()
          .then(({ user: fresh }) => {
            if (authRef.current.accessToken)
              authRef.current.setAuth(authRef.current.accessToken, fresh);
            queryClient.setQueryData(["auth", "me"], {
              user: fresh,
            });
          })
          .catch(() => undefined);
    },
    [currentUserId, queryClient],
  );

  const handleMediaLoadError = useCallback(
    (messageId: string) => {
      if (refreshedMediaIds.current.has(messageId)) return;
      refreshedMediaIds.current.add(messageId);
      void queryClient.invalidateQueries({
        queryKey: messagesKeys.messages(conversationId ?? ""),
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });
    },
    [conversationId, queryClient],
  );

  const activeEditingMessage = editingMessage
    ? (messagesById.get(editingMessage.id) ?? null)
    : null;
  const safeEditingMessage = activeEditingMessage?.deletedAt
    ? null
    : activeEditingMessage;

  return (
    <div className="app-wallpaper flex flex-col h-dvh min-h-0 inset-0 overflow-x-clip">
      <div className="flex flex-col flex-1 min-h-0 bg-muted/10">
      <div className="shrink-0 z-10">{header}</div>
      <OfflineBanner />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        tabIndex={0}
        className="flex-1 min-h-0 overflow-y-auto sm:px-6 py-2"
        style={{ overflowAnchor: "auto" }}
      >
        {loading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-48 rounded-2xl" />
            <Skeleton className="h-12 w-32 rounded-2xl ml-auto" />
            <Skeleton className="h-12 w-54 rounded-2xl" />
            <Skeleton className="h-12 w-32 rounded-2xl ml-auto" />
            <DateSeparator label="Loading messages" />
            <Skeleton className="h-12 w-54 rounded-2xl" />
            <Skeleton className="h-12 w-32 rounded-2xl ml-auto" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-70">
            <SendHorizontal className="h-12 w-12" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div data-messages-inner className="flex flex-col min-h-full">
            <div
              className="mt-auto flex flex-col items-center justify-center pt-2 pb-2"
              style={{ overflowAnchor: "none" }}
            >
              {isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!hasNextPage && (
                <div className="flex flex-col items-center justify-center gap-1 opacity-90 font-semibold italic text-white md:not-dark:text-black/90 py-2 text-center">
                  {subtitleDate && (
                    <p className="text-[15px]">
                      ({formatDateLabel(subtitleDate)})
                    </p>
                  )}
                  {introText && <p className="text-[14px]">{introText}</p>}
                </div>
              )}
            </div>

            {groupedMessages.map((group) => (
              <div key={group.date}>
                <DateSeparator
                  label={formatDateLabel(`${group.date}T00:00:00`)}
                />
                {group.messages.map((message, index) => {
                  const pendingMessage = pendingById.get(message.id);
                  const previous = group.messages[index - 1];
                  const sameGroup = isSameMessageGroup(previous, message);
                  const repliedMsg = message.replyToId
                    ? (messagesById.get(message.replyToId) ?? null)
                    : null;

                  const messageKey = message.id.startsWith("tmp-")
                    ? ("clientId" in message ? (message as PendingMessage).clientId : message.id)
                    : (getClientIdForServerId(message.id) ?? message.id);

                  return (
                    <MessageBubble
                      key={messageKey}
                      message={message}
                      isOwn={message.senderId === currentUserId}
                      isConsecutive={sameGroup}
                      showAvatar={!sameGroup}
                      pendingMessage={pendingMessage}
                      onRetry={handleRetry}
                      onCancelUpload={handleCancelUpload}
                      onDeleteUpload={handleDeleteUpload}
                      onDelete={handleDeleteMessage}
                      onDeletePermanently={handleDeletePermanently}
                      canDeletePermanently={isOwner}
                      onReact={handleReact}
                      goToReply={onGoToReply}
                      missingReply={
                        !!message.replyToId && missingIds.has(message.replyToId)
                      }
                      peerDeliveredUpTo={peerDeliveredUpTo}
                      peerReadUpTo={peerReadUpTo}
                      repliedMessage={repliedMsg}
                      repliedSenderName={
                        repliedMsg
                          ? getSenderName(repliedMsg.senderId)
                          : undefined
                      }
                      otherName={peerDisplayName}
                      senderName={getSenderName(message.senderId)}
                      senderAvatarUrl={
                        message.senderId === currentUserId
                          ? user?.avatarUrl
                          : peerUser?.avatarUrl
                      }
                      onAvatarExpired={handleAvatarExpired}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onDownloadMedia={handleDownloadMedia}
                      onMediaLoadError={handleMediaLoadError}
                    />
                  );
                })}
              </div>
            ))}
            <div
              className="h-2 w-full shrink-0"
              style={{ overflowAnchor: "auto" }}
            />
          </div>
        )}
      </div>

      <div className="shrink-0">
        <MessageInput
          disabled={!conversationId || loading}
          onSend={(text) => {
            if (editingMessage) return false;
            const sent = send(text, replyTo?.id);
            if (sent) {
              setReplyTo(null);
              scrollToBottom(true);
            }
            return sent;
          }}
          onSendMedia={(file, caption) => {
            if (editingMessage) return false;
            const sent = pendingUploads.start(file, caption, replyTo?.id);
            if (sent) {
              setReplyTo(null);
              scrollToBottom(true);
            }
            return sent;
          }}
          chatContainerRef={containerRef}
          onVoiceSend={(recording, replyToId) => {
            if (
              pendingUploads.startVoice(
                recording.blob,
                recording.contentType,
                recording.durationSec,
                recording.waveform,
                replyToId,
              )
            ) {
              setReplyTo(null);
              scrollToBottom(true);
            }
          }}
          recordingEnabled={!!accessToken && !!user}
          replyTo={replyTo}
          replyToSenderName={
            replyTo ? getSenderName(replyTo.senderId) : undefined
          }
          onCancelReply={() => setReplyTo(null)}
          key={safeEditingMessage?.id ?? "message-input"}
          editingMessage={safeEditingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onEditMessage={editMessage}
          onTypingChange={typing.onTypingChange}
          onStopTyping={typing.stopTyping}
        />
      </div>
      </div>
    </div>
  );
});
