import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { uploadFile } from "@/features/chat/api/uploads.service";
import { setAvatar } from "@/features/auth/api/auth.service";
import { applyUserAvatarUpdate } from "@/features/conversations/cache/conversationCache";
import { AvatarDropzone } from "./AvatarDropzone";
import {
  AvatarUploadProgress,
  type AvatarUploadStage,
} from "./AvatarUploadProgress";
import {
  avatarError,
  processAvatarImage,
} from "@/features/settings/utils/avatarUtils";

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name?: string;
  avatarUrl?: string | null;
}

export function AvatarUploadDialog({
  open,
  onOpenChange,
  name,
  avatarUrl,
}: AvatarUploadDialogProps) {
  const { user, updateAvatar } = useAuth();
  const client = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [stage, setStage] = useState<AvatarUploadStage | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const processIdRef = useRef(0);

  const busy =
    stage === "processing" || stage === "uploading" || stage === "saving";

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    if (!open) return;
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.items ?? [])
        .map((item) => item.getAsFile())
        .find((item): item is File => !!item && item.type.startsWith("image/"));
      if (file) {
        event.preventDefault();
        void processSelected(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open]);

  const processSelected = async (file: File) => {
    const processId = ++processIdRef.current;
    setError(null);
    setStage("processing");
    setBlob(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    try {
      const processed = await processAvatarImage(file);
      if (processId !== processIdRef.current) return;
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(processed);
      });
      setBlob(processed);
      setStage(null);
    } catch (reason) {
      if (processId === processIdRef.current) {
        setStage("error");
        setError(avatarError(reason));
      }
    }
  };

  const cancel = () => {
    processIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    onOpenChange(false);
    setBlob(null);
    setStage(null);
    setProgress(0);
    setError(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  };

  const save = async () => {
    if (!blob) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setStage("uploading");
    setProgress(0);
    try {
      const key = await uploadFile("avatar", blob, {
        signal: controller.signal,
        onProgress: setProgress,
      });
      if (controller.signal.aborted) return;
      setStage("saving");
      const { user: updated } = await setAvatar(key, controller.signal);
      if (controller.signal.aborted) return;
      applyUserAvatarUpdate(
        client,
        { id: updated.id, avatarUrl: updated.avatarUrl },
        { currentUserId: user?.id ?? updated.id, updateAvatar },
      );

      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      setBlob(null);
      setStage(null);
      setProgress(0);
      onOpenChange(false);
      toast.success("Profile photo updated.");
    } catch (reason) {
      if (!controller.signal.aborted) {
        setStage("error");
        setError(avatarError(reason));
      }
    } finally {
      abortRef.current = null;
    }
  };

  const sizeLabel = blob
    ? `${Math.max(1, Math.round(blob.size / 1024))} KB`
    : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) cancel();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update profile photo</DialogTitle>
          <DialogDescription>
            Choose a square crop. Your image will be converted to WebP and
            compressed.
          </DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Choose a profile photo"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void processSelected(file);
            event.currentTarget.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-4">
          <UserAvatar
            name={name ?? "User"}
            avatarUrl={previewUrl ?? avatarUrl}
            size="lg"
            className="size-36 shadow-md"
            fallbackClassName="text-4xl font-semibold"
          />
          <AvatarDropzone
            disabled={busy}
            onFile={(file) => void processSelected(file)}
            onInvalid={(message) => {
              setStage("error");
              setError(message);
            }}
          />
          {blob && !busy && stage !== "success" && (
            <p className="text-sm text-muted-foreground">
              Processed image · {sizeLabel}
            </p>
          )}
          {stage && (
            <div className="w-full">
              <AvatarUploadProgress stage={stage} percent={progress} />
            </div>
          )}
          {error && (
            <p role="alert" className="w-full text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={cancel}>
            {busy ? "Cancel upload" : "Cancel"}
          </Button>
          <Button
            type="button"
            disabled={!blob || busy}
            onClick={() => void save()}
          >
            {stage === "saving" ? (
              <>
                <Loader2 className="animate-spin" /> Saving…
              </>
            ) : (
              "Save photo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
