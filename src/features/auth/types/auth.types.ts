import type { components } from "@/shared/types/api.generated";

export type User = components["schemas"]["User"];
export type Session = components["schemas"]["Session"];
export type SessionResponse = components["schemas"]["SessionResponse"];
export type AuthResponse = components["schemas"]["SessionResponse"];
export type RefreshResponse = components["schemas"]["SessionResponse"];

export type SignupRequest = components["schemas"]["SignupRequest"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type GuestRequest = components["schemas"]["GuestRequest"];
export type UpgradeRequest = components["schemas"]["UpgradeRequest"];
export type SetAvatarRequest = components["schemas"]["SetAvatarRequest"];

// Backward compatibility alias
export type RegisterRequest = SignupRequest;

export interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  updateAvatar: (avatarUrl: string | null) => void;
  clearAuth: () => void;
}
