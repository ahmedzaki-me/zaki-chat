import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  SendHorizontal,
  Check,
  X,
  Ban,
  ImagePlus,
  Image as ImageIcon,
  Video,
  Mic,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/features/chat/types/chat.types";
import {
  useVoiceRecorder,
  type VoiceRecording,
} from "@/features/chat/hooks/useVoiceRecorder";
import { canUseChatConnection } from "@/shared/lib/offlineGuard";
import { formatVoiceTime } from "./VoiceWaveform";
import { VoiceRecorderBar } from "./VoiceRecorderBar";
import { AttachmentPreview } from "./AttachmentPreview";
import { useComposerAttachments } from "./useComposerAttachments";
import { toast } from "sonner";

export interface MessageInputProps {
  onSend: (text: string) => boolean;
  onSendMedia?: (file: File, caption: string) => boolean;
  disabled?: boolean;
  replyTo?: Message | null;
  replyToSenderName?: string;
  onCancelReply?: () => void;
  onTypingChange?: (value: string) => void;
  onStopTyping?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  onEditMessage?: (message: Message, text: string) => Promise<boolean>;
  onVoiceSend?: (recording: VoiceRecording, replyToId?: string | null) => void;
  recordingEnabled?: boolean;
  chatContainerRef?: React.RefObject<HTMLElement | null>;
}

export function MessageInput({
  onSend,
  onSendMedia,
  disabled = false,
  replyTo,
  replyToSenderName,
  onCancelReply,
  onTypingChange,
  onStopTyping,
  editingMessage,
  onCancelEdit,
  onEditMessage,
  onVoiceSend,
  recordingEnabled = true,
  chatContainerRef,
}: MessageInputProps) {
  const [value, setValue] = useState(editingMessage?.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const recorder = useVoiceRecorder(
    (recording) => onVoiceSend?.(recording, replyTo?.id),
    !disabled && recordingEnabled,
  );
  const isRecording = recorder.status !== "idle";
  const isLocked = recorder.status === "locked" || recorder.status === "paused";

  const {
    attachment,
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
  } = useComposerAttachments({
    disabled,
    isEditing: !!editingMessage,
    isRecording: isRecording || isLocked,
    chatContainerRef,
    onFocusInput: focusInput,
  });

  useEffect(() => {
    if (editingMessage) {
      focusInput();
    }
  }, [editingMessage, focusInput]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();

    // 1. Edit mode
    if (editingMessage) {
      if (!trimmed || trimmed.length > 2000) return;
      if (trimmed === editingMessage.text) {
        onCancelEdit?.();
        setValue("");
        return;
      }
      void onEditMessage?.(editingMessage, trimmed).then((success) => {
        if (success) {
          setValue("");
          onCancelEdit?.();
        }
      });
      return;
    }

    // 2. Attachment mode (caption is optional)
    if (attachment) {
      if (disabled || !canUseChatConnection(true)) return;
      if (trimmed.length > 2000) {
        toast.error("Caption must be 2000 characters or fewer.");
        return;
      }
      const sent = onSendMedia ? onSendMedia(attachment, trimmed) : false;
      if (sent) {
        clearAttachment();
        setValue("");
        onStopTyping?.();
        focusInput();
      }
      return;
    }

    // 3. Plain text mode
    if (!trimmed || disabled) return;
    if (!canUseChatConnection(true) || !onSend(trimmed)) return;
    onStopTyping?.();
    setValue("");
    focusInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && editingMessage) {
      e.preventDefault();
      onCancelEdit?.();
      setValue("");
      return;
    }
    if (e.key !== "Enter" || e.shiftKey) return;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return;
    e.preventDefault();
    handleSend();
  };

  const hasSendContent = !!(value.trim() || attachment || editingMessage);

  const placeholder = editingMessage
    ? "Edit message..."
    : attachment
      ? "Add a caption (optional)..."
      : "Type a message...";

  return (
    <>
      <AnimatePresence>
        {isDragging && !editingMessage && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center justify-center gap-2 p-3 mx-3 -mb-1 rounded-xl bg-primary/10 border-2 border-dashed border-primary text-primary text-xs font-medium"
          >
            <ImagePlus className="size-4 animate-bounce" />
            Drop image, GIF, or video to attach
          </motion.div>
        )}
        {editingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-2 p-3 mx-3 -mb-1 rounded-xl bg-card/85 border border-border/60"
          >
            <div className="flex-1 border-s-2 border-primary ps-2 min-w-0">
              <p className="text-[11px] text-primary font-medium">
                Editing message
              </p>
              <p className="text-xs opacity-60 truncate">
                {editingMessage.text}
              </p>
            </div>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="Cancel edit"
              onClick={() => {
                onCancelEdit?.();
                setValue("");
              }}
            >
              <X />
            </Button>
          </motion.div>
        )}
        {replyTo && !editingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-2 p-4 mx-3 -mb-1 rounded-xl bg-card/85 border border-border/60"
          >
            <div className="flex-1 border-l-2 border-primary pl-2 min-w-0">
              <p className="text-[11px] text-primary font-medium">
                Replying to{replyToSenderName ? ` ${replyToSenderName}` : ""}
              </p>

              <p className="text-xs opacity-60 truncate">
                {replyTo.deletedAt ? (
                  <span className="opacity-60">
                    <Ban className="w-5 h-5 inline" />
                    {replyTo.text ? replyTo.text : " Deleted message"}
                  </span>
                ) : replyTo.media?.kind === "voice" ? (
                  <span className="inline-flex items-center gap-1">
                    <Mic className="size-3.5" />
                    Voice message{" "}
                    {formatVoiceTime(replyTo.media.durationSec ?? 0)}
                  </span>
                ) : replyTo.media?.kind === "image" ? (
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="size-3.5" />
                    Photo
                  </span>
                ) : replyTo.media?.kind === "video" ? (
                  <span className="inline-flex items-center gap-1">
                    <Video className="size-3.5" />
                    Video
                  </span>
                ) : (
                  (replyTo.text ?? "Message")
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {attachment && !editingMessage && (
          <AttachmentPreview
            file={attachment}
            onRemove={removeAttachment}
            disabled={disabled}
          />
        )}
      </AnimatePresence>

      <div
        onDragOver={handleComposerDragOver}
        onDrop={handleComposerDrop}
        onPaste={handlePaste}
        className={cn(
          "p-3 sm:px-6 bg-transparent flex justify-center items-end gap-2",
        )}
      >
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
        {isLocked ? null : (
          <div
            hidden={isRecording}
            className="flex-1 flex items-center gap-2 bg-card/80 border border-border/80
                  rounded-4xl px-4 py-1.5 focus-within:ring-1 focus-within:ring-primary/20"
          >
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onChangeCapture={(e) =>
                onTypingChange?.((e.target as HTMLTextAreaElement).value)
              }
              onBlur={onStopTyping}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBeforeInput={handleBeforeInput}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={2000}
              rows={1}
              className="flex-1 bg-transparent! border-0 shadow-none focus-visible:ring-0
                    text-sm py-2 px-0 resize-none min-h-9 max-h-50 overflow-y-auto
                    [unicode-bidi:plaintext] scrollbar-hide wrap-anywhere"
            />
          </div>
        )}
        {!editingMessage && !isLocked && !isRecording && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={disabled}
            aria-label="Attach image or video"
            onClick={openFilePicker}
            className="h-11 w-11 shrink-0 rounded-full"
          >
            <ImagePlus className="size-5" />
          </Button>
        )}
        {!isLocked && !isRecording && hasSendContent && (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={
              !!editingMessage && (value.trim().length > 2000 || !value.trim())
            }
            className="h-11 w-11 rounded-full shrink-0 p-0 hover:bg-chart-5!
              text-white bg-chart-5 flex items-center justify-center
                focus-within:ring-1 focus-within:ring-primary/20"
          >
            {editingMessage ? (
              <Check className="size-6" />
            ) : (
              <SendHorizontal className="size-6" />
            )}
          </Button>
        )}
        {!editingMessage && (
          <VoiceRecorderBar
            controls={recorder}
            showMic={!hasSendContent}
            disabled={disabled}
          />
        )}
      </div>
    </>
  );
}
