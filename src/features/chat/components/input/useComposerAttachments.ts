import { useState, useCallback, useRef, useEffect } from "react";
import {
  validateMediaFile,
  extensionForMime,
} from "@/features/chat/utils/media.constants";
import { canUseChatConnection } from "@/shared/lib/offlineGuard";
import { toast } from "sonner";

interface UseComposerAttachmentsOptions {
  disabled?: boolean;
  isEditing?: boolean;
  isRecording?: boolean;
  chatContainerRef?: React.RefObject<HTMLElement | null>;
  onFocusInput?: () => void;
}

export function useComposerAttachments({
  disabled,
  isEditing,
  isRecording,
  chatContainerRef,
  onFocusInput,
}: UseComposerAttachmentsOptions) {
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const attachFile = useCallback(
    (file: File): boolean => {
      if (disabled || isRecording) return false;
      if (isEditing) {
        toast.error("Media cannot be attached while editing a message.");
        return false;
      }
      if (!canUseChatConnection(true)) return false;

      const validationError = validateMediaFile(file);
      if (validationError) {
        toast.error(validationError);
        return false;
      }

      const normalized =
        !file.name || file.name === "blob"
          ? new File(
              [file],
              `attachment-${Date.now()}${extensionForMime(file.type)}`,
              { type: file.type },
            )
          : file;

      setAttachment(normalized);
      onFocusInput?.();
      return true;
    },
    [disabled, isRecording, isEditing, onFocusInput],
  );

  const removeAttachment = useCallback(() => {
    setAttachment(null);
    onFocusInput?.();
  }, [onFocusInput]);

  const clearAttachment = useCallback(() => {
    setAttachment(null);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled || isEditing || isRecording) return;
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      let fileToAttach: File | null = null;

      // Check items first (preferred in modern Chromium/Firefox/Safari)
      if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (
              file &&
              (file.type.startsWith("image/") || file.type.startsWith("video/"))
            ) {
              fileToAttach = file;
              break;
            }
          }
        }
      }

      // Fallback to files list
      if (!fileToAttach && clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (
            file.type.startsWith("image/") ||
            file.type.startsWith("video/")
          ) {
            fileToAttach = file;
            break;
          }
        }
      }

      if (fileToAttach) {
        e.preventDefault();
        attachFile(fileToAttach);
      }
    },
    [disabled, isEditing, isRecording, attachFile],
  );

  const handleBeforeInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (disabled || isEditing || isRecording) return;
      const nativeEvent = e.nativeEvent as InputEvent;
      const dataTransfer = (
        nativeEvent as unknown as { dataTransfer?: DataTransfer }
      ).dataTransfer;
      if (!dataTransfer?.files?.length) return;

      const file = dataTransfer.files[0];
      if (
        file.type.startsWith("image/") ||
        file.type.startsWith("video/")
      ) {
        e.preventDefault();
        attachFile(file);
      }
    },
    [disabled, isEditing, isRecording, attachFile],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0];
      if (file) {
        attachFile(file);
      }
      e.currentTarget.value = "";
    },
    [attachFile],
  );

  const openFilePicker = useCallback(() => {
    if (disabled || isEditing || isRecording || !canUseChatConnection(true))
      return;
    mediaInputRef.current?.click();
  }, [disabled, isEditing, isRecording]);

  const handleComposerDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled || isEditing || isRecording) return;
      if (e.dataTransfer.types.includes("Files")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    },
    [disabled, isEditing, isRecording],
  );

  const handleComposerDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled || isEditing || isRecording) return;
      const file = e.dataTransfer.files?.[0];
      if (file) {
        e.preventDefault();
        attachFile(file);
      }
    },
    [disabled, isEditing, isRecording, attachFile],
  );

  useEffect(() => {
    const container = chatContainerRef?.current;
    if (!container) return;

    const onDragEnter = (e: DragEvent) => {
      if (disabled || isEditing || isRecording) return;
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        dragCounterRef.current += 1;
        if (dragCounterRef.current === 1) {
          setIsDragging(true);
        }
      }
    };

    const onDragOver = (e: DragEvent) => {
      if (disabled || isEditing || isRecording) return;
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "copy";
        }
      }
    };

    const onDragLeave = () => {
      if (disabled || isEditing || isRecording) return;
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    };

    const onDrop = (e: DragEvent) => {
      dragCounterRef.current = 0;
      setIsDragging(false);
      if (disabled || isEditing || isRecording) return;
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        e.preventDefault();
        attachFile(file);
      }
    };

    container.addEventListener("dragenter", onDragEnter);
    container.addEventListener("dragover", onDragOver);
    container.addEventListener("dragleave", onDragLeave);
    container.addEventListener("drop", onDrop);

    return () => {
      container.removeEventListener("dragenter", onDragEnter);
      container.removeEventListener("dragover", onDragOver);
      container.removeEventListener("dragleave", onDragLeave);
      container.removeEventListener("drop", onDrop);
    };
  }, [chatContainerRef, disabled, isEditing, isRecording, attachFile]);

  return {
    attachment,
    attachFile,
    removeAttachment,
    clearAttachment,
    mediaInputRef,
    openFilePicker,
    handleFileInputChange,
    handlePaste,
    handleBeforeInput,
    handleComposerDragOver,
    handleComposerDrop,
    isDragging,
  };
}
