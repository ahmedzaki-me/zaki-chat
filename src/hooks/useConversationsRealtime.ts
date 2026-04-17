import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { conversationsKeys } from "./useConversationsQuery";

export function useConversationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("Conversation changed:", payload);
          queryClient.invalidateQueries({
            queryKey: conversationsKeys.conversations,
          });
        },
      )
      .subscribe((status, err) => {
        console.log("Conversations realtime status:", status);
        if (err) console.error("Realtime error:", err);
      });

    return () => {
      console.log("supabase.removeChannel(channel)");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
