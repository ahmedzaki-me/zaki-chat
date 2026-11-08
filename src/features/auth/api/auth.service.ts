import { api } from "@/core/http/axios";
import {
  type AuthResponse,
  type RefreshResponse,
  type User,
  type Session,
} from "@/features/auth/types/auth.types";

import { refreshSession } from "@/core/http/refreshSession";

export const signup = async (
  name: string,
  username: string,
  password: string,
  turnstileToken?: string | null,
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>(
    "/auth/signup",
    {
      name,
      username,
      password,
      ...(turnstileToken ? { turnstileToken } : {}),
    },
    {
      headers: turnstileToken ? { "cf-turnstile-response": turnstileToken } : {},
    },
  );
  return data;
};

export const signInGuest = async (
  name: string,
  turnstileToken?: string | null,
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>(
    "/auth/guest",
    {
      name,
      ...(turnstileToken ? { turnstileToken } : {}),
    },
    {
      headers: turnstileToken ? { "cf-turnstile-response": turnstileToken } : {},
    },
  );
  return data;
};

export const login = async (
  username: string,
  password: string,
  turnstileToken?: string | null,
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>(
    "/auth/login",
    {
      username,
      password,
      ...(turnstileToken ? { turnstileToken } : {}),
    },
    {
      headers: turnstileToken ? { "cf-turnstile-response": turnstileToken } : {},
    },
  );
  return data;
};

export const refresh = (): Promise<RefreshResponse | null> => refreshSession();

export const upgrade = async (
  username: string,
  password: string,
  turnstileToken?: string | null,
): Promise<{ user: User }> => {
  const { data } = await api.post<{ user: User }>(
    "/auth/upgrade",
    {
      username,
      password,
      ...(turnstileToken ? { turnstileToken } : {}),
    },
    {
      headers: turnstileToken ? { "cf-turnstile-response": turnstileToken } : {},
    },
  );
  return data;
};

export const logout = async () => {
  await api.post("/auth/logout");
};



export const getCurrentUser = async (): Promise<{ user: User }> => {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data;
};

export const setAvatar = async (key: string, signal?: AbortSignal): Promise<{ user: User }> => {
  const { data } = await api.put<{ user: User }>("/users/me/avatar", { key }, { signal });
  return data;
};

export const removeAvatar = async (): Promise<void> => {
  await api.delete("/users/me/avatar");
};

export const getSessions = async (): Promise<{ sessions: Session[] }> => {
  const { data } = await api.get<{ sessions: Session[] }>("/auth/sessions");
  return data;
};

export const revokeSession = async (id: string): Promise<void> => {
  await api.delete(`/auth/sessions/${encodeURIComponent(id)}`);
};

export const logoutAll = async (): Promise<void> => {
  await api.post("/auth/logout-all");
};
