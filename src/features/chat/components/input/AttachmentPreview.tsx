import { useEffect, useMemo, useState } from "react";
import { X, Video, Image as ImageIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { formatFileSize } from "@/features/chat/utils/media.constants";
import { motion } from "framer-motion";

interface AttachmentPreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

export function AttachmentPreview({
  file,
  onRemove,
  disabled = false,
}: AttachmentPreviewProps) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const isVideo = file.type.startsWith("video/");
  const isGif = file.type === "image/gif";
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-3 p-2.5 mx-3 -mb-1 rounded-xl bg-card/85 border border-border/60 shadow-xs"
    >
      <div className="relative size-14 shrink-0 rounded-lg overflow-hidden bg-muted/60 border border-border/50 flex items-center justify-center">
        {loadError ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            {isVideo ? (
              <Video className="size-5" />
            ) : (
              <ImageIcon className="size-5" />
            )}
          </div>
        ) : isVideo ? (
          <>
            <video
              src={previewUrl}
              preload="metadata"
              onError={() => setLoadError(true)}
              className="size-full object-cover"
            />
            <span className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold bg-black/75 text-white">
              <Video className="size-2.5" />
              Video
            </span>
          </>
        ) : (
          <>
            <img
              src={previewUrl}
              alt={file.name}
              onError={() => setLoadError(true)}
              className="size-full object-cover"
            />
            {isGif && (
              <span className="absolute bottom-1 right-1 rounded px-1 py-0.5 text-[9px] font-bold tracking-wider bg-black/75 text-white">
                GIF
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {file.name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatFileSize(file.size)}
        </p>
      </div>

      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        aria-label="Remove attachment"
        disabled={disabled}
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-foreground rounded-full"
      >
        <X className="size-4" />
      </Button>
    </motion.div>
  );
}
