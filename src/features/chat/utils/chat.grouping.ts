import type { Message } from "@/features/chat/types/chat.types";
export interface MessageGroup { date: string; messages: Message[] }

export function isSameMessageGroup(
  previous: Message | undefined,
  current: Message,
): boolean {
  return !!previous && previous.senderId === current.senderId;
}

export function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const date = message.createdAt ? new Date(message.createdAt).toLocaleDateString("en-CA") : "unknown";
    const group = groups[groups.length - 1];
    if (group?.date === date) group.messages.push(message);
    else groups.push({ date, messages: [message] });
  }
  return groups;
}
