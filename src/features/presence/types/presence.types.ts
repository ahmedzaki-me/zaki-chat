export type SocketStatus = "connecting" | "connected" | "disconnected";

export interface TypingEvent {
  conversationId: string;
  isTyping: boolean;
}

export interface PresenceSnapshotEvent {
  onlineUserIds: string[];
}

export interface PresenceUpdatedEvent {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}
