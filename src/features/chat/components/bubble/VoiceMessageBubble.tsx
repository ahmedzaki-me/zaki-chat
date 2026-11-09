import { useEffect, useRef, useState } from "react";
import {
  Download,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  GlobeOff,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import type { Media } from "@/features/chat/types/chat.types";
import type { useCachedMedia } from "@/features/chat/hooks/useCachedMedia";
import { formatFileSize } from "@/features/chat/utils/media.constants";
import { formatDuration as formatVoiceTime } from "@/shared/lib/date";
import { VoiceWaveform } from "@/features/chat/components/input/VoiceWaveform";
import {
  registerVoiceAudio,
  useVoicePlaybackSpeed,
} from "@/features/chat/hooks/useVoicePlaybackSpeed";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";

type CacheState = ReturnType<typeof useCachedMedia>;
type Props = {
  messageId: string;
  media: Media;
  isLocalUpload: boolean;
  localUrl: string | null;
  cache: CacheState;
  onMediaLoadError?: () => void;
};

let activeAudio: HTMLAudioElement | null = null;

export function VoiceMessageBubble({
  messageId,
  media,
  isLocalUpload,
  localUrl,
  cache,
  onMediaLoadError,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);
  const [speed, cycleSpeed] = useVoicePlaybackSpeed();
  const { networkOnline } = useOnlineStatus();
  const url = isLocalUpload
    ? localUrl
    : (cache.objectUrl ?? (networkOnline ? cache.fallbackUrl : null));
  const available =
    isLocalUpload ||
    cache.hasCachedBlob ||
    (!!cache.fallbackUrl && networkOnline);
  const duration = media.durationSec ?? 0;
  const progress = duration ? Math.min(1, currentTime / duration) : 0;
  const waveform = media.waveform ?? [];
  const showSpeed = available && !playbackError && (playing || currentTime > 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    return registerVoiceAudio(audio);
  }, [messageId, url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (activeAudio && activeAudio !== audio) activeAudio.pause();
    activeAudio = audio;
    setPlaybackError(false);
    void audio.play().catch(() => setPlaybackError(true));
  };

  const seek = (event: React.PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bounds = waveformRef.current?.getBoundingClientRect();
    if (!audio || !bounds || !duration) return;
    const ratio = Math.max(
      0,
      Math.min(1, (event.clientX - bounds.left) / bounds.width),
    );
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const onError = () => {
    setPlaybackError(true);
    if (!isLocalUpload) onMediaLoadError?.();
  };

  return (
    <div className="flex w-full min-w-56 max-w-full items-center gap-2 rounded-xl bg-black/35 px-2 py-2">
      <audio
        key={`${messageId}-${url ?? "empty"}`}
        ref={audioRef}
        src={url ?? undefined}
        preload="metadata"
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          if (activeAudio === audioRef.current) activeAudio = null;
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
          if (activeAudio === audioRef.current) activeAudio = null;
        }}
        onError={onError}
      />
      {playbackError || cache.error ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Retry voice message"
          disabled={!networkOnline && !cache.hasCachedBlob}
          title={!networkOnline ? "Offline" : undefined}
          onClick={() => {
            setPlaybackError(false);
            if (!isLocalUpload) void cache.retry();
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
      ) : !available ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={cache.loading || !cache.cacheChecked || !networkOnline}
          title={!networkOnline ? "Offline" : undefined}
          aria-label={
            !networkOnline
              ? "Offline"
              : cache.loading
                ? "Downloading voice message"
                : "Download voice message"
          }
          onClick={() => void cache.download()}
        >
          {!networkOnline ? (
            <GlobeOff />
          ) : cache.loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={playing ? "Pause voice message" : "Play voice message"}
          onClick={toggle}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      )}
      <div className="min-w-0 flex-1">
        {cache.loading && (
          <Progress
            value={cache.progress.percent ?? 0}
            aria-label="Voice download progress"
            className="mb-1 h-1"
          />
        )}
        <div
          ref={waveformRef}
          role="slider"
          aria-label="Seek voice message"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.floor(currentTime)}
          tabIndex={available ? 0 : -1}
          onPointerDown={
            available
              ? (event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  seek(event);
                }
              : undefined
          }
          onPointerMove={
            available
              ? (event) => {
                  if (event.buttons > 0) seek(event);
                }
              : undefined
          }
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            const audio = audioRef.current;
            if (audio)
              audio.currentTime = Math.max(
                0,
                Math.min(
                  duration,
                  audio.currentTime + (event.key === "ArrowRight" ? 5 : -5),
                ),
              );
          }}
          className={`cursor-pointer ${available ? "" : "cursor-default"}`}
        >
          <VoiceWaveform values={waveform} progress={progress} />
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>{formatVoiceTime(playing ? currentTime : duration)}</span>

          {showSpeed ? (
            <span className="flex w-11 shrink-0 justify-end">
              <Button
                type="button"
                size="xs"
                variant="secondary"
                aria-label={`Playback speed ${speed}x`}
                onClick={cycleSpeed}
                className="w-11 rounded-full border border-border/70 bg-background/70 px-1 font-semibold tabular-nums"
              >
                {speed}x
              </Button>
            </span>
          ) : (
            <span className="h-5 w-3"></span>
          )}

          {!available && <span>{formatFileSize(media.size)}</span>}
          {cache.error && (
            <span className="truncate text-destructive">{cache.error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
