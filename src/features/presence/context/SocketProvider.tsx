import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket, setSocketTokenGetter } from "@/core/socket/socket";
import { refreshSession } from "@/core/http/refreshSession";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { applyUserAvatarUpdate } from "@/features/conversations/cache/conversationCache";
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
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("user:updated", onUserUpdated);
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
