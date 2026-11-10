import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Eye, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { AvatarViewerModal } from "@/features/chat/components/media/AvatarViewerModal";
import { AvatarUploadDialog } from "./AvatarUploadDialog";
import { AvatarDeleteDialog } from "./AvatarDeleteDialog";

const accountKey = ["auth", "me"] as const;

export function AvatarSettings({
  name,
  avatarUrl,
}: {
  name?: string;
  avatarUrl?: string | null;
}) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4 sm:gap-5">
        <button
          type="button"
          onClick={() => setIsViewerOpen(true)}
          className="group relative shrink-0 cursor-pointer rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          title="Click to view photo"
          aria-label="View profile photo"
        >
          <UserAvatar
            name={name ?? "User"}
            avatarUrl={avatarUrl}
            className="size-24 shadow-md ring-2 ring-border/50"
            fallbackClassName="text-3xl font-semibold"
            onExpired={() =>
              void client.invalidateQueries({ queryKey: accountKey })
            }
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Eye className="size-6 text-white drop-shadow-sm" />
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <Camera className="size-4" /> Change photo
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmRemove(true)}
            >
              <Trash2 className="size-4" /> Remove photo
            </Button>
          )}
        </div>
      </div>

      <AvatarViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        avatarUrl={avatarUrl}
        name={name ?? "User"}
        layoutId="settings-profile-avatar"
      />

      <AvatarUploadDialog
        open={open}
        onOpenChange={setOpen}
        name={name}
        avatarUrl={avatarUrl}
      />

      <AvatarDeleteDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
      />
    </>
  );
}
