import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ConversationsListResponse } from "@/features/conversations/types/conversation.types";
import type { Message } from "@/features/chat/types/chat.types";
import {
  toConversationLastMessage,
  upsertConversationList,
} from "@/features/conversations/cache/conversationCache";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";
import { socket } from "@/core/socket/socket";

export function useOwnerConversationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onNewMessage = ({ message }: { message: Message }) => {
      // Optimistically elevate conversation and update lastMessage preview in list;
      // unreadCount stays authoritative via server conversation:updated events.
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
          if (target.lastMessage?.id === message.id) {
            return old;
          }

          return upsertConversationList(old, {
            ...target,
            lastMessageAt: message.createdAt,
            lastMessage: toConversationLastMessage(message),
          });
        },
      );
    };

    socket.on("message:new", onNewMessage);

    return () => {
      socket.off("message:new", onNewMessage);
    };
  }, [queryClient]);
}
