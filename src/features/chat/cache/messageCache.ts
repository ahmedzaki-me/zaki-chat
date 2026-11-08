import type { InfiniteData } from "@tanstack/react-query";
import type { Message, MessagesResponse } from "@/features/chat/types/chat.types";

export function upsertMessage(data: InfiniteData<MessagesResponse> | undefined, message: Message) {
  if (!data) return data;
  const exists = data.pages.some((page) => page.messages.some((item) => item.id === message.id));
  if (exists) return { ...data, pages: data.pages.map((page) => ({ ...page, messages: page.messages.map((item) => item.id === message.id ? message : item) })) };
  if (!data.pages.length) return data;
  return { ...data, pages: data.pages.map((page, index) => index === 0 ? { ...page, messages: [message, ...page.messages] } : page) };
}

export function patchMessage(data: InfiniteData<MessagesResponse> | undefined, message: Message) {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => ({ ...page, messages: page.messages.map((item) => item.id === message.id ? message : item) })) };
}

export function removeMessage(data: InfiniteData<MessagesResponse> | undefined, id: string) {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => ({ ...page, messages: page.messages.filter((item) => item.id !== id) })) };
}

export function clearMessages(data: InfiniteData<MessagesResponse> | undefined) {
  if (!data) return data;
  return { pages: data.pages.slice(0, 1).map((page) => ({ ...page, messages: [], nextCursor: null })), pageParams: data.pageParams.slice(0, 1) };
}
