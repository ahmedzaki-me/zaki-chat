import { useCallback, useEffect, type RefObject } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogPortal,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { retainMediaObjectUrl } from "@/features/chat/hooks/useCachedMedia";
import { useHistoryModal } from "@/shared/hooks/useHistoryModal";

type ImageViewerProps = {
  open: boolean;
  src: string;
  layoutId: string;
  originalName: string;
  caption: string | null;
  triggerRef: RefObject<HTMLImageElement | null>;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: () => void;
};

export function ImageViewer({
  open,
  src,
  layoutId,
  originalName,
  caption,
  triggerRef,
  onOpenChange,
  onCloseAutoFocus,
}: ImageViewerProps) {
  const reducedMotion = useReducedMotion();
  const y = useMotionValue(0);

  useEffect(() => {
    if (!open) return;
    return retainMediaObjectUrl(src);
  }, [open, src]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Support mobile hardware/gesture back button to close the viewer without navigating away
  useHistoryModal(open, close, "image-viewer");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.12 }
                : { duration: 0.2, ease: "easeOut" }
            }
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
            onCloseAutoFocus();
          }}
          className="fixed inset-0 z-[51] grid h-dvh w-screen max-w-none place-items-center gap-0 overflow-hidden border-0 bg-transparent p-0 text-foreground shadow-none outline-none"
        >
          <DialogTitle className="sr-only">Image viewer</DialogTitle>
          <DialogDescription className="sr-only">
            {caption || originalName || "Expanded image"}
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close image viewer"
            onClick={close}
            className="absolute right-3 top-3 z-20 size-10 text-white hover:bg-white/15 hover:text-white sm:right-5 sm:top-5"
          >
            <X className="size-5" />
          </Button>
          <motion.div
            className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 px-3 pb-6 pt-16 sm:px-8"
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <motion.img
              layoutId={reducedMotion ? undefined : layoutId}
              src={src}
              alt={originalName}
              draggable={false}
              drag="y"
              dragMomentum={false}
              dragElastic={0.72}
              style={{ y }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.12 }
                  : { type: "spring", stiffness: 420, damping: 36 }
              }
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 850) close();
                else
                  animate(y, 0, {
                    type: "spring",
                    stiffness: 320,
                    damping: 30,
                  });
              }}
              className="max-h-[calc(100dvh-10rem)] w-full max-w-full touch-pan-x rounded-sm object-contain sm:max-h-[calc(100dvh-11rem)]"
            />
            <div className="max-w-full text-center text-xs text-white/75">
              {caption && (
                <p className="max-w-[min(90vw,48rem)] truncate [unicode-bidi:plaintext]">{caption}</p>
              )}
              <p className="max-w-[min(90vw,48rem)] truncate text-white/55">
                {originalName}
              </p>
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
