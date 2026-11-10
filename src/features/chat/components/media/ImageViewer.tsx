import { useCallback, useEffect, useRef, type RefObject } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { motion, useReducedMotion } from "framer-motion";
import {
  TransformWrapper,
  TransformComponent,
} from "react-zoom-pan-pinch";
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
import { cn } from "@/shared/lib/utils";

type ImageViewerProps = {
  open: boolean;
  src: string;
  layoutId?: string;
  originalName?: string;
  title?: string;
  caption?: string | null;
  triggerRef?: RefObject<HTMLImageElement | null>;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: () => void;
  aspectRatio?: number | null;
  variant?: "default" | "avatar";
};

export function ImageViewer({
  open,
  src,
  layoutId,
  originalName,
  title,
  caption,
  triggerRef,
  onOpenChange,
  onCloseAutoFocus,
  aspectRatio,
  variant = "default",
}: ImageViewerProps) {
  const reducedMotion = useReducedMotion();
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    return retainMediaObjectUrl(src);
  }, [open, src]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Support mobile hardware/gesture back button to close the viewer without navigating away
  useHistoryModal(open, close, "image-viewer");

  const handleBackdropPointerDown = (e: React.PointerEvent) => {
    if (e.target === e.currentTarget) {
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      pointerDownPosRef.current = null;
    }
  };

  const handleBackdropPointerUp = (e: React.PointerEvent) => {
    if (e.target === e.currentTarget && pointerDownPosRef.current) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      if (Math.hypot(dx, dy) < 5) {
        close();
      }
    }
    pointerDownPosRef.current = null;
  };

  const displayName = title ?? originalName;

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
            triggerRef?.current?.focus();
            onCloseAutoFocus?.();
          }}
          className="fixed inset-0 z-[51] h-dvh w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground shadow-none outline-none select-none touch-none"
        >
          <DialogTitle className="sr-only">
            {variant === "avatar" ? "Profile photo viewer" : "Image viewer"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {caption || displayName || "Expanded image"}
          </DialogDescription>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close image viewer"
            onClick={close}
            className="absolute right-3 top-3 z-30 size-10 text-white hover:bg-white/15 hover:text-white sm:right-5 sm:top-5"
          >
            <X className="size-5" />
          </Button>

          <TransformWrapper
            key={src}
            initialScale={1}
            minScale={1}
            maxScale={4}
            centerOnInit={true}
            centerZoomedOut={true}
            limitToBounds={true}
            wheel={{
              step: 0.08,
              ...({ smoothStep: 0.0008 } as Record<string, unknown>),
            }}
            pinch={{ step: 3 }}
            doubleClick={{ mode: "toggle", step: 0.6 }}
          >
            <TransformComponent
              wrapperStyle={{ width: "100vw", height: "100dvh" }}
              wrapperProps={{
                onPointerDown: handleBackdropPointerDown,
                onPointerUp: handleBackdropPointerUp,
              }}
            >
              <motion.img
                layoutId={reducedMotion ? undefined : layoutId}
                src={src}
                alt={displayName || "Expanded image"}
                draggable={false}
                style={{
                  aspectRatio:
                    variant === "avatar"
                      ? "1 / 1"
                      : aspectRatio && Number.isFinite(aspectRatio)
                        ? `${aspectRatio}`
                        : undefined,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                  reducedMotion
                    ? { duration: 0.12 }
                    : { type: "spring", stiffness: 420, damping: 36 }
                }
                className={cn(
                  "select-none",
                  variant === "avatar"
                    ? "max-h-[65vh] max-w-[85vw] sm:max-w-md aspect-square object-cover rounded-2xl shadow-2xl"
                    : "max-h-[calc(100dvh-10rem)] w-auto max-w-[95vw] rounded-sm object-contain sm:max-h-[calc(100dvh-11rem)]",
                )}
              />
            </TransformComponent>
          </TransformWrapper>

          {(caption || displayName) && (
            <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center gap-1 px-4 text-center text-xs text-white/75">
              {caption && (
                <p className="max-w-[min(90vw,48rem)] truncate [unicode-bidi:plaintext] font-medium text-white/90">
                  {caption}
                </p>
              )}
              {displayName && (
                <p
                  className={cn(
                    "max-w-[min(90vw,48rem)] truncate",
                    variant === "avatar"
                      ? "font-medium text-sm text-white/90"
                      : "text-white/55",
                  )}
                >
                  {displayName}
                </p>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
