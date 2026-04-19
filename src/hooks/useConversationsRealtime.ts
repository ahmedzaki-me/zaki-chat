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
        () => {
          queryClient.invalidateQueries({
            queryKey: conversationsKeys.conversations,
          });
        },
      )
      .subscribe((err) => {
        if (err) console.error("Realtime error:", err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
