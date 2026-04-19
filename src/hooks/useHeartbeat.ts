// hooks/useHeartbeat.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

const HEARTBEAT_INTERVAL_MS = 15_000;

export function useHeartbeat() {
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const { user } = useAuth();

  useEffect(() => {
    const sendHeartbeat = async () => {
      if (!user) return;

      await supabase
        .from("user_presence")
        .upsert(
          { user_id: user.id, last_seen: new Date().toISOString() },
          { onConflict: "user_id" }
        );
    };

    sendHeartbeat();

    timerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(timerRef.current);
  }, [user]);
}