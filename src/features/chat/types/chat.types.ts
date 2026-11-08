import type { components } from "@/shared/types/api.generated";

export type Message = components["schemas"]["Message"] & {
  deliveredAt?: string | null;
  readAt?: string | null;
};

export type MessageType = Message["type"];
export type Media = components["schemas"]["Media"];
export type Reaction = components["schemas"]["Reaction"];
export type EditHistoryEntry = components["schemas"]["EditHistoryEntry"];
export type Emoji = components["schemas"]["Emoji"];

export type PendingMessage = Message & {
  clientId: string;
  status: "sending" | "error";
  upload?: {
    stage: "preparing" | "uploading" | "sending" | "error";
    progress: number;
    error?: string;
  };
};

export interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}
