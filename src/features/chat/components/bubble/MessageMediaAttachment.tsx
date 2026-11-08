import { useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Download,
  GlobeOff,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Video,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatFileSize } from "@/features/chat/utils/media.constants";
import { useCachedMedia } from "@/features/chat/hooks/useCachedMedia";
import * as mediaCacheService from "@/features/chat/cache/mediaCache";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { ImageViewer } from "@/features/chat/components/media/ImageViewer";
import {
  ChatVideoThumbnail,
  VideoViewer,
} from "@/features/chat/components/media/ChatVideo";
import { VoiceMessageBubble } from "./VoiceMessageBubble";
import type { Message, PendingMessage } from "@/features/chat/types/chat.types";

interface MessageMediaAttachmentProps {
  message: Message;
  pendingMessage?: PendingMessage;
  onMediaLoadError?: () => void;
}

export function MessageMediaAttachment({
  message,
  pendingMessage,
  onMediaLoadError,
}: MessageMediaAttachmentProps) {
  const reducedMotion = useReducedMotion();
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLButtonElement>(null);

  const [imageViewer, setImageViewer] = useState<{
    src: string;
    open: boolean;
  } | null>(null);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);

  const cachedMeta = mediaCacheService.getMemory(message.id);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(
    () => cachedMeta?.aspectRatio ?? null,
  );

  const mediaCache = useCachedMedia(
    message.id,
    message.media,
    !pendingMessage?.upload,
    onMediaLoadError,
  );
  const { networkOnline } = useOnlineStatus();

  const [failedMediaUrl, setFailedMediaUrl] = useState<string | null>(null);
  const [loadedMediaUrl, setLoadedMediaUrl] = useState<string | null>(null);

  const mediaUrl = message.media?.url;
  const isLocalUpload = !!pendingMessage?.upload;
  const resolvedMediaUrl = isLocalUpload
    ? mediaUrl
    : (mediaCache.objectUrl ?? mediaCache.fallbackUrl);
  const shouldLoadMedia =
    isLocalUpload || mediaCache.hasCachedBlob || !!mediaCache.fallbackUrl;
  const mediaLoadFailed = !!mediaUrl && failedMediaUrl === mediaUrl;
  const mediaLoading =
    shouldLoadMedia &&
    !!resolvedMediaUrl &&
    !mediaLoadFailed &&
    loadedMediaUrl !== resolvedMediaUrl;

  const markMediaLoaded = () => {
    if (!resolvedMediaUrl) return;
    setLoadedMediaUrl(resolvedMediaUrl);
  };

  if (!message.media || message.deletedAt) return null;

  if (message.media.kind === "voice") {
    return (
      <div className="mb-1 w-fit max-w-full overflow-hidden rounded-lg">
        <VoiceMessageBubble
          messageId={message.id}
          media={message.media}
          isLocalUpload={isLocalUpload}
          localUrl={resolvedMediaUrl ?? null}
          cache={mediaCache}
          onMediaLoadError={onMediaLoadError}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-1 w-fit max-w-full overflow-hidden rounded-lg">
        {!isLocalUpload && !mediaCache.cacheChecked ? (
          <Card
            size="sm"
            className="flex-row items-center gap-3 px-3 py-2 text-card-foreground"
          >
            <Skeleton className="size-5 shrink-0 rounded" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ) : mediaCache.loading ? (
          <Card size="sm" className="space-y-2 px-3 py-3 text-card-foreground">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Downloading media
                {mediaCache.progress.percent === null
                  ? "…"
                  : ` ${mediaCache.progress.percent}%`}
              </span>
              {mediaCache.progress.percent === null && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
            </div>
            <Progress
              value={mediaCache.progress.percent ?? 0}
              aria-label="Media download progress"
            />
            {mediaCache.progress.total && (
              <p className="text-[11px] text-muted-foreground">
                {formatFileSize(mediaCache.progress.loaded)} of{" "}
                {formatFileSize(mediaCache.progress.total)}
              </p>
            )}
          </Card>
        ) : !networkOnline && !mediaCache.hasCachedBlob && !isLocalUpload ? (
          <Card
            size="sm"
            className="flex-row items-center justify-between gap-3 px-3 text-card-foreground"
          >
            <span className="min-w-0 text-sm text-muted-foreground">
              {message.media.originalName}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled
              aria-label="Offline"
            >
              Offline
            </Button>
          </Card>
        ) : mediaCache.error || (mediaLoadFailed && shouldLoadMedia) ? (
          <Card
            size="sm"
            className="flex-row items-center justify-between gap-3 px-3 text-card-foreground"
          >
            <span className="min-w-0 text-sm text-muted-foreground">
              {mediaCache.error ?? "Could not load this media."}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setFailedMediaUrl(null);
                setLoadedMediaUrl(null);
                if (!isLocalUpload) void mediaCache.retry();
              }}
            >
              <RotateCcw className="mr-1 size-3.5" />
              Retry
            </Button>
          </Card>
        ) : !isLocalUpload && !shouldLoadMedia ? (
          <Card
            size="sm"
            className="flex-row items-center gap-3 px-3 text-card-foreground"
          >
            {message.media.kind === "video" ? (
              <Video className="size-5 shrink-0 text-muted-foreground" />
            ) : (
              <ImageIcon className="size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium"
                title={message.media.originalName}
              >
                {message.media.originalName}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {message.media.mimeType === "image/gif" && (
                  <Badge variant="secondary" className="px-1 py-0 text-[9px]">
                    GIF
                  </Badge>
                )}
                {formatFileSize(message.media.size)}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!networkOnline}
              title={!networkOnline ? "Offline" : undefined}
              onClick={() => void mediaCache.download()}
            >
              {networkOnline ? (
                <>
                  <Download className="mr-1 size-3.5" />
                  Download
                </>
              ) : (
                <GlobeOff />
              )}
            </Button>
          </Card>
        ) : (
          <div className="relative w-fit max-w-full">
            {(mediaLoading || !resolvedMediaUrl) && (
              <Skeleton className="absolute inset-0 rounded-lg" />
            )}
            {resolvedMediaUrl &&
              (message.media.kind === "video" ? (
                <ChatVideoThumbnail
                  buttonRef={videoRef}
                  src={resolvedMediaUrl}
                  title={message.media.originalName ?? "Video"}
                  onClick={() => setVideoViewerOpen(true)}
                  onLoadedMetadata={() => markMediaLoaded()}
                  onError={() => {
                    setFailedMediaUrl(mediaUrl ?? null);
                    if (!isLocalUpload) onMediaLoadError?.();
                  }}
                  messageId={message.id}
                  initialAspectRatio={cachedMeta?.aspectRatio}
                />
              ) : (
                <motion.img
                  ref={imageRef}
                  layoutId={
                    reducedMotion ? undefined : `message-image-${message.id}`
                  }
                  src={resolvedMediaUrl}
                  alt={message.media.originalName}
                  loading="lazy"
                  tabIndex={isLocalUpload ? undefined : 0}
                  role={isLocalUpload ? undefined : "button"}
                  aria-label={
                    isLocalUpload
                      ? undefined
                      : `View image: ${message.media.originalName}`
                  }
                  onClick={() =>
                    !isLocalUpload &&
                    setImageViewer({
                      src: resolvedMediaUrl,
                      open: true,
                    })
                  }
                  onKeyDown={(event) => {
                    if (
                      isLocalUpload ||
                      (event.key !== "Enter" && event.key !== " ")
                    )
                      return;
                    event.preventDefault();
                    setImageViewer({
                      src: resolvedMediaUrl,
                      open: true,
                    });
                  }}
                  onLoad={(event) => {
                    markMediaLoaded();
                    const target = event.currentTarget;
                    if (target.naturalWidth && target.naturalHeight) {
                      const nextAspectRatio =
                        target.naturalWidth / target.naturalHeight;
                      setImageAspectRatio(nextAspectRatio);
                      void mediaCacheService.updateMetadata(message.id, {
                        aspectRatio: nextAspectRatio,
                      });
                    }
                  }}
                  onError={() => {
                    setFailedMediaUrl(mediaUrl ?? null);
                    if (!isLocalUpload) onMediaLoadError?.();
                  }}
                  style={{
                    aspectRatio:
                      imageAspectRatio && Number.isFinite(imageAspectRatio)
                        ? `${imageAspectRatio}`
                        : undefined,
                  }}
                  className="max-h-72 w-auto max-w-full cursor-pointer rounded-lg object-contain"
                />
              ))}
          </div>
        )}
      </div>

      {imageViewer && message.media?.kind === "image" && (
        <ImageViewer
          open={imageViewer.open}
          src={imageViewer.src}
          layoutId={`message-image-${message.id}`}
          originalName={message.media.originalName ?? "Image"}
          caption={message.text ?? null}
          triggerRef={imageRef}
          onOpenChange={(open) =>
            setImageViewer((current) => (current ? { ...current, open } : null))
          }
          onCloseAutoFocus={() => setImageViewer(null)}
        />
      )}

      {message.media?.kind === "video" &&
        videoViewerOpen &&
        resolvedMediaUrl && (
          <VideoViewer
            open={videoViewerOpen}
            src={resolvedMediaUrl}
            title={message.media.originalName ?? "Video"}
            triggerRef={videoRef}
            onOpenChange={setVideoViewerOpen}
            onCloseAutoFocus={() => setVideoViewerOpen(false)}
          />
        )}
    </>
  );
}
