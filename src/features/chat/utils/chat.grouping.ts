import type { Message, PendingMessage } from "@/features/chat/types/chat.types";
export interface MessageGroup { date: string; messages: Message[] }

export function isSameMessageGroup(
  previous: Message | undefined,
  current: Message,
): boolean {
  return !!previous && previous.senderId === current.senderId;
}

export function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  const today = new Date().toLocaleDateString("en-CA");

  for (const message of messages) {
    const isPending =
      ("status" in message && Boolean((message as PendingMessage).status)) ||
      message.id.startsWith("tmp-");

    let date = "unknown";
    if (message.createdAt) {
      const parsed = new Date(message.createdAt);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed.toLocaleDateString("en-CA");
      }
    }

    if (isPending) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date >= today) {
        date = lastGroup.date;
      } else {
        date = today;
      }
    }

    const group = groups[groups.length - 1];
    if (group?.date === date) group.messages.push(message);
    else groups.push({ date, messages: [message] });
  }
  return groups;
}
