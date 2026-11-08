import { Ban, Mic, Image as ImageIcon, Video } from "lucide-react";
import type { Message } from "@/features/chat/types/chat.types";
import { formatDuration as formatVoiceTime } from "@/shared/lib/date";

interface MessageReplyQuoteProps {
  replyToId: string;
  repliedMessage?: Message | null;
  missingReply?: boolean;
  repliedSenderName?: string;
  isOwn: boolean;
  currentUserId?: string;
  otherName?: string;
  onGoToReply?: (id: string) => void;
}

export function MessageReplyQuote({
  replyToId,
  repliedMessage,
  missingReply,
  repliedSenderName,
  isOwn,
  currentUserId,
  otherName,
  onGoToReply,
}: MessageReplyQuoteProps) {
  const senderDisplayName =
    repliedSenderName ??
    (!repliedMessage
      ? "Message"
      : repliedMessage.senderId === currentUserId
        ? "You"
        : otherName || "User");

  return (
    <button
      type="button"
      onClick={() => onGoToReply?.(replyToId)}
      className={`text-[13px] rounded-sm opacity-85 border-l-4
            pl-2 py-1 pr-1 mb-1 truncate whitespace-normal overflow-hidden
            [unicode-bidi:plaintext] line-clamp-3 text-start w-full cursor-pointer ${
              isOwn
                ? "bg-black/35 border-white/50 text-white"
                : "bg-[#ddd] dark:bg-[#444] border-chart-5/90 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] text-foreground/90"
            }`}
    >
      <p className="font-semibold text-xs mb-0.5">{senderDisplayName}</p>
      {missingReply ? (
        "Message not found or deleted"
      ) : !repliedMessage ? (
        "Message"
      ) : repliedMessage.deletedAt ? (
        <span className="opacity-60 italic">
          <Ban className="w-4 h-4 inline mr-1" />{" "}
          {repliedMessage.text ?? "Deleted message"}
        </span>
      ) : repliedMessage.media?.kind === "voice" ? (
        <span className="inline-flex items-center gap-1">
          <Mic className="size-3.5" />
          Voice message {formatVoiceTime(repliedMessage.media.durationSec ?? 0)}
        </span>
      ) : repliedMessage.media?.kind === "image" ? (
        <span className="inline-flex items-center gap-1">
          <ImageIcon className="size-3.5" />
          Photo
        </span>
      ) : repliedMessage.media?.kind === "video" ? (
        <span className="inline-flex items-center gap-1">
          <Video className="size-3.5" />
          Video
        </span>
      ) : (
        (repliedMessage.text ?? "Message")
      )}
    </button>
  );
}
