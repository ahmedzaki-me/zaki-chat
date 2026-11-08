import { Ban, Image as ImageIcon, Mic, Video } from "lucide-react";
import type { Conversation } from "@/features/conversations/types/conversation.types";
import { TypingDots } from "@/features/presence/components/TypingDots";
import { MessageStatusIcon } from "@/features/chat/components/bubble/MessageStatusIcon";
import { formatDuration as formatVoiceTime } from "@/shared/lib/date";
import { isUpTo } from "@/features/chat/utils/chat.utils";

interface LastMessagePreviewProps {
  conversation: Conversation;
  ownerId?: string;
  typing: boolean;
}

export function LastMessagePreview({
  conversation,
  ownerId,
  typing,
}: LastMessagePreviewProps) {
  if (typing) {
    return (
      <span className="italic text-primary">
        typing <TypingDots />
      </span>
    );
  }

  const last = conversation.lastMessage;
  if (!last) {
    return <span className="text-muted-foreground">No messages yet</span>;
  }

  const status =
    last.senderId === ownerId ? (
      <MessageStatusIcon
        status={
          isUpTo(last.id, conversation.peerReadUpTo)
            ? "read"
            : isUpTo(last.id, conversation.peerDeliveredUpTo)
              ? "delivered"
              : "sent"
        }
      />
    ) : null;

  if (last.text?.trim()) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${
          last.deletedAt ? "italic text-muted-foreground" : ""
        }`}
      >
        {last.deletedAt && <Ban className="mr-1 inline size-3.5" />}
        {last.text}
        {status}
      </span>
    );
  }

  if (last.deletedAt) {
    return (
      <span className="inline-flex items-center gap-1 italic text-muted-foreground">
        <Ban className="mr-1 inline size-3.5" />
        Deleted message{status}
      </span>
    );
  }

  if ((last.media?.kind ?? last.type) === "image") {
    return (
      <span className="inline-flex items-center gap-1">
        <ImageIcon className="size-3.5" />
        Photo{status}
      </span>
    );
  }

  if ((last.media?.kind ?? last.type) === "video") {
    return (
      <span className="inline-flex items-center gap-1">
        <Video className="size-3.5" />
        Video{status}
      </span>
    );
  }

  if (last.type === "voice") {
    return (
      <span className="inline-flex items-center gap-1">
        <Mic className="size-3.5" />
        Voice message{" "}
        {formatVoiceTime(last.media?.durationSec ?? last.durationSec ?? 0)}
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      Message {status}
    </span>
  );
}
