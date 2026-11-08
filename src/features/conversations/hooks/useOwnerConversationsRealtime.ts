import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Conversation } from "@/features/conversations/types/conversation.types";
import { upsertConversationCaches } from "@/features/conversations/cache/conversationCache";
import { socket } from "@/core/socket/socket";

export function useOwnerConversationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onUpdated = ({ conversation }: { conversation: Conversation }) => {
      upsertConversationCaches(queryClient, conversation);
    };

    socket.on("conversation:updated", onUpdated);
    return () => {
      socket.off("conversation:updated", onUpdated);
    };
  }, [queryClient]);
}
