import { useSyncExternalStore } from "react";

export type VoicePlaybackSpeed = 1 | 1.5 | 2;

const STORAGE_KEY = "zaki-chat-voice-playback-speed";
const listeners = new Set<() => void>();
const audioElements = new Set<HTMLAudioElement>();

function isSpeed(value: unknown): value is VoicePlaybackSpeed {
  return value === 1 || value === 1.5 || value === 2;
}

function readSpeed(): VoicePlaybackSpeed {
  try {
    const stored = typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored === null ? null : JSON.parse(stored);
    return isSpeed(parsed) ? parsed : 1;
  } catch {
    return 1;
  }
}

let currentSpeed = readSpeed();

function applySpeed(audio: HTMLAudioElement, speed: VoicePlaybackSpeed): void {
  audio.playbackRate = speed;
  audio.preservesPitch = true;
  const pitchAudio = audio as HTMLAudioElement & { webkitPreservesPitch?: boolean; mozPreservesPitch?: boolean };
  if ("webkitPreservesPitch" in pitchAudio) pitchAudio.webkitPreservesPitch = true;
  if ("mozPreservesPitch" in pitchAudio) pitchAudio.mozPreservesPitch = true;
}

function setSpeed(speed: VoicePlaybackSpeed): void {
  currentSpeed = speed;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(speed));
  } catch {
    // Keep the in-memory preference even when browser storage is unavailable.
  }
  for (const audio of audioElements) applySpeed(audio, speed);
  listeners.forEach((listener) => listener());
}

export function registerVoiceAudio(audio: HTMLAudioElement): () => void {
  audioElements.add(audio);
  applySpeed(audio, currentSpeed);
  return () => audioElements.delete(audio);
}

export function useVoicePlaybackSpeed(): [VoicePlaybackSpeed, () => void] {
  const speed = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => currentSpeed,
    (): VoicePlaybackSpeed => 1,
  );
  return [speed, () => setSpeed(currentSpeed === 1 ? 1.5 : currentSpeed === 1.5 ? 2 : 1)];
}
