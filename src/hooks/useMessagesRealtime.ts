import { useEffect } from "react";
import { useQueryClient,type InfiniteData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Message } from "@/components/chat/chat.types";
import { playIncomingSound } from "@/lib/sounds";

export function useMessagesRealtime(
  currentUserId: string | undefined,
  activeConversationId?: string,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!activeConversationId) return;

    const queryKey = ["messages", activeConversationId];
    const isTabActive = () => document.visibilityState === "visible";

    const channel = supabase
      .channel(`chat-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          // ── INSERT ──────────────────────────────────────────────
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message;
            if (newMessage.sender_id !== currentUserId && isTabActive()) {
          playIncomingSound(); 
              await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", newMessage.id);
            }

            queryClient.setQueryData<InfiniteData<Message[]>>(
              queryKey,
              (old) => {
                if (!old) return old;
return {
      ...old,
      pages: old.pages.map((page, i) => {
        const optimistic = page.find(
          (msg) =>
            msg.status === "sending" &&
            msg.sender_id === newMessage.sender_id &&
            msg.content === newMessage.content,
        );

        const filtered = page.filter(
          (msg) =>
            !(
              msg.status === "sending" &&
              msg.sender_id === newMessage.sender_id &&
              msg.content === newMessage.content
            ),
        );

        const finalMessage: Message = {
          ...newMessage,
          reply_to: newMessage.reply_to ?? optimistic?.reply_to ?? null,
        };

return i === 0
  ? [...filtered, finalMessage]
  : filtered;
      }),
    };
  });
}

          // ── UPDATE & DELETE ─────────────────────────────────────
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "DELETE"
          ) {
            queryClient.invalidateQueries({ queryKey });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, currentUserId, queryClient]);
}