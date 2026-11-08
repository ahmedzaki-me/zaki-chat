import { io, type Socket } from "socket.io-client";
import type { Message } from "@/features/chat/types/chat.types";
import type { Conversation } from "@/features/conversations/types/conversation.types";
import type { MediaMessagePayload } from "@/features/chat/api/mediaMessage.api";
import type { ProblemDetails } from "@/shared/types";

export type { ProblemDetails };
export type Ack<T> = { ok: true; data: T } | { ok: false; error: Partial<ProblemDetails> };
export interface ClientToServerEvents {
  "app:visibility": (payload: { visible: boolean; conversationId?: string }) => void;
  "message:send": (payload: { conversationId: string; text: string; replyToId?: string | null } | MediaMessagePayload, ack: (result: Ack<{ message: Message }>) => void) => void;
  "message:edit": (payload: { id: string; text: string }, ack: (result: Ack<{ message: Message }>) => void) => void;
  "message:delete": (payload: { id: string }, ack: (result: Ack<{ message: Message }>) => void) => void;
  "message:delete-permanent": (payload: { id: string }, ack: (result: Ack<unknown>) => void) => void;
  "conversation:read": (payload: { conversationId: string; messageId: string }, ack: (result: Ack<{ conversation: Conversation }>) => void) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
  "reaction:add": (payload: { id: string; emoji: string }, ack: (result: Ack<{ message: Message }>) => void) => void;
  "reaction:remove": (payload: { id: string; emoji: string }, ack: (result: Ack<{ message: Message }>) => void) => void;
  "conversation:clear": (payload: { conversationId: string }, ack: (result: Ack<unknown>) => void) => void;
}
export interface ServerToClientEvents {
  "message:new": (event: { message: Message }) => void;
  "message:updated": (event: { message: Message }) => void;
  "message:deleted": (event: { id: string; conversationId: string }) => void;
  "conversation:updated": (event: { conversation: Conversation }) => void;
  "conversation:cleared": (event: { conversationId: string }) => void;
  typing: (event: { conversationId: string; isTyping: boolean }) => void;
  "presence:updated": (event: { userId: string; online: boolean; lastSeenAt: string | null }) => void;
  "presence:snapshot": (event: { onlineUserIds: string[] }) => void;
}

export const SOCKET_EVENTS = {
  messageNew: "message:new", messageUpdated: "message:updated", messageDeleted: "message:deleted",
  conversationUpdated: "conversation:updated", conversationCleared: "conversation:cleared",
} as const;
let tokenGetter: () => string | null = () => null;
export const setSocketTokenGetter = (getter: () => string | null) => { tokenGetter = getter; };

const apiBase = import.meta.env.VITE_API_BASE_URL as string;
const socketOrigin = (import.meta.env.VITE_SOCKET_URL as string | undefined) || new URL(apiBase).origin;
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketOrigin, {
  autoConnect: false, transports: ["websocket"], withCredentials: true,
  reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 10000,
  auth: (callback) => callback({ token: tokenGetter() }),
});
let socketConnectCount = 0;
socket.on("connect", () => { socketConnectCount += 1; });
export const getSocketConnectCount = () => socketConnectCount;

export class SocketError extends Error {
  public problem: Partial<ProblemDetails>;
  constructor(problem: Partial<ProblemDetails>) {
    super(problem.detail || problem.title || "Socket request failed");
    this.name = "SocketError";
    this.problem = problem;
  }
}

export function emitWithAck<T>(event: "message:send" | "message:edit" | "message:delete" | "message:delete-permanent" | "reaction:add" | "reaction:remove" | "conversation:clear" | "conversation:read", payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const emit = socket.timeout(10000) as typeof socket;
    (emit.emit as (...args: unknown[]) => void)(event, payload, (timeoutError: Error | null, result: Ack<T>) => {
      if (timeoutError) return reject(new SocketError({ title: "Request timed out", detail: "The server did not respond in time." }));
      if (!result?.ok) return reject(new SocketError(result?.error ?? { title: "Request failed" }));
      resolve(result.data);
    });
  });
}
