import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { UserAvatar } from "@/shared/components/UserAvatar";
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

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <UserAvatar
          name={name ?? "User"}
          avatarUrl={avatarUrl}
          size="lg"
          className="size-16"
          onExpired={() =>
            void client.invalidateQueries({ queryKey: accountKey })
          }
        />
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <Camera /> Change photo
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmRemove(true)}
          >
            <Trash2 /> Remove photo
          </Button>
        )}
      </div>

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
