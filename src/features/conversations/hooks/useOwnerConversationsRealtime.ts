import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Conversation,
  ConversationLastMessage,
  ConversationsListResponse,
} from "@/features/conversations/types/conversation.types";
import type { Message } from "@/features/chat/types/chat.types";
import {
  upsertConversationCaches,
  upsertConversationList,
} from "@/features/conversations/cache/conversationCache";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";
import { socket } from "@/core/socket/socket";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useOwnerConversationsRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    const onUpdated = ({ conversation }: { conversation: Conversation }) => {
      upsertConversationCaches(queryClient, conversation);
    };

    const onCleared = ({ conversationId }: { conversationId: string }) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    };

    const onNewMessage = ({ message }: { message: Message }) => {
      // Optimistically elevate conversation and update last message in list
      queryClient.setQueryData<ConversationsListResponse>(
        conversationKeys.list(),
        (old) => {
          if (!old) return old;
          const target = old.conversations.find(
            (c) => c.id === message.conversationId,
          );
          if (!target) {
            void queryClient.invalidateQueries({
              queryKey: conversationKeys.list(),
            });
            return old;
          }

          const isCurrentActive =
            typeof window !== "undefined" &&
            window.location.pathname.endsWith(`/${message.conversationId}`);
          const isFromMe = message.senderId === user?.id;

          const lastMessage: ConversationLastMessage = {
            id: message.id,
            senderId: message.senderId,
            type: message.type,
            deletedAt: message.deletedAt ?? null,
            text: message.text ?? null,
            durationSec: message.media?.durationSec ?? null,
            media: message.media ?? null,
          };

          const updated: Conversation = {
            ...target,
            lastMessageAt: message.createdAt,
            lastMessage,
            unreadCount:
              isCurrentActive || isFromMe
                ? target.unreadCount
                : (target.unreadCount ?? 0) + 1,
          };
          return upsertConversationList(old, updated);
        },
      );
    };

    socket.on("conversation:updated", onUpdated);
    socket.on("conversation:cleared", onCleared);
    socket.on("message:new", onNewMessage);

    return () => {
      socket.off("conversation:updated", onUpdated);
      socket.off("conversation:cleared", onCleared);
      socket.off("message:new", onNewMessage);
    };
  }, [queryClient, user?.id]);
}
