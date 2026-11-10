import {
  ChevronLeft,
  ChevronUp,
  Lock,
  LockOpen,
  Mic,
  Pause,
  Play,
  SendHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { MEDIA_LIMITS } from "@/features/chat/utils/media.constants";
import { AnimatePresence, motion } from "framer-motion";
import { formatVoiceTime, VoiceWaveform } from "./VoiceWaveform";
import type { useVoiceRecorder } from "@/features/chat/hooks/useVoiceRecorder";

type Controls = ReturnType<typeof useVoiceRecorder>;

export function VoiceRecorderBar({
  controls,
  showMic = true,
  disabled = false,
}: {
  controls: Controls;
  showMic?: boolean;
  disabled?: boolean;
}) {
  const active = controls.status !== "idle";
  const locked = controls.status === "locked" || controls.status === "paused";
  const remaining = Math.max(
    0,
    MEDIA_LIMITS.voiceMaxDurationSec - Math.floor(controls.elapsedMs / 1000),
  );
  const lockProgress = Math.min(1, Math.abs(controls.dragY) / 75);
  const cancelArmed = active && !locked && controls.dragX <= -80;

  if (!active && !showMic) return null;

  return (
    <motion.div
      animate={{ x: locked ? 0 : Math.max(-12, controls.dragX * 0.12) }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className={`relative flex items-center ${locked ? "w-full flex-1 min-w-0 gap-2 rounded-3xl border bg-card/90 px-3 py-2" : active ? "min-w-0 flex-1 gap-3" : ""}`}
    >
      <div
        className={`flex min-w-0 items-center gap-2 ${active && !locked ? "flex-1" : "hidden"}`}
      >
        <span className="size-2 shrink-0 animate-pulse rounded-full bg-red-500" />
        <VoiceWaveform
          values={controls.waveform}
          className="max-w-[35%] flex-1"
        />
        <span className="shrink-0 font-mono text-xs tabular-nums">
          {formatVoiceTime(controls.elapsedMs / 1000)}
        </span>
        {remaining <= 30 && (
          <span className="shrink-0 text-[10px] text-destructive">
            {remaining}s left
          </span>
        )}
        <AnimatePresence mode="wait" initial={false}>
          {cancelArmed ? (
            <motion.span
              key="cancel-armed"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-destructive sm:text-xs"
            >
              <Trash2 className="size-3.5" />
              Release to cancel
            </motion.span>
          ) : active && !locked ? (
            <motion.span
              key="cancel-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: Math.max(0.15, 1 + controls.dragX / 80) }}
              exit={{ opacity: 0 }}
              className="inline-flex min-w-0 shrink items-center gap-0.5 truncate text-[10px] text-muted-foreground sm:text-xs"
            >
              <motion.span
                animate={{ x: [0, -4, 0] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ChevronLeft className="size-3.5" />
              </motion.span>
              <span className="sm:hidden">Cancel</span>
              <span className="hidden sm:inline">Slide to cancel</span>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      {locked && (
        <>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Discard voice message"
            onClick={controls.cancel}
          >
            <Trash2 className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={
              controls.status === "paused"
                ? "Resume recording"
                : "Pause recording"
            }
            onClick={
              controls.status === "paused" ? controls.resume : controls.pause
            }
          >
            {controls.status === "paused" ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
          </Button>
          <VoiceWaveform
            values={controls.waveform}
            className=" flex-1"
          />
          <span className="shrink-0 font-mono text-xs tabular-nums">
            {formatVoiceTime(controls.elapsedMs / 1000)}
          </span>
          {remaining <= 30 && (
            <span className="shrink-0 text-[10px] text-destructive">
              {remaining}s
            </span>
          )}
          <Button
            type="button"
            size="icon"
            aria-label="Send voice message"
            onClick={controls.sendNow}
          >
            <SendHorizontal className="size-4" />
          </Button>
        </>
      )}
      <div
        key="gesture-button"
        className={`relative shrink-0 ${locked ? "absolute right-5 top-2 size-0 pointer-events-none" : ""}`}
      >
        <AnimatePresence initial={false}>
          {active && (
            <motion.div
              key={locked ? "lock-snapped" : "lock-hint"}
              initial={{ opacity: 0, y: 5, scale: 0.85 }}
              animate={{
                opacity: 1,
                y: locked ? -2 : Math.max(-14, controls.dragY * 0.2),
                scale: locked ? 1.08 : 0.92 + lockProgress * 0.12,
              }}
              exit={{ opacity: 0, y: -8, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className={`absolute -top-11 left-1/2 flex -translate-x-1/2 flex-col items-center pointer-events-none z-30 ${locked || lockProgress >= 0.85 ? "text-primary" : "text-muted-foreground"}`}
              aria-hidden="true"
            >
              {!locked && (
                <motion.span
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ChevronUp className="size-3" />
                </motion.span>
              )}
              {locked || lockProgress >= 0.85 ? (
                <Lock className="size-4 -translate-y-3" />
              ) : (
                <LockOpen className="size-4" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {!locked && (
          <Button
            type="button"
            size="icon"
            variant={
              cancelArmed ? "destructive" : active ? "destructive" : "outline"
            }
            aria-label={
              active
                ? cancelArmed
                  ? "Release to cancel recording"
                  : "Recording voice message; release to send"
                : "Hold to record voice message"
            }
            disabled={disabled}
            onPointerDown={controls.pointerDown}
            onPointerMove={controls.pointerMove}
            onPointerUp={controls.pointerUp}
            onPointerCancel={controls.pointerCancel}
            onLostPointerCapture={controls.pointerCancel}
            onContextMenu={(event) => event.preventDefault()}
            className={`h-11 w-11 touch-none select-none rounded-full ${active ? "animate-pulse" : ""}`}
          >
            {cancelArmed ? (
              <Trash2 className="size-5" />
            ) : (
              <Mic className="size-5" />
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
