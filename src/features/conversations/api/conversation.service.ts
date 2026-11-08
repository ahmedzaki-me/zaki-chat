import { api } from "@/core/http/axios";
import type { ConversationResponse, ConversationsListResponse } from "@/features/conversations/types/conversation.types";

export const getConversations = async (): Promise<ConversationsListResponse> => {
  const { data } = await api.get<ConversationsListResponse>("/conversations");
  return data;
};

export const getMyConversation = async (preferredLang?: "ar" | "en"): Promise<ConversationResponse> => {
  const lang = preferredLang ?? (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en");
  const { data } = await api.get<ConversationResponse>("/conversations/me", {
    headers: { "x-lang": lang },
  });
  return data;
};

export const getConversation = async (
  conversationId: string,
): Promise<ConversationResponse> => {
  const { data } = await api.get<ConversationResponse>(
    `/conversations/${conversationId}`,
  );

  return data;
};

export const pinConversation = async (id: string): Promise<ConversationResponse> => {
  const { data } = await api.patch<ConversationResponse>(`/conversations/${id}/pin`);
  return data;
};

export const unpinConversation = async (id: string): Promise<ConversationResponse> => {
  const { data } = await api.delete<ConversationResponse>(`/conversations/${id}/pin`);
  return data;
};
