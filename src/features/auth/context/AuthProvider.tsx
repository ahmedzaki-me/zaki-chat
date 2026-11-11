import {
  useState,
  useCallback,
  useRef,
  type ReactNode,
  useEffect,
} from "react";
import { storage } from "@/shared/lib/storage";
import { type User } from "@/shared/types";

import { configureAuthInterceptor } from "@/core/http/authInterceptor";
import { refresh } from "@/features/auth/api/auth.service";

import { AuthContext } from "./AuthContext";
import { queryClient } from "@/core/query/queryClient";
import { clearPersistedQueryCache, enablePersistedQueryCache } from "@/core/query/queryPersister";
import { clearAll as clearMediaCache } from "@/features/chat/cache/mediaCache";
import { removeLocalPushSubscription } from "@/features/notifications/api/push.service";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tokenRef = useRef<string | null>(null);
  const userRef = useRef<User | null>(null);

  const setAuth = useCallback((token: string, userData: User) => {
    enablePersistedQueryCache();
    tokenRef.current = token;
    setAccessToken(token);
    setUser(userData);
    userRef.current = userData;
    storage.setUser(userData);
  }, []);

  const updateAvatar = useCallback((avatarUrl: string | null) => {
    setUser((prev) => {
      if (!prev || prev.avatarUrl === avatarUrl) return prev;
      const next = { ...prev, avatarUrl };
      userRef.current = next;
      storage.setUser(next);
      return next;
    });
  }, []);

  const clearAuth = useCallback(() => {
    void removeLocalPushSubscription(userRef.current?.id);
    userRef.current = null;
    void clearPersistedQueryCache();
    tokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    storage.clearUser();
    queryClient.clear();
    void clearMediaCache();
  }, []);

  useEffect(() => {
    configureAuthInterceptor({
      getAccessToken: () => tokenRef.current,
      onRefreshed: (token, userData) => {
        tokenRef.current = token;
        userRef.current = userData;
        setAccessToken(token);
        setUser(userData);
        storage.setUser(userData);
      },
      onAuthFailed: clearAuth,
    });
  }, [clearAuth]);

  useEffect(() => {
    async function bootstrap() {
      const storedUser = storage.getUser();
      if (!storedUser) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await refresh();
        if (result) setAuth(result.accessToken, result.user);
        else clearAuth();
      } catch {
        // Keep the locally stored profile when refresh cannot reach the server.
        setUser(storedUser);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, [clearAuth, setAuth]);

  return (
    <AuthContext.Provider
      value={{ accessToken, user, isLoading, setAuth, updateAvatar, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}
