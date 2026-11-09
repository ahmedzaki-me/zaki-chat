import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Ban, Reply } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Message, PendingMessage } from "@/features/chat/types/chat.types";
import {
  parseMessageWithLinks,
  isUpTo,
} from "@/features/chat/utils/chat.utils";
import { formatTime } from "@/shared/lib/date";
import { useAuth } from "@/features/auth/hooks/useAuth";
import * as mediaCacheService from "@/features/chat/cache/mediaCache";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";

import { MessageActions } from "./MessageActions";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { MessageReplyQuote } from "./MessageReplyQuote";
import { MessageReactions } from "./MessageReactions";
import { MessageUploadProgress } from "./MessageUploadProgress";
import { MessageMediaAttachment } from "./MessageMediaAttachment";

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isConsecutive: boolean;
  onRetry?: (msg: PendingMessage) => void;
  onReply?: (msg: Message) => void;
  onEdit?: (msg: Message) => void;
  onDownloadMedia?: (msg: Message) => Promise<void>;
  repliedMessage?: Message | null;
  pendingMessage?: PendingMessage;
  onDelete?: (id: string) => void;
  onDeletePermanently?: (id: string) => void;
  canDeletePermanently?: boolean;
  onReact?: (id: string, emoji: string) => void;
  goToReply?: (id: string) => void;
  missingReply?: boolean;
  peerDeliveredUpTo?: string | null;
  peerReadUpTo?: string | null;
  repliedSenderName?: string;
  otherName?: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  onAvatarExpired?: (senderId?: string) => void;
  onMediaLoadError?: (id: string) => void;
  onCancelUpload?: (item: PendingMessage) => void;
  onDeleteUpload?: (item: PendingMessage) => void;
  showAvatar?: boolean;
}

function getInitialMediaWidth(
  meta?: mediaCacheService.MediaCacheMeta | null,
): number | null {
  if (!meta) return null;
  if (meta.width && meta.height) {
    const maxHeight = 288;
    if (meta.height > maxHeight) {
      return Math.round((maxHeight / meta.height) * meta.width);
    }
    return meta.width;
  }
  if (meta.aspectRatio && Number.isFinite(meta.aspectRatio)) {
    return Math.round(288 * meta.aspectRatio);
  }
  return null;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  isConsecutive,
  onRetry,
  onReply,
  onEdit,
  onDownloadMedia,
  repliedMessage,
  pendingMessage,
  onDelete,
  onDeletePermanently,
  canDeletePermanently,
  onReact,
  goToReply,
  missingReply,
  peerDeliveredUpTo,
  peerReadUpTo,
  repliedSenderName,
  otherName,
  senderName,
  senderAvatarUrl,
  onAvatarExpired,
  onMediaLoadError,
  onCancelUpload,
  onDeleteUpload,
  showAvatar = true,
}: MessageBubbleProps) {
  const handleAvatarExpired = useCallback(() => {
    onAvatarExpired?.(message.senderId);
  }, [onAvatarExpired, message.senderId]);

  const handleMediaLoadError = useCallback(() => {
    onMediaLoadError?.(message.id);
  }, [onMediaLoadError, message.id]);

  const isSending = pendingMessage?.status === "sending";
  const isError = pendingMessage?.status === "error";
  const dragLeft = isOwn ? -60 : 0;
  const dragRight = isOwn ? 0 : 60;
  const x = useMotionValue(0);

  const { user } = useAuth();
  const replyOpacity = useTransform(x, isOwn ? [0, -50] : [0, 50], [0, 1]);

  const isVisualMedia =
    (message.type === "image" || message.type === "video") && !!message.media;
  const cachedMeta = isVisualMedia
    ? mediaCacheService.getMemory(message.id)
    : null;
  const [renderedMediaWidth, setRenderedMediaWidth] = useState<number | null>(
    () => (isVisualMedia ? getInitialMediaWidth(cachedMeta) : null),
  );

  return (
    <motion.div
      id={`msg-${message.id}`}
      className={cn(
        "relative flex w-full items-center gap-2",
        isConsecutive ? "mt-1" : "mt-4",
      )}
      drag="x"
      dragConstraints={{ left: dragLeft, right: dragRight }}
      dragElastic={0.15}
      style={{ x }}
      onDragEnd={(_, info) => {
        const triggered = isOwn ? info.offset.x < -45 : info.offset.x > 45;
        if (triggered) onReply?.(message);
        animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      }}
    >
      <motion.div
        style={{ opacity: replyOpacity }}
        className="absolute start-0 text-muted-foreground"
      >
        <Reply className="w-4 h-4" />
      </motion.div>

      <div
        className={cn(
          "flex w-full items-start gap-2",
          isOwn ? "ms-auto flex-row-reverse" : "me-auto flex-row",
        )}
      >
        {showAvatar ? (
          <UserAvatar
            name={senderName || otherName || "User"}
            avatarUrl={senderAvatarUrl}
            size="sm"
            className={cn(
              "size-6 shrink-0 translate-y-1",
              isOwn ? "me-1" : "ms-1",
            )}
            onExpired={handleAvatarExpired}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn("size-6 shrink-0", isOwn ? "me-1" : "ms-1")}
          />
        )}

        <MessageActions
          onEdit={
            isOwn &&
            !message.deletedAt &&
            !isSending &&
            !isError &&
            !pendingMessage?.upload &&
            (message.type === "text" ||
              ((message.type === "image" || message.type === "video") &&
                !!message.text?.trim()))
              ? () => onEdit?.(message)
              : undefined
          }
          onCopy={() => {
            if (message.text && navigator.clipboard?.writeText)
              void navigator.clipboard
                .writeText(message.text)
                .catch(() => toast.error("Could not copy message"));
          }}
          historyMessage={
            user?.role === "owner" && message.editHistory?.length
              ? message
              : undefined
          }
          onDownload={
            onDownloadMedia &&
            !message.deletedAt &&
            !isSending &&
            !isError &&
            !pendingMessage?.upload &&
            (message.type === "image" || message.type === "video") &&
            message.media?.kind !== "voice"
              ? () => onDownloadMedia(message)
              : undefined
          }
          onReply={() => onReply?.(message)}
          onDelete={
            !message.deletedAt &&
            !isSending &&
            !isError &&
            (isOwn || user?.role === "owner")
              ? () => onDelete?.(message.id)
              : undefined
          }
          onDeletePermanently={() => onDeletePermanently?.(message.id)}
          canDeletePermanently={
            !!canDeletePermanently && !isSending && !isError
          }
          canReact={!message.deletedAt && !isSending && !isError}
          onReact={(emoji) => onReact?.(message.id, emoji)}
          reactions={message.reactions}
          currentUserId={user?.id}
          canCopy={!!message.text}
          canReply={!isSending && !isError && !message.id.startsWith("tmp-")}
          className={cn(
            "relative px-2 py-2 max-w-[75%] shadow-sm transition-all",
            "wrap-anywhere rounded-xl backdrop-blur flex flex-col [unicode-bidi:plaintext]",
            isOwn
              ? "bg-chart-5 text-white/90"
              : "bg-card filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] text-foreground/90",
            !isConsecutive && (isOwn ? "rounded-tr-none" : "rounded-tl-none"),
            !isConsecutive && [
              "before:content-[''] before:absolute before:top-0 before:w-3 before:h-4",
              isOwn
                ? "before:top-0 before:-right-2 before:bg-chart-5 before:[clip-path:polygon(0_0,0_100%,100%_0)]"
                : "before:top-0 before:-left-2 before:bg-card before:[clip-path:polygon(100%_0,100%_100%,0_0)]",
            ],
            isSending && "opacity-70",
            isError &&
              "border-destructive/50 bg-destructive/10 text-destructive-foreground",
          )}
        >
          {message.replyToId && (
            <MessageReplyQuote
              replyToId={message.replyToId}
              repliedMessage={repliedMessage}
              missingReply={missingReply}
              repliedSenderName={repliedSenderName}
              isOwn={isOwn}
              currentUserId={user?.id}
              otherName={otherName}
              onGoToReply={goToReply}
            />
          )}

          <MessageMediaAttachment
            message={message}
            pendingMessage={pendingMessage}
            onMediaLoadError={handleMediaLoadError}
            onMediaDimensions={setRenderedMediaWidth}
          />

          <div
            className="flex gap-1.5 flex-wrap justify-between items-center"
            style={
              isVisualMedia && renderedMediaWidth && message.text
                ? {
                    maxWidth: `${Math.max(180, Math.min(renderedMediaWidth, 420))}px`,
                    width: "100%",
                  }
                : undefined
            }
          >
            <p className="text-[17px] sm:text-[20px] [unicode-bidi:plaintext] whitespace-pre-wrap break-words">
              {message.deletedAt ? (
                <span className="opacity-60 italic">
                  <Ban className="w-4.5 h-4.5 inline mb-0.5 text-red-600 dark:text-red-700" />{" "}
                  {message.text
                    ? parseMessageWithLinks(message.text, isOwn)
                    : "This message was deleted"}
                </span>
              ) : (
                parseMessageWithLinks(message.text ?? "", isOwn)
              )}
            </p>

            <div
              className={cn(
                "flex items-end gap-1 mt-1.5 justify-self-start ml-auto [unicode-bidi:plaintext]",
                isOwn ? "justify-end" : "justify-start",
              )}
            >
              <span className="text-[11px] opacity-70">
                {formatTime(message.createdAt)}
              </span>
              {(message.editedAt ||
                (message.editHistory && message.editHistory.length > 0)) && (
                <span className="text-[10px] opacity-60">edited</span>
              )}

              {isOwn && !isSending && !isError && (
                <MessageStatusIcon
                  status={
                    isUpTo(message.id, peerReadUpTo)
                      ? "read"
                      : isUpTo(message.id, peerDeliveredUpTo)
                        ? "delivered"
                        : "sent"
                  }
                />
              )}

              {isSending && <MessageStatusIcon status="sending" />}

              {isError && !pendingMessage?.upload && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <button
                    type="button"
                    onClick={() => pendingMessage && onRetry?.(pendingMessage)}
                    className="text-[10px] font-bold underline hover:text-destructive-foreground/80 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          <MessageUploadProgress
            pendingMessage={pendingMessage}
            onRetry={onRetry}
            onCancelUpload={onCancelUpload}
            onDeleteUpload={onDeleteUpload}
          />

          {!message.deletedAt && !isSending && !isError && (
            <MessageReactions
              reactions={message.reactions}
              messageId={message.id}
              currentUserId={user?.id}
              isOwner={user?.role === "owner"}
              otherName={otherName}
              onReact={onReact}
            />
          )}
        </MessageActions>
      </div>
    </motion.div>
  );
});
