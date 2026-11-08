export * from "./api.generated";
import type { components } from "./api.generated";

export type ApiSchemas = components["schemas"];
export type ProblemDetails = components["schemas"]["ProblemDetails"];

// Domain types re-exported from feature modules
export type {
  User,
  Session,
  SessionResponse,
  AuthResponse,
  RefreshResponse,
  RegisterRequest,
  LoginRequest,
  SignupRequest,
  GuestRequest,
  UpgradeRequest,
  SetAvatarRequest,
  AuthContextType,
} from "@/features/auth/types/auth.types";

export type {
  Conversation,
  ConversationLastMessage,
  ConversationResponse,
  ConversationsListResponse,
  OwnerProfile,
} from "@/features/conversations/types/conversation.types";

export type {
  Message,
  MessageType,
  Media,
  Reaction,
  EditHistoryEntry,
  Emoji,
  MessagesResponse,
  PendingMessage,
} from "@/features/chat/types/chat.types";
