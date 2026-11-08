import { api } from "@/core/http/axios";
import type { MessagesResponse } from "@/features/chat/types/chat.types";

export type GetMessagesParams = {
  before?: string;
  limit?: number;
};

export const getMessages = async (
  conversationId: string,
  params?: GetMessagesParams,
): Promise<MessagesResponse> => {
  const { data } = await api.get<MessagesResponse>(
    `/conversations/${conversationId}/messages`,
    { params },
  );

  return data;
};
