import { useCallback, useEffect, useRef, useState } from "react";
import type { Media } from "@/features/chat/types/chat.types";
import * as mediaCache from "@/features/chat/cache/mediaCache";

type DownloadProgress = { loaded: number; total: number | null; percent: number | null };

export class MediaDownloadError extends Error {
  public status: number;

  constructor(status: number) {
    super(`Media download failed (${status}).`);
    this.name = "MediaDownloadError";
    this.status = status;
  }
}

const retainedObjectUrls = new Map<string, number>();
const pendingObjectUrlRevokes = new Set<string>();

export function retainMediaObjectUrl(url: string): () => void {
  if (!url.startsWith("blob:")) return () => undefined;
  retainedObjectUrls.set(url, (retainedObjectUrls.get(url) ?? 0) + 1);
  let retained = true;
  return () => {
    if (!retained) return;
    retained = false;
    const count = retainedObjectUrls.get(url) ?? 0;
    if (count > 1) {
      retainedObjectUrls.set(url, count - 1);
      return;
    }
    retainedObjectUrls.delete(url);
    if (pendingObjectUrlRevokes.delete(url)) URL.revokeObjectURL(url);
  };
}

function revokeMediaObjectUrl(url: string): void {
  if (retainedObjectUrls.has(url)) pendingObjectUrlRevokes.add(url);
  else URL.revokeObjectURL(url);
}

type ObjectUrlEntry = {
  url: string;
  blob: Blob;
  refCount: number;
  revokeTimer: ReturnType<typeof setTimeout> | null;
};

const messageObjectUrls = new Map<string, ObjectUrlEntry>();

function scheduleGraceRevoke(messageId: string, entry: ObjectUrlEntry): void {
  if (entry.revokeTimer) clearTimeout(entry.revokeTimer);
  entry.revokeTimer = setTimeout(() => {
    const current = messageObjectUrls.get(messageId);
    if (current === entry && current.refCount <= 0) {
      revokeMediaObjectUrl(current.url);
      messageObjectUrls.delete(messageId);
    }
  }, 5000);
}

/**
 * Ensures an ObjectURL exists for `(messageId, blob)` without mutating `refCount`.
 * Schedules a 5s grace cleanup in case an effect never mounts to acquire it.
 */
function ensureMediaObjectUrl(messageId: string, blob: Blob): string {
  const existing = messageObjectUrls.get(messageId);
  if (existing) {
    if (existing.blob === blob) {
      return existing.url;
    }
    if (existing.revokeTimer) clearTimeout(existing.revokeTimer);
    revokeMediaObjectUrl(existing.url);
    messageObjectUrls.delete(messageId);
  }

  const url = URL.createObjectURL(blob);
  const entry: ObjectUrlEntry = {
    url,
    blob,
    refCount: 0,
    revokeTimer: null,
  };
  messageObjectUrls.set(messageId, entry);
  scheduleGraceRevoke(messageId, entry);
  return url;
}

export function getOrCreateMediaObjectUrl(messageId: string, blob: Blob): string {
  const existing = messageObjectUrls.get(messageId);
  if (existing) {
    if (existing.blob === blob) {
      if (existing.revokeTimer) {
        clearTimeout(existing.revokeTimer);
        existing.revokeTimer = null;
      }
      existing.refCount++;
      return existing.url;
    }
    if (existing.revokeTimer) {
      clearTimeout(existing.revokeTimer);
    }
    revokeMediaObjectUrl(existing.url);
    messageObjectUrls.delete(messageId);
  }

  const url = URL.createObjectURL(blob);
  messageObjectUrls.set(messageId, {
    url,
    blob,
    refCount: 1,
    revokeTimer: null,
  });
  return url;
}

export function releaseMediaObjectUrl(messageId: string, expectedBlob?: Blob): void {
  const existing = messageObjectUrls.get(messageId);
  if (!existing) return;
  if (expectedBlob && existing.blob !== expectedBlob) return;
  existing.refCount = Math.max(0, existing.refCount - 1);
  if (existing.refCount <= 0) {
    scheduleGraceRevoke(messageId, existing);
  }
}

export function revokeMediaObjectUrlForMessage(messageId: string): void {
  const existing = messageObjectUrls.get(messageId);
  if (existing) {
    if (existing.revokeTimer) clearTimeout(existing.revokeTimer);
    revokeMediaObjectUrl(existing.url);
    messageObjectUrls.delete(messageId);
  }
}

// Global cache change listener to clean up object URLs on cache clear/remove
if (typeof window !== "undefined") {
  mediaCache.addMediaCacheListener((changedId) => {
    if (!changedId) {
      for (const [, entry] of messageObjectUrls) {
        if (entry.revokeTimer) clearTimeout(entry.revokeTimer);
        revokeMediaObjectUrl(entry.url);
      }
      messageObjectUrls.clear();
    } else if (mediaCache.isCachedSync(changedId) === false) {
      revokeMediaObjectUrlForMessage(changedId);
    }
  });
}

export async function fetchMediaBlob(
  url: string,
  mimeType: string,
  expectedSize: number,
  signal: AbortSignal,
  onProgress: (progress: DownloadProgress) => void = () => undefined,
): Promise<Blob> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new MediaDownloadError(response.status);
  const headerSize = Number(response.headers.get("content-length"));
  const total = headerSize > 0 ? headerSize : expectedSize > 0 ? expectedSize : null;
  if (!response.body) {
    const blob = await response.blob();
    onProgress({ loaded: blob.size, total: blob.size, percent: 100 });
    return blob;
  }
  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      chunks.push(copy.buffer);
      loaded += value.byteLength;
      onProgress({ loaded, total, percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : null });
    }
  }
  onProgress({ loaded, total, percent: 100 });
  return new Blob(chunks, { type: response.headers.get("content-type") || mimeType });
}

export function useCachedMedia(
  messageId: string,
  media: Media | null,
  enabled = true,
  onDownloadError?: () => void,
) {
  const mediaRef = useRef(media);
  const onDownloadErrorRef = useRef(onDownloadError);

  const initialMemory = enabled && media ? mediaCache.getMemory(messageId) : null;
  const initialSyncStatus = enabled && media ? mediaCache.isCachedSync(messageId) : null;

  const [cachedBlob, setCachedBlob] = useState<Blob | null>(() => initialMemory?.blob ?? null);
  const [cacheChecked, setCacheChecked] = useState<boolean>(() => {
    if (!enabled || !media) return true;
    if (initialMemory) return true;
    if (initialSyncStatus === false) return true;
    return false;
  });

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>({ loaded: 0, total: null, percent: null });
  const [downloadError, setDownloadError] = useState<{ url: string; message: string } | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const savedAt = useRef<number | null>(initialMemory?.savedAt ?? null);
  const hasMedia = !!media;

  const [prevId, setPrevId] = useState(messageId);
  const [prevEnabled, setPrevEnabled] = useState(enabled);

  const mem = enabled && media ? mediaCache.getMemory(messageId) : null;
  const isSameKey = messageId === prevId && enabled === prevEnabled;

  if (!isSameKey) {
    setPrevId(messageId);
    setPrevEnabled(enabled);
    setLoading(false);
    setProgress({ loaded: 0, total: null, percent: null });

    if (mem) {
      setCachedBlob(mem.blob);
      setCacheChecked(true);
      setDownloadError(null);
      setFallback(null);
    } else {
      setCachedBlob(null);
      setCacheChecked(
        enabled && media ? mediaCache.isCachedSync(messageId) === false : true,
      );
      setDownloadError(null);
      setFallback(null);
    }
  } else if (mem && cachedBlob !== mem.blob) {
    setCachedBlob(mem.blob);
    setCacheChecked(true);
    setDownloadError(null);
    setFallback(null);
  }

  const activeBlob = !enabled || !media
    ? null
    : mem?.blob ?? (isSameKey ? cachedBlob : null);
  const objectUrl = activeBlob ? ensureMediaObjectUrl(messageId, activeBlob) : null;

  const activeBlobRef = useRef(activeBlob);
  useEffect(() => {
    mediaRef.current = media;
    onDownloadErrorRef.current = onDownloadError;
    activeBlobRef.current = activeBlob;
  }, [media, onDownloadError, activeBlob]);

  useEffect(() => {
    savedAt.current = mem?.savedAt ?? null;
  }, [messageId, enabled, mem?.savedAt]);

  useEffect(() => {
    if (!enabled || !hasMedia) {
      setCacheChecked(true);
      return;
    }
    let active = true;
    let readVersion = 0;
    const read = async () => {
      const currentRead = ++readVersion;
      const currentMem = mediaCache.getMemory(messageId);
      if (currentMem) {
        if (!active || currentRead !== readVersion) return;
        if (savedAt.current !== currentMem.savedAt) {
          savedAt.current = currentMem.savedAt;
          setCachedBlob(currentMem.blob);
        }
        setCacheChecked(true);
        return;
      }

      const record = await mediaCache.get(messageId);
      if (!active || currentRead !== readVersion) return;
      if (record) {
        if (savedAt.current !== record.savedAt) {
          savedAt.current = record.savedAt;
          setCachedBlob(record.blob);
        }
      } else {
        savedAt.current = null;
        setCachedBlob(null);
        setFallback(null);
        setDownloadError(null);
      }
      setCacheChecked(true);
    };

    const syncStatus = mediaCache.isCachedSync(messageId);
    if (syncStatus === false) {
      setCacheChecked(true);
    } else if (!activeBlobRef.current) {
      void read();
    }

    const unsubscribe = mediaCache.addMediaCacheListener((changedId) => {
      if (!changedId || changedId === messageId) void read();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, hasMedia, messageId]);

  useEffect(() => {
    return () => {
      controller.current?.abort();
      controller.current = null;
    };
  }, [enabled, messageId]);

  useEffect(() => {
    if (!activeBlob) return;
    getOrCreateMediaObjectUrl(messageId, activeBlob);
    return () => {
      releaseMediaObjectUrl(messageId, activeBlob);
    };
  }, [activeBlob, messageId]);

  const download = useCallback(async () => {
    const currentMedia = mediaRef.current;
    if (!currentMedia || controller.current) return;
    const abortController = new AbortController();
    controller.current = abortController;
    setLoading(true);
    setDownloadError(null);
    setFallback(null);
    setProgress({ loaded: 0, total: currentMedia.size || null, percent: 0 });
    try {
      const blob = await fetchMediaBlob(
        currentMedia.url,
        currentMedia.mimeType,
        currentMedia.size,
        abortController.signal,
        setProgress,
      );
      if (abortController.signal.aborted) return;
      const savedAtValue = Date.now();
      const saved = await mediaCache.save(messageId, blob, {
        mimeType: blob.type || currentMedia.mimeType,
        size: blob.size,
        originalName: currentMedia.originalName ?? "Voice message",
        savedAt: savedAtValue,
      });
      if (saved) {
        savedAt.current = savedAtValue;
        setCachedBlob(blob);
      } else {
        setFallback(currentMedia.url);
      }
    } catch (caught) {
      if (abortController.signal.aborted) return;
      setDownloadError({
        url: currentMedia.url,
        message: caught instanceof Error ? caught.message : "Could not download this media.",
      });
      onDownloadErrorRef.current?.();
    } finally {
      if (controller.current === abortController) controller.current = null;
      if (!abortController.signal.aborted) setLoading(false);
    }
  }, [messageId]);

  const retry = useCallback(async () => {
    if (activeBlobRef.current) {
      savedAt.current = null;
      setCachedBlob(null);
      await mediaCache.remove(messageId);
    }
    setFallback(null);
    setDownloadError(null);
    await download();
  }, [download, messageId]);

  return {
    cacheChecked,
    cachedBlob: activeBlob,
    hasCachedBlob: !!activeBlob,
    objectUrl,
    fallbackUrl: fallback ? media?.url ?? fallback : null,
    loading,
    progress,
    error: downloadError?.message ?? null,
    download,
    retry,
  };
}
