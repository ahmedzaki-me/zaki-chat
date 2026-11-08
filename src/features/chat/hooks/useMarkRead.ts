import { useEffect, useRef, useState } from "react";
import type { Message } from "@/features/chat/types/chat.types";
import { emitWithAck, socket } from "@/core/socket/socket";
import { upsertConversationCaches } from "@/features/conversations/cache/conversationCache";
import { useQueryClient } from "@tanstack/react-query";

export function useMarkRead(conversationId: string | undefined, unreadCount: number | undefined, messages: Message[], currentUserId?: string) {
  const client = useQueryClient();
  const lastSent = useRef("");
  const [visibilityVersion, setVisibilityVersion] = useState(0);
  const latestOtherId = messages.filter((message) => message.senderId !== currentUserId && !("clientId" in message)).at(-1)?.id;
  useEffect(() => {
    if (!conversationId || !unreadCount || !latestOtherId || document.visibilityState !== "visible" || latestOtherId === lastSent.current) return;
    const timer = window.setTimeout(() => {
      if (!socket.connected) return;
      lastSent.current = latestOtherId;
      void emitWithAck<{ conversation: import("@/features/conversations/types/conversation.types").Conversation }>("conversation:read", { conversationId, messageId: latestOtherId })
        .then(({ conversation }) => upsertConversationCaches(client, conversation))
        .catch(() => { lastSent.current = ""; });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [client, conversationId, latestOtherId, unreadCount, visibilityVersion]);
  useEffect(() => {
    const check = () => { if (document.visibilityState === "visible") { lastSent.current = ""; setVisibilityVersion((value) => value + 1); } };
    const reconnected = () => setVisibilityVersion((value) => value + 1);
    document.addEventListener("visibilitychange", check);
    socket.on("connect", reconnected);
    return () => { document.removeEventListener("visibilitychange", check); socket.off("connect", reconnected); };
  }, []);
}
