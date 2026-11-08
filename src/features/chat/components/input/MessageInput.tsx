import { useState, useRef, useEffect } from "react";
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

export interface MessageInputProps {
  onSend: (text: string) => boolean;
  disabled?: boolean;
  replyTo?: Message | null;
  replyToSenderName?: string;
  onCancelReply?: () => void;
  onTypingChange?: (value: string) => void;
  onStopTyping?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  onEditMessage?: (message: Message, text: string) => Promise<boolean>;
  onMediaSelect?: (file: File) => void;
  onVoiceSend?: (recording: VoiceRecording, replyToId?: string | null) => void;
  recordingEnabled?: boolean;
  captionOnly?: boolean;
  captionPlaceholder?: string;
}

export function MessageInput({
  onSend,
  disabled,
  replyTo,
  replyToSenderName,
  onCancelReply,
  onTypingChange,
  onStopTyping,
  editingMessage,
  onCancelEdit,
  onEditMessage,
  onMediaSelect,
  onVoiceSend,
  recordingEnabled = true,
  captionOnly = false,
  captionPlaceholder = "Type a message...",
}: MessageInputProps) {
  const [value, setValue] = useState(editingMessage?.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder(
    (recording) => onVoiceSend?.(recording, replyTo?.id),
    !disabled && recordingEnabled,
  );
  const isRecording = recorder.status !== "idle";
  const isLocked = recorder.status === "locked" || recorder.status === "paused";

  useEffect(() => {
    if (editingMessage) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [editingMessage]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
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
    if (!trimmed || disabled) return;
    if (!canUseChatConnection(true) || !onSend(trimmed)) return;
    onStopTyping?.();
    setValue("");
    textareaRef.current?.focus();
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
    if (isTouchDevice && !captionOnly) return;
    e.preventDefault();
    handleSend();
  };

  return (
    <>
      <AnimatePresence>
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
              onClick={onCancelReply}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={cn(
          "p-3 sm:px-6 bg-transparent flex justify-center items-end gap-2",
          captionOnly && "px-0 sm:px-0",
        )}
      >
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onMediaSelect?.(file);
            event.currentTarget.value = "";
          }}
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
              placeholder={captionPlaceholder}
              disabled={disabled}
              maxLength={captionOnly ? 2000 : undefined}
              rows={1}
              className="flex-1 bg-transparent! border-0 shadow-none focus-visible:ring-0
                    text-sm py-2 px-0 resize-none min-h-9 max-h-50 overflow-y-auto
                    [unicode-bidi:plaintext] scrollbar-hide wrap-anywhere"
            />
          </div>
        )}
        {!captionOnly && !editingMessage && !isLocked && !isRecording && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={disabled}
            aria-label="Attach image or video"
            onClick={() => {
              if (disabled || !canUseChatConnection(true)) return;
              mediaInputRef.current?.click();
            }}
            className="h-11 w-11 shrink-0 rounded-full"
          >
            <ImagePlus className="size-5" />
          </Button>
        )}
        {!isLocked &&
          !isRecording &&
          (value.trim() || editingMessage || captionOnly) && (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={
                !!editingMessage &&
                (value.trim().length > 2000 || !value.trim())
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
        {!captionOnly && !editingMessage && (
          <VoiceRecorderBar
            controls={recorder}
            showMic={!value.trim()}
            disabled={disabled}
          />
        )}
      </div>
    </>
  );
}
