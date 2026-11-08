import { RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import type { PendingMessage } from "@/features/chat/types/chat.types";

interface MessageUploadProgressProps {
  pendingMessage?: PendingMessage;
  onRetry?: (msg: PendingMessage) => void;
  onCancelUpload?: (item: PendingMessage) => void;
  onDeleteUpload?: (item: PendingMessage) => void;
}

export function MessageUploadProgress({
  pendingMessage,
  onRetry,
  onCancelUpload,
  onDeleteUpload,
}: MessageUploadProgressProps) {
  const upload = pendingMessage?.upload;
  if (!upload) return null;

  return (
    <div className="mt-2 space-y-1.5 rounded-md bg-background/35 p-2 text-xs">
      {upload.stage === "error" ? (
        <>
          <p className="text-destructive font-medium">{upload.error}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => pendingMessage && onRetry?.(pendingMessage)}
            >
              <RotateCcw className="mr-1 size-3.5" />
              Retry
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => pendingMessage && onDeleteUpload?.(pendingMessage)}
            >
              <Trash2 className="mr-1 size-3.5" />
              Delete
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <span>
              {upload.stage === "preparing"
                ? "Preparing…"
                : upload.stage === "sending"
                  ? "Sending…"
                  : `Uploading ${upload.progress}%`}
            </span>
            {upload.stage !== "sending" && (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label="Cancel upload"
                onClick={() =>
                  pendingMessage && onCancelUpload?.(pendingMessage)
                }
              >
                <X />
              </Button>
            )}
          </div>
          <Progress
            value={
              upload.stage === "uploading"
                ? upload.progress
                : upload.stage === "sending"
                  ? 100
                  : 0
            }
            aria-label="Media upload progress"
          />
        </>
      )}
    </div>
  );
}
