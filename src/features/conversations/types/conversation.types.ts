import type { components } from "@/shared/types/api.generated";

export type Conversation = components["schemas"]["Conversation"];
export type ConversationLastMessage = components["schemas"]["ConversationLastMessage"];

export type OwnerProfile = NonNullable<Conversation["owner"]>;

export interface ConversationResponse {
  conversation: Conversation;
}

export interface ConversationsListResponse {
  conversations: Conversation[];
}
