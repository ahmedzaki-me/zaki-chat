import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  SendHorizontal,
  CheckCheck,
  AlertCircle,
  Reply,
  X,
  Ban,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { type Message } from "./chat.types";
import { parseMessageWithLinks, formatTime } from "./chat.utils";
import { useAuth } from "@/hooks/useAuth";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";

import { MessageActions } from "./MessageActions";
import { deleteMessage } from "@/hooks/actions";

// ─── DateSeparator ───────────────────────────────────────────────────────────

export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <Separator className="flex-1" />
      <Badge
        variant="secondary"
        className="text-[11px] font-normal px-3 py-0.5 rounded-full"
      >
        {label}
      </Badge>
      <Separator className="flex-1" />
    </div>
  );
}

// ─── MessageBubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isConsecutive: boolean;
  onRetry?: (msg: Message) => void;
  onReply?: (msg: Message) => void;
}

export function MessageBubble({
  message,
  isOwn,
  isConsecutive,
  onRetry,
  onReply,
}: MessageBubbleProps) {
  const isSending = message.status === "sending";
  const isError = message.status === "error";
  const dragLeft = isOwn ? -60 : 0;
  const dragRight = isOwn ? 0 : 60;
  const x = useMotionValue(0);

  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const replyOpacity = useTransform(x, isOwn ? [0, -50] : [0, 50], [0, 1]);

  const handleScrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-msg");
      setTimeout(() => {
        el.classList.remove("highlight-msg");
      }, 2000);
    } else {
      toast("Scroll up to find this message", {
        icon: "↑",
        description: "This message hasn't been loaded yet",
      });
    }
  }, []);

  return (
    <motion.div
      id={`msg-${message.id}`}
      className={cn(
        "flex items-center gap-2 ",
        isOwn ? "flex-row-reverse" : "flex-row",
        isConsecutive ? "mt-1" : "mt-4",
      )}
      drag="x"
      dragConstraints={{ left: dragLeft, right: dragRight }}
      dragElastic={0.15}
      style={{ x }}
      onDragEnd={(_, info) => {
        const triggered = isOwn ? info.offset.x < -45 : info.offset.x > 45;
        if (triggered) onReply?.(message);
        animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      }}
    >
      <motion.div
        style={{ opacity: replyOpacity }}
        className="text-muted-foreground"
      >
        <Reply className="w-4 h-4" />
      </motion.div>

      <div
        className={cn(
          "relative max-w-[75%] px-2 py-2 shadow-sm transition-all",
          "wrap-anywhere rounded-xl backdrop-blur flex flex-col",
          isOwn
            ? "bg-chart-5 text-white/90"
            : "bg-card filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] text-foreground/90",
          !isConsecutive && (isOwn ? "rounded-tr-none" : "rounded-tl-none"),
          !isConsecutive && [
            "before:content-[''] before:absolute before:top-0 before:w-3 before:h-4",
            isOwn
              ? "before:top-0 before:-right-2 before:bg-chart-5 before:[clip-path:polygon(0_0,0_100%,100%_0)]"
              : "before:top-0 before:-left-2 before:bg-card before:[clip-path:polygon(100%_0,100%_100%,0_0)]",
          ],
          isSending && "opacity-70",
          isError &&
            "border-destructive/50 bg-destructive/10 text-destructive-foreground",
        )}
      >
        {message.reply_to_id && (
          <button
            onClick={() => {
              if (message?.reply_to_id) {
                handleScrollToMessage(message.reply_to_id);
              }
            }}
            className={`text-[13px] rounded-sm opacity-85 border-l-4
                    pl-2 py-1 pr-1  mb-1 truncate whitespace-normal overflow-hidden
                    [unicode-bidi:plaintext] line-clamp-3 text-start  ${
                      isOwn
                        ? " bg-black/35 border-white/50 text-white"
                        : " bg-[#ddd] dark:bg-[#444] border-chart-5/90 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] text-foreground/90"
                    }`}
          >
            <p>
              {message.reply_to?.sender_id === user?.id
                ? "you"
                : !isOwner && "Ahmed Zaki"}
            </p>

            {message.reply_to?.is_deleted ? (
              <span className="opacity-60 italic">
                {message.reply_to?.content ? (
                  <>
                    <Ban className="w-5 h-5 inline" />{" "}
                    {message.reply_to?.content}
                  </>
                ) : (
                  "Deleted Message"
                )}
              </span>
            ) : (
              message.reply_to?.content
            )}
          </button>
        )}
        <MessageActions
          onCopy={() => navigator.clipboard.writeText(message.content)}
          onReply={() => onReply?.(message)}
          onDelete={
            isOwn && !message.is_deleted
              ? () => deleteMessage(message.id)
              : undefined
          }
        >
          <div className="flex gap-1.5 flex-wrap">
            <p className="text-[16px] [unicode-bidi:plaintext] whitespace-pre-wrap">
              {message.is_deleted ? (
                <span className="opacity-60 italic">
                  <Ban className="w-4.5 h-4.5 inline mb-0.5 text-red-600 dark:text-red-700" />{" "}
                  {message.content
                    ? parseMessageWithLinks(message.content, isOwn)
                    : "This message was deleted"}
                </span>
              ) : (
                parseMessageWithLinks(message.content, isOwn)
              )}
            </p>

            <div
              className={cn(
                "flex items-end gap-1 mt-1.5 justify-self-start ml-auto",
                isOwn ? "justify-end" : "justify-start",
              )}
            >
              <span className="text-[11px] opacity-70">
                {formatTime(message.created_at)}
              </span>

              {isOwn && !isSending && !isError && (
                <CheckCheck
                  className={cn(
                    "h-4 w-4",
                    message.is_read ? "text-sky-300" : "text-white/80",
                  )}
                />
              )}

              {isSending && (
                <div className="h-2.5 w-2.5 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
              )}

              {isError && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <button
                    onClick={() => onRetry?.(message)}
                    className="text-[10px] font-bold underline hover:text-destructive-foreground/80"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </MessageActions>
      </div>
    </motion.div>
  );
}

// ─── MessageInput ─────────────────────────────────────────────────────────────

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  onSend,
  disabled,
  replyTo,
  onCancelReply,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return;
    e.preventDefault();
    handleSend();
  };

  return (
    <>
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-2 p-4 mx-3 -mb-1 rounded-xl bg-card/85 border border-border/60"
          >
            <div className="flex-1 border-l-2 border-primary pl-2 min-w-0">
              <p className="text-[11px] text-primary font-medium">
                Replying to
              </p>

              <p className="text-xs opacity-60 truncate">
                {replyTo.is_deleted ? (
                  <span className="opacity-60">
                    <Ban className="w-5 h-5 inline" />
                    {replyTo.content ? replyTo.content : " Deleted message"}
                  </span>
                ) : (
                  replyTo.content
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
      <div className="p-3 sm:px-6 bg-transparent flex justify-center items-end gap-2">
        <div
          className="flex-1 flex items-center gap-2 bg-card/80 border border-border/80
                  rounded-4xl px-4 py-1.5 focus-within:ring-1 focus-within:ring-primary/20"
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent! border-0 shadow-none focus-visible:ring-0
                    text-sm py-2 px-0 resize-none min-h-9 max-h-50 overflow-y-auto
                    [unicode-bidi:plaintext] scrollbar-hide"
          />
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          className="h-11 w-11 rounded-full shrink-0 p-0 hover:bg-chart-5!
                text-white bg-chart-5 flex items-center justify-center
                  focus-within:ring-1 focus-within:ring-primary/20"
        >
          <SendHorizontal className="size-6" />
        </Button>
      </div>
    </>
  );
}
