import type { Message } from "@/features/chat/types/chat.types";
import { emitWithAck } from "@/core/socket/socket";

type ImageVideoAttachment = {
  key: string;
  kind: "image" | "video";
  originalName: string;
  size: number;
};

type VoiceAttachment = {
  key: string;
  kind: "voice";
  size: number;
  durationSec: number;
  waveform: number[];
};

export type MediaMessagePayload = {
  conversationId: string;
  replyToId?: string | null;
} & (
  | { attachment: ImageVideoAttachment; caption: string | null }
  | { attachment: VoiceAttachment; caption?: never }
);

type PendingMediaMessageHandler = (message: Message) => boolean;
const pendingMediaMessageHandlers = new Set<PendingMediaMessageHandler>();

export function registerPendingMediaMessageHandler(handler: PendingMediaMessageHandler): () => void {
  pendingMediaMessageHandlers.add(handler);
  return () => pendingMediaMessageHandlers.delete(handler);
}

export function interceptPendingMediaMessage(message: Message): boolean {
  for (const handler of pendingMediaMessageHandlers) {
    if (handler(message)) return true;
  }
  return false;
}

export function sendMediaMessage(payload: MediaMessagePayload): Promise<{ message: Message }> {
  return emitWithAck<{ message: Message }>("message:send", payload);
}
