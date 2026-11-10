import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { useHistoryModal } from "@/shared/hooks/useHistoryModal";
import { ImageViewer } from "./ImageViewer";

interface AvatarViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl?: string | null;
  name: string;
  layoutId?: string;
}

export function AvatarViewerModal({
  isOpen,
  onClose,
  avatarUrl,
  name,
  layoutId,
}: AvatarViewerModalProps) {
  if (avatarUrl) {
    return (
      <ImageViewer
        open={isOpen}
        src={avatarUrl}
        layoutId={layoutId}
        title={name}
        originalName={name}
        caption={null}
        variant="avatar"
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      />
    );
  }

  return (
    <FallbackAvatarModal
      isOpen={isOpen}
      onClose={onClose}
      name={name}
      layoutId={layoutId}
    />
  );
}

function FallbackAvatarModal({
  isOpen,
  onClose,
  name,
  layoutId,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  layoutId?: string;
}) {
  // Support mobile hardware/gesture back button to close the modal
  useHistoryModal(isOpen, onClose, "avatar-viewer");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            layoutId={layoutId}
            className="relative z-10 aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex size-full items-center justify-center">
              <UserAvatar
                name={name}
                size="lg"
                className="size-full rounded-none text-6xl"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile photo"
              className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60 focus:outline-hidden"
            >
              <X className="size-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
