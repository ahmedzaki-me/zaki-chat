import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Mic, Video, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { MessageInput } from "@/features/chat/components/input/MessageInput";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatFileSize } from "@/features/chat/utils/media.constants";
import type { Message } from "@/features/chat/types/chat.types";
import { formatDuration as formatVoiceTime } from "@/shared/lib/date";
import { canUseChatConnection } from "@/shared/lib/offlineGuard";
import { useHistoryModal } from "@/shared/hooks/useHistoryModal";

type Props = {
  file: File;
  onCancel: () => void;
  onSend: (file: File, caption: string) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
};

export function MediaPreviewScreen({
  file,
  onCancel,
  onSend,
  replyTo,
  onCancelReply,
}: Props) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const isVideo = file.type.startsWith("video/");

  // Support mobile back button to cancel media preview instead of exiting chat
  useHistoryModal(true, onCancel, "media-preview");

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);
  return (
    <main className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back to chat"
          onClick={onCancel}
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold">Send media</h1>
          <p className="truncate text-xs text-muted-foreground">{file.name}</p>
        </div>
        <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
      </header>
      <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        {!previewLoaded && (
          <Skeleton className="absolute h-48 w-48 rounded-xl" />
        )}
        {isVideo ? (
          <video
            src={previewUrl}
            controls
            preload="metadata"
            onLoadedMetadata={() => setPreviewLoaded(true)}
            onError={() => setPreviewLoaded(true)}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        ) : (
          <img
            src={previewUrl}
            alt={file.name}
            onLoad={() => setPreviewLoaded(true)}
            onError={() => setPreviewLoaded(true)}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        )}
        <div className="absolute bottom-3 left-4 right-4 text-center sm:bottom-5">
          <p className="mx-auto max-w-full truncate text-sm text-muted-foreground">
            {file.name} · {formatFileSize(file.size)}
          </p>
        </div>
      </section>
      <footer className="shrink-0 space-y-3 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        {replyTo && (
          <div className="flex items-center gap-2 rounded-md border-l-2 border-primary bg-muted/60 px-3 py-2 text-xs">
            <div className="min-w-0 flex-1">
              <p className="text-primary">Replying to</p>
              <p className="truncate text-muted-foreground">
                {replyTo.deletedAt ? (
                  "Deleted message"
                ) : replyTo.media?.kind === "voice" ? (
                  <>
                    <Mic className="mr-1 inline size-3.5" />
                    Voice message{" "}
                    {formatVoiceTime(replyTo.media.durationSec ?? 0)}
                  </>
                ) : replyTo.media?.kind === "image" ? (
                  <>
                    <ImageIcon className="mr-1 inline size-3.5" />
                    Photo
                  </>
                ) : replyTo.media?.kind === "video" ? (
                  <>
                    <Video className="mr-1 inline size-3.5" />
                    Video
                  </>
                ) : (
                  (replyTo.text ?? "Message")
                )}
              </p>
            </div>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="Cancel reply"
              onClick={onCancelReply}
            >
              <X />
            </Button>
          </div>
        )}
        <MessageInput
          captionOnly
          captionPlaceholder="Add a caption (optional)"
          onSend={(value) => {
            if (!canUseChatConnection(true)) return false;
            onSend(file, value);
            return true;
          }}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <ArrowLeft className="mr-1" />
            Cancel
          </Button>
        </div>
      </footer>
    </main>
  );
}
