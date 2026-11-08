import { useCallback, useEffect, useRef } from "react";
import { socket } from "@/core/socket/socket";

export function useTypingEmitter(conversationId?: string) {
  const active = useRef(false);
  const lastSent = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const stopTyping = useCallback(() => {
    window.clearTimeout(timer.current);
    if (active.current && socket.connected && conversationId) socket.emit("typing", { conversationId, isTyping: false });
    active.current = false;
  }, [conversationId]);
  const onTypingChange = useCallback((value: string) => {
    if (!value.trim()) { stopTyping(); return; }
    const now = Date.now();
    if (socket.connected && conversationId && (!active.current || now - lastSent.current >= 2500)) {
      socket.emit("typing", { conversationId, isTyping: true });
      active.current = true;
      lastSent.current = now;
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(stopTyping, 3000);
  }, [conversationId, stopTyping]);
  useEffect(() => stopTyping, [stopTyping]);
  return { onTypingChange, stopTyping };
}
