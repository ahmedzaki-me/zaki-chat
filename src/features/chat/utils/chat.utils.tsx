export {
  formatDateLabel,
  formatTime,
  formatDateTime,
  formatConversationDate,
  formatDuration,
} from "@/shared/lib/date";

export function parseMessageWithLinks(
  text: string,
  isOwn: boolean,
): React.ReactNode[] {
  const URL_REGEX =
    /(https?:\/\/[^\s]+|(?<![\w.])(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;

  return text
    .split(URL_REGEX)
    .filter((part) => part !== undefined && part !== "")
    .map((part, index) => {
      const isUrl = /^(https?:\/\/|(?:[a-z0-9-]+\.)+[a-z]{2,})/i.test(part);
      if (isUrl) {
        const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${isOwn ? "text-white" : "text-blue-500"} hover:text-blue-300 underline break-all wrap-break-word transition-colors`}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
}

export function getInitials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isUpTo(id: string, watermark?: string | null): boolean {
  return !!watermark && id <= watermark;
}

export function groupReactions(
  reactions: import("@/features/chat/types/chat.types").Reaction[],
  myId?: string,
) {
  const groups = new Map<
    string,
    { emoji: string; count: number; active: boolean; userIds: string[] }
  >();
  reactions.forEach(({ emoji, userId }) => {
    const group = groups.get(emoji) ?? {
      emoji,
      count: 0,
      active: false,
      userIds: [],
    };
    group.count += 1;
    group.active ||= userId === myId;
    group.userIds.push(userId);
    groups.set(emoji, group);
  });
  return [...groups.values()];
}
