import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@/features/chat/types/chat.types";
import type { Conversation } from "@/features/conversations/types/conversation.types";
import { emitWithAck, socket } from "@/core/socket/socket";
import { upsertConversationCaches } from "@/features/conversations/cache/conversationCache";
import {
  compareMessageIds,
  getReadWatermark,
  setReadWatermark,
} from "@/features/chat/cache/readWatermark";

export function useMarkRead(
  conversationId: string | undefined,
  messages: Message[],
  currentUserId?: string,
) {
  const client = useQueryClient();
  const inFlightRef = useRef<{
    conversationId: string;
    messageId: string;
  } | null>(null);
  const [trigger, setTrigger] = useState(0);

  const latestOtherId = useMemo(() => {
    if (!conversationId || !currentUserId) return "";
    let highest = "";
    for (const message of messages) {
      if (
        message.senderId !== currentUserId &&
        !("clientId" in message) &&
        (!highest || compareMessageIds(message.id, highest) > 0)
      ) {
        highest = message.id;
      }
    }
    return highest;
  }, [conversationId, currentUserId, messages]);

  useEffect(() => {
    if (!conversationId || !currentUserId || !latestOtherId) return;
    if (document.visibilityState !== "visible") return;

    const confirmed = getReadWatermark(currentUserId, conversationId);
    if (confirmed && compareMessageIds(latestOtherId, confirmed) <= 0) return;

    const inFlight = inFlightRef.current;
    if (
      inFlight &&
      inFlight.conversationId === conversationId &&
      compareMessageIds(latestOtherId, inFlight.messageId) <= 0
    ) {
      return;
    }

    const targetConversationId = conversationId;
    const targetUserId = currentUserId;
    const targetMessageId = latestOtherId;

    const timer = window.setTimeout(() => {
      if (document.visibilityState !== "visible" || !socket.connected) return;

      const latestConfirmed = getReadWatermark(
        targetUserId,
        targetConversationId,
      );
      if (
        latestConfirmed &&
        compareMessageIds(targetMessageId, latestConfirmed) <= 0
      ) {
        return;
      }

      const activeInFlight = inFlightRef.current;
      if (
        activeInFlight &&
        activeInFlight.conversationId === targetConversationId &&
        compareMessageIds(targetMessageId, activeInFlight.messageId) <= 0
      ) {
        return;
      }

      inFlightRef.current = {
        conversationId: targetConversationId,
        messageId: targetMessageId,
      };

      void emitWithAck<{ conversation: Conversation }>("conversation:read", {
        conversationId: targetConversationId,
        messageId: targetMessageId,
      })
        .then(({ conversation }) => {
          setReadWatermark(targetUserId, targetConversationId, targetMessageId);
          upsertConversationCaches(client, conversation);
        })
        .catch(() => {
          // Will retry on next connect, visibilitychange, or newer incoming message.
        })
        .finally(() => {
          if (
            inFlightRef.current?.conversationId === targetConversationId &&
            inFlightRef.current?.messageId === targetMessageId
          ) {
            inFlightRef.current = null;
          }
        });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [client, conversationId, currentUserId, latestOtherId, trigger]);

  useEffect(() => {
    const bump = () => setTrigger((value) => value + 1);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") bump();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    socket.on("connect", bump);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      socket.off("connect", bump);
    };
  }, []);
}
