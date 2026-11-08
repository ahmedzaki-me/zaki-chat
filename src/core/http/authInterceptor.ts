import { api } from "@/core/http/axios";
import type { User } from "@/shared/types";
import { refreshSession } from "@/core/http/refreshSession";

// Decouples authentication state management from the Axios instance
type AuthHooks = {
  getAccessToken: () => string | null;
  onRefreshed: (token: string, user: User) => void;
  onAuthFailed: () => void;
};

// Fallback implementation before configuration injection
let hooks: AuthHooks = {
  getAccessToken: () => null,
  onRefreshed: () => {},
  onAuthFailed: () => {},
};

// Registers authentication state handlers
export function configureAuthInterceptor(opts: AuthHooks) {
  hooks = opts;
}

// Request Interceptor: Inject the Access Token into the Authorization header
api.interceptors.request.use((config) => {
  const token = hooks.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor: Refresh the Access Token after a 401 response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url ?? "");

    // Reject non-401 errors and requests that have already been retried
    if (
      ![401, 403].includes(error.response?.status ?? 0) ||
      !originalRequest ||
      originalRequest._retry ||
      /\/auth\/(login|guest|signup|refresh)(?:\?|$)/.test(requestUrl)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const session = await refreshSession();
      if (!session) {
        hooks.onAuthFailed();
        return Promise.reject(error);
      }
      const accessToken = session.accessToken;
      hooks.onRefreshed(accessToken, session.user);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
