import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { removeAvatar } from "@/features/auth/api/auth.service";
import { avatarError } from "@/features/settings/utils/avatarUtils";

const accountKey = ["auth", "me"] as const;

interface AvatarDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AvatarDeleteDialog({
  open,
  onOpenChange,
}: AvatarDeleteDialogProps) {
  const { user, accessToken, setAuth } = useAuth();
  const client = useQueryClient();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const remove = async () => {
    setIsRemoving(true);
    setError(null);
    try {
      await removeAvatar();
      if (user) {
        const updated = { ...user, avatarUrl: null };
        if (accessToken) setAuth(accessToken, updated);
        client.setQueryData(accountKey, { user: updated });
      }
      onOpenChange(false);
      toast.success("Profile photo removed.");
    } catch (reason) {
      setError(avatarError(reason));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove profile photo?</AlertDialogTitle>
          <AlertDialogDescription>
            Your initials will be shown instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isRemoving}
            onClick={(event) => {
              event.preventDefault();
              void remove();
            }}
          >
            {isRemoving ? "Removing…" : "Remove photo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
