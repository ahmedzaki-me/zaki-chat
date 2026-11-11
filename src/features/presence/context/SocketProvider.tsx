import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { InfiniteData } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { socket, setSocketTokenGetter } from "@/core/socket/socket";
import { refreshSession } from "@/core/http/refreshSession";
import {
  APP_BOOT_TIME,
  invalidateStaleChatQueries,
} from "@/core/query/queryClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type {
  Conversation,
  ConversationResponse,
} from "@/features/conversations/types/conversation.types";
import type { Message, MessagesResponse } from "@/features/chat/types/chat.types";
import {
  applyUserAvatarUpdate,
  upsertConversationCaches,
} from "@/features/conversations/cache/conversationCache";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";
import { messagesKeys } from "@/features/chat/hooks/useMessagesQuery";
import { clearMessages } from "@/features/chat/cache/messageCache";
import { clearConversationReadWatermark } from "@/features/chat/cache/readWatermark";
import { SocketContext } from "./SocketContext";
import { PeerTypingProvider, PresenceProvider } from "./ChatRealtimeProvider";

import { type SocketStatus } from "@/features/presence/types/presence.types";


export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, setAuth, updateAvatar, clearAuth } = useAuth();
  const tokenRef = useRef(accessToken);
  const refreshedRef = useRef(false);
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const queryClient = useQueryClient();
  const hasConnectedOnceRef = useRef(false);
  const userId = user?.id;
  const userIdRef = useRef(userId);
  const updateAvatarRef = useRef(updateAvatar);
  useEffect(() => {
    updateAvatarRef.current = updateAvatar;
  }, [updateAvatar]);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const recover = useCallback(async () => {
    if (refreshedRef.current) return;
    const recoveringUserId = userIdRef.current;
    refreshedRef.current = true;
    let result;
    try {
      result = await refreshSession();
    } catch {
      refreshedRef.current = false;
      window.setTimeout(() => {
        if (userIdRef.current === recoveringUserId && !socket.connected && navigator.onLine) socket.connect();
      }, 5000);
      return;
    }
    if (userIdRef.current !== recoveringUserId) return;
    if (!result) {
      clearAuth();
      return;
    }
    tokenRef.current = result.accessToken;
    setAuth(result.accessToken, result.user);
    if (navigator.onLine) socket.connect();
  }, [clearAuth, setAuth]);

  useEffect(() => {
    setSocketTokenGetter(() => tokenRef.current);
    if (!userId) {
      hasConnectedOnceRef.current = false;
      socket.disconnect();
      return;
    }

    const onConnect = () => {
      refreshedRef.current = false;
      setStatus("connected");
      if (hasConnectedOnceRef.current) {
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
        void queryClient.invalidateQueries({ queryKey: ["messages"] });
        void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      } else {
        hasConnectedOnceRef.current = true;
        invalidateStaleChatQueries(
          queryClient,
          Math.max(APP_BOOT_TIME, Date.now() - 10_000),
        );
      }
    };
    const onDisconnect = (reason: string) => {
      setStatus("disconnected");
      if (reason === "io server disconnect" && navigator.onLine) {
        window.setTimeout(() => {
          if (userIdRef.current && !socket.connected) socket.connect();
        }, 1000);
      }
    };
    const onConnectError = (error: Error & { data?: { status?: number } }) => {
      setStatus("disconnected");
      if ([401, 403].includes(error.data?.status ?? 0)) void recover();
    };
    const onUserUpdated = (payload: { id: string; avatarUrl: string | null }) => {
      applyUserAvatarUpdate(queryClient, payload, {
        currentUserId: userIdRef.current,
        updateAvatar: updateAvatarRef.current,
      });
    };
    const onConversationUpdated = ({
      conversation,
    }: {
      conversation: Conversation;
    }) => {
      upsertConversationCaches(queryClient, conversation);
    };
    const onConversationCleared = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      clearConversationReadWatermark(conversationId);
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
      const mine = queryClient.getQueryData<ConversationResponse>(
        conversationKeys.mine(),
      );
      if (mine?.conversation.id === conversationId) {
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.mine(),
        });
      }

      const msgKey = messagesKeys.messages(conversationId);
      const msgQuery = queryClient.getQueryCache().find({ queryKey: msgKey });
      if (msgQuery && msgQuery.getObserversCount() === 0) {
        queryClient.setQueryData<InfiniteData<MessagesResponse>>(
          msgKey,
          clearMessages,
        );
        void queryClient.invalidateQueries({
          queryKey: msgKey,
          refetchType: "none",
        });
      }
    };
    const markInactiveMessagesStale = (conversationId: string) => {
      const msgKey = messagesKeys.messages(conversationId);
      const msgQuery = queryClient.getQueryCache().find({ queryKey: msgKey });
      if (msgQuery && msgQuery.getObserversCount() === 0) {
        void queryClient.invalidateQueries({
          queryKey: msgKey,
          refetchType: "none",
        });
      }
    };
    const onMessageActivity = ({ message }: { message: Message }) => {
      markInactiveMessagesStale(message.conversationId);
    };
    const onMessageDeleted = ({
      conversationId,
    }: {
      id: string;
      conversationId: string;
    }) => {
      markInactiveMessagesStale(conversationId);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("user:updated", onUserUpdated);
    socket.on("conversation:updated", onConversationUpdated);
    socket.on("conversation:cleared", onConversationCleared);
    socket.on("message:new", onMessageActivity);
    socket.on("message:updated", onMessageActivity);
    socket.on("message:deleted", onMessageDeleted);
    const onOnline = () => {
      if (userIdRef.current && !socket.connected) socket.connect();
    };
    window.addEventListener("online", onOnline);
    const connectingTimer = window.setTimeout(() => setStatus("connecting"), 0);
    socket.connect();
    return () => {
      window.clearTimeout(connectingTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("user:updated", onUserUpdated);
      socket.off("conversation:updated", onConversationUpdated);
      socket.off("conversation:cleared", onConversationCleared);
      socket.off("message:new", onMessageActivity);
      socket.off("message:updated", onMessageActivity);
      socket.off("message:deleted", onMessageDeleted);
      window.removeEventListener("online", onOnline);
      socket.disconnect();
    };
  }, [userId, recover, queryClient]);

  return (
    <SocketContext.Provider
      value={{ status: userId ? status : "disconnected" }}
    >
      <PeerTypingProvider>
        {user?.role === "owner" ? (
          <PresenceProvider>{children}</PresenceProvider>
        ) : (
          children
        )}
      </PeerTypingProvider>
    </SocketContext.Provider>
  );
}
