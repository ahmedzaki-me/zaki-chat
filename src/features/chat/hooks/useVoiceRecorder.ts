import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MEDIA_LIMITS } from "@/features/chat/utils/media.constants";
import { socket } from "@/core/socket/socket";
import { canUseChatConnection } from "@/shared/lib/offlineGuard";

export type VoiceRecording = { blob: Blob; contentType: string; durationSec: number; waveform: number[] };
type RecorderStatus = "idle" | "recording" | "locked" | "paused";
type RecorderState = { status: RecorderStatus; elapsedMs: number; waveform: number[]; dragX: number; dragY: number };

function downsample(samples: number[]): number[] {
  const bars = MEDIA_LIMITS.voiceWaveformBars;
  if (!samples.length) return Array.from({ length: bars }, () => 0);
  return Array.from({ length: bars }, (_, index) => {
    const start = Math.floor((index * samples.length) / bars);
    const end = Math.max(start + 1, Math.floor(((index + 1) * samples.length) / bars));
    const values = samples.slice(start, end);
    return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
  });
}

function chooseMimeType(): string | null {
  return MEDIA_LIMITS.voiceTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function useVoiceRecorder(onSend: (recording: VoiceRecording) => void, enabled = true) {
  const [state, setState] = useState<RecorderState>({ status: "idle", elapsedMs: 0, waveform: [], dragX: 0, dragY: 0 });
  const stateRef = useRef(state);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const samplesRef = useRef<number[]>([]);
  const lastSampleRef = useRef(0);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef(0);
  const discardRef = useRef(false);
  const pausedRef = useRef(false);
  const pointerRef = useRef<{ id: number; x: number; y: number; dragX: number } | null>(null);
  const releasedBeforeReadyRef = useRef(false);
  const onSendRef = useRef(onSend);
  const enabledRef = useRef(enabled);
  onSendRef.current = onSend;
  enabledRef.current = enabled;
  stateRef.current = state;

  const setStatus = useCallback((status: RecorderStatus, elapsedMs = elapsedRef.current) => {
    setState((current) => ({ ...current, status, elapsedMs }));
  }, []);

  const cleanup = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    animationRef.current = null;
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") void context.close();
    recorderRef.current = null;
    setState({ status: "idle", elapsedMs: 0, waveform: [], dragX: 0, dragY: 0 });
  }, []);

  const finish = useCallback((discard: boolean) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    discardRef.current = discard;
    if (!pausedRef.current) {
      elapsedRef.current += performance.now() - startedAtRef.current;
    }
    pausedRef.current = false;
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    animationRef.current = null;
    timerRef.current = null;
    recorder.onstop = () => {
      const durationSec = Math.min(MEDIA_LIMITS.voiceMaxDurationSec, Math.round(elapsedRef.current / 10) / 100);
      const type = recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      const waveform = downsample(samplesRef.current);
      cleanup();
      chunksRef.current = [];
      samplesRef.current = [];
      if (discardRef.current) return;
      if (durationSec < MEDIA_LIMITS.voiceMinDurationSec) {
        toast.info("Hold to record a voice message");
        return;
      }
      if (blob.size > MEDIA_LIMITS.voiceMaxSizeBytes) {
        toast.error("Voice messages must be 5 MiB or smaller.");
        return;
      }
      if (!canUseChatConnection(true)) return;
      onSendRef.current({ blob, contentType: type, durationSec, waveform });
    };
    recorder.stop();
  }, [cleanup]);

  const begin = useCallback(async () => {
    if (!canUseChatConnection(true)) return;
    if (!enabledRef.current || stateRef.current.status !== "idle" || recorderRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Voice recording is not supported by this browser.");
      return;
    }
    const mimeType = chooseMimeType();
    if (!mimeType) {
      toast.error("This browser cannot record a supported voice format.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!enabledRef.current || releasedBeforeReadyRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        if (releasedBeforeReadyRef.current) toast.info("Hold to record a voice message");
        return;
      }
      streamRef.current = stream;
      const context = new AudioContext();
      contextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];
      samplesRef.current = [];
      elapsedRef.current = 0;
      startedAtRef.current = performance.now();
      discardRef.current = false;
      pausedRef.current = false;
      setState({ status: "recording", elapsedMs: 0, waveform: [], dragX: 0, dragY: 0 });
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.start(250);

      const data = new Float32Array(analyser.fftSize);
      const sample = (time: number) => {
        if (time - lastSampleRef.current >= 80 && recorder.state === "recording") {
          analyser.getFloatTimeDomainData(data);
          const rms = Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / data.length);
          samplesRef.current.push(Math.min(100, Math.round(rms * 380)));
          lastSampleRef.current = time;
          setState((current) => ({ ...current, waveform: downsample(samplesRef.current) }));
        }
        if (recorder.state === "recording") animationRef.current = requestAnimationFrame(sample);
      };
      animationRef.current = requestAnimationFrame(sample);
      timerRef.current = window.setInterval(() => {
        if (recorder.state !== "recording") return;
        const elapsed = elapsedRef.current + performance.now() - startedAtRef.current;
        setState((current) => ({ ...current, elapsedMs: elapsed }));
        if (elapsed >= MEDIA_LIMITS.voiceMaxDurationSec * 1000) finish(false);
      }, 100);
    } catch (error) {
      cleanup();
      const name = error instanceof DOMException ? error.name : "";
      toast.error(name === "NotFoundError" || name === "DevicesNotFoundError"
        ? "No microphone was found. Connect a microphone and try again."
        : name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was denied. Allow microphone access in your browser settings and try again."
          : "Could not start voice recording. Check your microphone and try again.");
    }
  }, [cleanup, finish]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    elapsedRef.current += performance.now() - startedAtRef.current;
    pausedRef.current = true;
    recorder.pause();
    setStatus("paused");
  }, [setStatus]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    startedAtRef.current = performance.now();
    pausedRef.current = false;
    recorder.resume();
    setStatus("locked");
  }, [setStatus]);

  const pointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    releasedBeforeReadyRef.current = false;
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragX: 0 };
    void begin();
  }, [begin]);

  const pointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.dragX = Math.max(-120, Math.min(0, dx));
    if (stateRef.current.status === "recording" && dy <= -75) {
      pointerRef.current = null;
      setState((current) => ({
        ...current,
        status: "locked",
        elapsedMs: elapsedRef.current,
        dragX: 0,
        dragY: 0,
      }));
      return;
    }
    setState((current) => ({ ...current, dragX: pointer.dragX, dragY: Math.min(0, dy) }));
  }, []);

  const pointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    pointerRef.current = null;
    if (stateRef.current.status === "recording") {
      if (pointer.dragX <= -80) finish(true);
      else finish(false);
    }
    else if (stateRef.current.status === "idle") releasedBeforeReadyRef.current = true;
  }, [finish]);

  const pointerCancel = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    pointerRef.current = null;
    if (stateRef.current.status === "recording") finish(true);
  }, [finish]);

  const cancel = useCallback(() => {
    releasedBeforeReadyRef.current = true;
    finish(true);
  }, [finish]);
  const sendNow = useCallback(() => finish(false), [finish]);

  useEffect(() => {
    if (enabled) return;
    releasedBeforeReadyRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") finish(true);
  }, [enabled, finish]);

  useEffect(() => {
    const cancelRevokedSessionRecording = (reason: string) => {
      if (reason === "io server disconnect") {
        releasedBeforeReadyRef.current = true;
        finish(true);
      }
    };
    socket.on("disconnect", cancelRevokedSessionRecording);
    return () => { socket.off("disconnect", cancelRevokedSessionRecording); };
  }, [finish]);

  useEffect(() => () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      discardRef.current = true;
      recorder.onstop = null;
      recorder.stop();
    }
    cleanup();
  }, [cleanup]);

  return { ...state, pointerDown, pointerMove, pointerUp, pointerCancel, cancel, pause, resume, sendNow };
}
