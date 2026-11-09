import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Conversation,
  ConversationsListResponse,
} from "@/features/conversations/types/conversation.types";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";
import { socket } from "@/core/socket/socket";
import { useAuth } from "@/features/auth/hooks/useAuth";

const TypingContext = createContext<Set<string>>(new Set());
const PresenceContext = createContext<Set<string>>(new Set());
export const usePeerTyping = () => useContext(TypingContext);
export const usePresence = () => useContext(PresenceContext);

export function PeerTypingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [typing, setTyping] = useState<Set<string>>(new Set());
  useEffect(() => {
    const timers = new Map<string, number>();
    const clear = (id: string) => {
      window.clearTimeout(timers.get(id));
      timers.delete(id);
      setTyping((old) => {
        if (!old.has(id)) return old;
        const next = new Set(old);
        next.delete(id);
        return next;
      });
    };
    const onTyping = ({
      conversationId,
      isTyping,
    }: {
      conversationId: string;
      isTyping: boolean;
    }) => {
      if (!isTyping) {
        clear(conversationId);
        return;
      }
      setTyping((old) => (old.has(conversationId) ? old : new Set(old).add(conversationId)));
      window.clearTimeout(timers.get(conversationId));
      timers.set(
        conversationId,
        window.setTimeout(() => clear(conversationId), 5000),
      );
    };
    const onNew = ({
      message,
    }: {
      message: { conversationId: string; senderId: string };
    }) => {
      if (message.senderId !== user?.id) clear(message.conversationId);
    };
    const onDisconnect = () => {
      timers.forEach(window.clearTimeout);
      timers.clear();
      setTyping((old) => (old.size === 0 ? old : new Set()));
    };
    socket.on("typing", onTyping);
    socket.on("message:new", onNew);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("typing", onTyping);
      socket.off("message:new", onNew);
      socket.off("disconnect", onDisconnect);
      onDisconnect();
    };
  }, [user?.id, user?.role]);
  return (
    <TypingContext.Provider value={typing}>{children}</TypingContext.Provider>
  );
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [online, setOnline] = useState<Set<string>>(new Set());
  useEffect(() => {
    const onSnapshot = ({ onlineUserIds }: { onlineUserIds: string[] }) =>
      setOnline((old) => {
        if (
          old.size === onlineUserIds.length &&
          onlineUserIds.every((id) => old.has(id))
        ) {
          return old;
        }
        return new Set(onlineUserIds);
      });
    const onUpdate = ({
      userId,
      online: isOnline,
      lastSeenAt,
    }: {
      userId: string;
      online: boolean;
      lastSeenAt: string | null;
    }) => {
      setOnline((old) => {
        const next = new Set(old);
        if (isOnline ? old.has(userId) : !old.has(userId)) return old;
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
      client.setQueryData<ConversationsListResponse>(
        conversationKeys.list(),
        (old) =>
          old && {
            conversations: old.conversations.map((c) =>
              c.user.id === userId
                ? { ...c, user: { ...c.user, lastSeenAt } }
                : c,
            ),
          },
      );
      client.setQueriesData(
        { queryKey: conversationKeys.all },
        (old: unknown) => {
          const data = old as { conversation?: Conversation } | undefined;
          return data?.conversation?.user.id === userId
            ? {
                conversation: {
                  ...data.conversation,
                  user: { ...data.conversation.user, lastSeenAt },
                },
              }
            : old;
        },
      );
    };
    const reset = () => setOnline((old) => (old.size === 0 ? old : new Set()));
    if (user?.role !== "owner") {
      reset();
      return;
    }
    socket.on("presence:snapshot", onSnapshot);
    socket.on("presence:updated", onUpdate);
    socket.on("disconnect", reset);
    return () => {
      socket.off("presence:snapshot", onSnapshot);
      socket.off("presence:updated", onUpdate);
      socket.off("disconnect", reset);
    };
  }, [client, user?.role]);
  return (
    <PresenceContext.Provider value={online}>
      {children}
    </PresenceContext.Provider>
  );
}
