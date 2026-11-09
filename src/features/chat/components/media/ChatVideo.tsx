import {
  setCachedMediaDimensions,
} from "@/features/chat/utils/media.constants";
import { formatDuration as formatTime } from "@/shared/lib/date";
import {
  useCallback,
  useEffect,
  memo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogPortal,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { retainMediaObjectUrl } from "@/features/chat/hooks/useCachedMedia";
import { useHistoryModal } from "@/shared/hooks/useHistoryModal";

type VideoViewerProps = {
  open: boolean;
  src: string;
  title: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: () => void;
};
type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};
type OrientationScreen = Screen & {
  orientation: ScreenOrientation & {
    lock?: (orientation: string) => Promise<void>;
    unlock?: () => void;
  };
};
type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function VideoViewer({
  open,
  src,
  title,
  triggerRef,
  onOpenChange,
  onCloseAutoFocus,
}: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    side: "left" | "right";
  } | null>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const fullscreenResumeRef = useRef(false);
  const fullscreenResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const touch =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;
  const pause = useCallback(() => {
    videoRef.current?.pause();
    setPlaying(false);
  }, []);
  const seek = useCallback((delta: number) => {
    const video = videoRef.current;
    if (video)
      video.currentTime = Math.max(
        0,
        Math.min(video.duration || 0, video.currentTime + delta),
      );
  }, []);
  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (video?.paused) void video.play();
    else pause();
  }, [pause]);
  const setVolumeValue = (next: number) => {
    const value = Math.max(0, Math.min(1, next));
    setVolume(value);
    setMuted(value === 0);
    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
  };
  const toggleMute = useCallback(() => {
    const nextMuted = !muted;
    if (!nextMuted && volume === 0) {
      setVolumeValue(0.5);
      return;
    }
    setMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
  }, [muted, volume]);
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current as FullscreenElement | null;
    const video = videoRef.current as FullscreenVideo | null;
    if (!video) return;
    try {
      fullscreenResumeRef.current = !video.paused;
      if (fullscreenResumeTimerRef.current)
        clearTimeout(fullscreenResumeTimerRef.current);
      fullscreenResumeTimerRef.current = setTimeout(() => {
        fullscreenResumeRef.current = false;
      }, 800);
      if (
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement
      ) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else
          (
            document as Document & { webkitExitFullscreen?: () => void }
          ).webkitExitFullscreen?.();
        return;
      }
      if (container?.requestFullscreen) await container.requestFullscreen();
      else if (container?.webkitRequestFullscreen)
        await container.webkitRequestFullscreen();
      else {
        video?.webkitEnterFullscreen?.();
        return;
      }
      if (touch && video) {
        try {
          if (video.videoWidth > video.videoHeight) {
            await (screen as OrientationScreen).orientation?.lock?.("landscape");
          } else {
            await (screen as OrientationScreen).orientation?.lock?.("portrait");
          }
        } catch {
          /* unsupported */
        }
      }
    } catch {
      /* Fullscreen is unavailable in this browser context. */
    }
  }, [touch]);

  // Handle mobile back button without exiting the chat
  useHistoryModal(
    open,
    () => {
      if (fullscreen) {
        void toggleFullscreen();
      } else {
        onOpenChange(false);
      }
    },
    "video-viewer",
  );

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (playing && !speedOpen && !dragging)
      timerRef.current = setTimeout(() => setControlsVisible(false), 5000);
  }, [playing, speedOpen, dragging]);
  useEffect(() => {
    const cleanupUrl = retainMediaObjectUrl(src);
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 1;
      video.volume = 1;
      video.muted = false;
    }
    return () => {
      video?.pause();
      cleanupUrl();
    };
  }, [src, open]);
  useEffect(() => {
    const video = videoRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      if (
        event.key === " " &&
        target instanceof HTMLElement &&
        target.closest("button")
      )
        return;
      if (event.key === "Escape") {
        if (speedOpen) setSpeedOpen(false);
        else if (fullscreen) void toggleFullscreen();
        else onOpenChange(false);
        return;
      }
      if (event.code === "Space" || event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seek(-10);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seek(10);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setVolumeValue(volume + 0.1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setVolumeValue(volume - 0.1);
      } else if (event.key.toLowerCase() === "m") toggleMute();
      else if (event.key.toLowerCase() === "f") void toggleFullscreen();
    };
    const onFullscreenChange = () => {
      const isFull =
        !!document.fullscreenElement ||
        !!(document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement ||
        !!(videoRef.current as FullscreenVideo | null)
          ?.webkitDisplayingFullscreen;
      setFullscreen(isFull);
      if (fullscreenResumeRef.current) {
        setPlaying(true);
        if (videoRef.current?.paused)
          void videoRef.current.play().catch(() => {});
      }
      if (!isFull) {
        try {
          (screen as OrientationScreen).orientation?.unlock?.();
        } catch {
          /* unsupported */
        }
      }
    };
    const onVideoFullscreenChange = onFullscreenChange;
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    video?.addEventListener("webkitbeginfullscreen", onVideoFullscreenChange);
    video?.addEventListener("webkitendfullscreen", onVideoFullscreenChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFullscreenChange,
      );
      video?.removeEventListener(
        "webkitbeginfullscreen",
        onVideoFullscreenChange,
      );
      video?.removeEventListener(
        "webkitendfullscreen",
        onVideoFullscreenChange,
      );
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (tapTimer.current) clearTimeout(tapTimer.current);
      if (fullscreenResumeTimerRef.current)
        clearTimeout(fullscreenResumeTimerRef.current);
    };
  }, [
    open,
    onOpenChange,
    fullscreen,
    speedOpen,
    toggleFullscreen,
    togglePlayback,
    seek,
    volume,
    toggleMute,
  ]);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!speedOpen && playing)
      timerRef.current = setTimeout(() => setControlsVisible(false), 5000);
  }, [speedOpen, playing]);
  const handleTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    const t = event.changedTouches[0];
    const now = Date.now();
    const previous = tapRef.current;
    if (
      previous &&
      now - previous.time < 300 &&
      Math.abs(t.clientX - previous.x) < 70 &&
      Math.abs(t.clientY - previous.y) < 70
    ) {
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
        tapTimer.current = null;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const back = t.clientX < rect.left + rect.width / 2;
      seek(back ? -10 : 10);
      setFeedback({
        text: back ? "-10s" : "+10s",
        side: back ? "left" : "right",
      });
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFeedback(null), 700);
      tapRef.current = null;
      showControls();
    } else {
      tapRef.current = { time: now, x: t.clientX, y: t.clientY };
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => {
        setControlsVisible((visible) => {
          const next = !visible;
          if (timerRef.current) clearTimeout(timerRef.current);
          if (next && playing && !speedOpen && !dragging) {
            timerRef.current = setTimeout(
              () => setControlsVisible(false),
              5000,
            );
          }
          return next;
        });
        tapRef.current = null;
      }, 280);
    }
  };
  const buttonClass =
    "size-11 shrink-0 text-white hover:bg-white/15 hover:text-white";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90" />
        <DialogPrimitive.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
            onCloseAutoFocus();
          }}
          className="fixed inset-0 z-[51] flex h-dvh w-screen max-w-none items-center justify-center border-0 bg-transparent p-0 text-white shadow-none outline-none"
        >
          <DialogTitle className="sr-only">Video viewer</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
          <div
            ref={containerRef}
            className={cn(
              "relative flex h-full w-full items-center justify-center bg-black overflow-hidden",
              fullscreen && "fixed inset-0 h-dvh w-screen max-h-screen max-w-screen z-[100]",
            )}
            onPointerMove={showControls}
            onTouchStart={handleTouch}
            onClick={(e) => {
              if (e.detail === 1 && !touch) showControls();
            }}
          >
            <video
              ref={videoRef}
              src={src}
              autoPlay
              playsInline
              preload="metadata"
              aria-label={title}
              className={cn(
                "max-h-full max-w-full object-contain transition-all duration-150",
                fullscreen && "h-full w-full max-h-screen max-w-screen object-contain",
              )}
              onClick={() => {
                if (!touch) setControlsVisible((v) => !v);
              }}
              onPlay={() => {
                setPlaying(true);
                showControls();
              }}
              onPause={() => {
                setPlaying(false);
                setControlsVisible(true);
              }}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                setDuration(e.currentTarget.duration);
                setSpeed(1);
                setVolume(1);
                setMuted(false);
                e.currentTarget.playbackRate = 1;
                e.currentTarget.volume = 1;
                e.currentTarget.muted = false;
              }}
              onProgress={(e) => {
                const v = e.currentTarget;
                if (v.buffered.length)
                  setBuffered(v.buffered.end(v.buffered.length - 1));
              }}
              onDurationChange={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setPlaying(false)}
            />
            {feedback && (
              <div
                className={cn(
                  "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-5 py-4 text-xl font-semibold",
                  feedback.side === "left" ? "left-1/4" : "right-1/4",
                )}
              >
                {feedback.text}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close video viewer"
              onClick={() => {
                if (fullscreen) void toggleFullscreen();
                else onOpenChange(false);
              }}
              className={cn(
                "absolute right-3 top-3 z-10 size-11 text-white hover:bg-white/15 hover:text-white",
                !controlsVisible && playing && "opacity-0 pointer-events-none",
              )}
            >
              <X />
            </Button>
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-14 sm:px-8 transition-opacity",
                !controlsVisible && playing && "pointer-events-none opacity-0",
              )}
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Back 10 seconds"
                  onClick={() => seek(-10)}
                  className={buttonClass}
                >
                  <span className="relative flex size-8 items-center justify-center">
                    <RotateCcw className="size-8" />
                    <small className="absolute inset-0 flex items-center justify-center pt-0.5 text-[10px] leading-none font-extrabold">
                      10
                    </small>
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={playing ? "Pause video" : "Play video"}
                  onClick={togglePlayback}
                  className={buttonClass}
                >
                  {playing ? <Pause /> : <Play />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Forward 10 seconds"
                  onClick={() => seek(10)}
                  className={buttonClass}
                >
                  <span className="relative flex size-8 items-center justify-center">
                    <RotateCw className="size-8" />
                    <small className="absolute inset-0 flex items-center justify-center pt-0.5 text-[10px] leading-none font-extrabold">
                      10
                    </small>
                  </span>
                </Button>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="shrink-0 text-[10px] tabular-nums sm:text-xs">
                  {formatTime(currentTime)}
                </span>
                <div className="relative min-w-0 flex-1">
                  <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/30">
                    <div
                      className="h-full rounded bg-white/45"
                      style={{
                        width: `${duration ? (buffered / duration) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <input
                    aria-label="Seek video"
                    type="range"
                    min={0}
                    max={duration || 0}
                    step="0.1"
                    value={currentTime}
                    onPointerDown={() => setDragging(true)}
                    onPointerUp={() => setDragging(false)}
                    onPointerCancel={() => setDragging(false)}
                    onChange={(e) => {
                      const t = Number(e.target.value);
                      if (videoRef.current) videoRef.current.currentTime = t;
                      setCurrentTime(t);
                    }}
                    className="relative block h-8 w-full cursor-pointer accent-white"
                  />
                </div>
                <span className="shrink-0 text-[10px] tabular-nums sm:text-xs">
                  {formatTime(duration)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={muted ? "Unmute video" : "Mute video"}
                  onClick={toggleMute}
                  className={buttonClass}
                >
                  {muted || volume === 0 ? (
                    <VolumeX />
                  ) : volume < 0.5 ? (
                    <Volume1 />
                  ) : (
                    <Volume2 />
                  )}
                </Button>
                {!touch && (
                  <input
                    aria-label="Video volume"
                    type="range"
                    min={0}
                    max={1}
                    step="0.01"
                    value={muted ? 0 : volume}
                    onPointerDown={() => setDragging(true)}
                    onPointerUp={() => setDragging(false)}
                    onPointerCancel={() => setDragging(false)}
                    onChange={(e) => setVolumeValue(Number(e.target.value))}
                    className="hidden w-16 accent-white md:block"
                  />
                )}
                <div className="relative" ref={speedMenuRef}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Playback speed ${speed}x`}
                    aria-haspopup="menu"
                    aria-expanded={speedOpen}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setSpeedOpen(true);
                        requestAnimationFrame(() =>
                          speedMenuRef.current
                            ?.querySelector<HTMLButtonElement>(
                              "button[role='menuitemradio']",
                            )
                            ?.focus(),
                        );
                      }
                    }}
                    onClick={() => {
                      setSpeedOpen((value) => !value);
                      showControls();
                    }}
                    className={cn(buttonClass, "w-11 text-xs font-medium")}
                  >
                    {speed === 1 ? "1x" : `${speed}x`}
                  </Button>
                  {speedOpen && (
                    <div
                      role="menu"
                      aria-label="Playback speed"
                      onKeyDown={(event) => {
                        if (
                          event.key !== "ArrowDown" &&
                          event.key !== "ArrowUp"
                        )
                          return;
                        event.preventDefault();
                        event.stopPropagation();
                        const items = Array.from(
                          event.currentTarget.querySelectorAll<HTMLButtonElement>(
                            "button[role='menuitemradio']",
                          ),
                        );
                        const index = items.indexOf(
                          document.activeElement as HTMLButtonElement,
                        );
                        items[
                          (index +
                            (event.key === "ArrowDown" ? 1 : -1) +
                            items.length) %
                            items.length
                        ]?.focus();
                      }}
                      className="absolute bottom-full right-0 z-[60] mb-2 min-w-20 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
                    >
                      {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={speed === rate}
                          key={rate}
                          onClick={() => {
                            setSpeed(rate);
                            const video = videoRef.current;
                            if (video) video.playbackRate = rate;
                            setSpeedOpen(false);
                          }}
                          className="flex min-h-10 w-full items-center justify-between rounded-md px-3 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                        >
                          {rate}x
                          {speed === rate ? (
                            <span aria-hidden="true">✓</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={
                    fullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                  onClick={() => void toggleFullscreen()}
                  className={buttonClass}
                >
                  {fullscreen ? <Minimize /> : <Maximize />}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

type ChatVideoThumbnailProps = {
  src: string;
  title: string;
  onError: () => void;
  onLoadedMetadata: (duration: number, width?: number, height?: number) => void;
  onClick: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  messageId?: string;
  initialAspectRatio?: number;
};
export const ChatVideoThumbnail = memo(function ChatVideoThumbnail({
  src,
  title,
  onError,
  onLoadedMetadata,
  onClick,
  buttonRef,
  messageId,
  initialAspectRatio,
}: ChatVideoThumbnailProps) {
  const [ratio, setRatio] = useState<number | null>(
    () => initialAspectRatio ?? null,
  );
  const [duration, setDuration] = useState(0);
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={`Play video: ${title}`}
      onClick={onClick}
      className="group relative block h-full w-full max-w-full overflow-hidden rounded-lg text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <video
        src={`${src}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        aria-hidden="true"
        onLoadedMetadata={(event) => {
          const v = event.currentTarget;
          if (v.videoWidth && v.videoHeight) {
            const nextRatio = v.videoWidth / v.videoHeight;
            setRatio(nextRatio);
            setCachedMediaDimensions(src, {
              width: v.videoWidth,
              height: v.videoHeight,
              aspectRatio: nextRatio,
            });
            if (messageId) {
              setCachedMediaDimensions(messageId, {
                width: v.videoWidth,
                height: v.videoHeight,
                aspectRatio: nextRatio,
              });
              if (
                !initialAspectRatio ||
                Math.abs(initialAspectRatio - nextRatio) > 0.01
              ) {
                void import("@/features/chat/cache/mediaCache").then(
                  ({ updateMetadata }) => {
                    void updateMetadata(messageId, {
                      aspectRatio: nextRatio,
                      width: v.videoWidth,
                      height: v.videoHeight,
                    });
                  },
                );
              }
            }
          }
          setDuration(v.duration);
          onLoadedMetadata(v.duration, v.videoWidth, v.videoHeight);
        }}
        onError={onError}
        className="block h-full w-full max-h-[320px] rounded-lg object-cover"
        style={ratio ? { aspectRatio: String(ratio) } : undefined}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition-transform group-hover:scale-105">
          <Play className="ml-1 size-7 fill-current" />
        </span>
      </span>
      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white tabular-nums">
        {formatTime(duration)}
      </span>
    </button>
  );
});
