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
  const initialMemory = enabled && media ? mediaCache.getMemory(messageId) : null;
  const initialSyncStatus = enabled && media ? mediaCache.isCachedSync(messageId) : null;

  const [cachedBlob, setCachedBlob] = useState<Blob | null>(() => initialMemory?.blob ?? null);
  const [cacheChecked, setCacheChecked] = useState<boolean>(() => {
    if (!enabled || !media) return true;
    if (initialMemory) return true;
    if (initialSyncStatus === false) return true;
    return false;
  });
  const [objectUrl, setObjectUrl] = useState<string | null>(() => {
    if (initialMemory?.blob) {
      return URL.createObjectURL(initialMemory.blob);
    }
    return null;
  });
  const activeBlobRef = useRef<Blob | null>(initialMemory?.blob ?? null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>({ loaded: 0, total: null, percent: null });
  const [downloadError, setDownloadError] = useState<{ url: string; message: string } | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const savedAt = useRef<number | null>(initialMemory?.savedAt ?? null);
  const hasMedia = !!media;

  useEffect(() => {
    if (!enabled || !hasMedia) {
      setCacheChecked(true);
      return;
    }
    let active = true;
    let readVersion = 0;
    const read = async () => {
      const currentRead = ++readVersion;
      const mem = mediaCache.getMemory(messageId);
      if (mem) {
        if (!active || currentRead !== readVersion) return;
        if (savedAt.current !== mem.savedAt) {
          savedAt.current = mem.savedAt;
          setCachedBlob(mem.blob);
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
    } else if (!initialMemory) {
      void read();
    }

    const unsubscribe = mediaCache.addMediaCacheListener((changedId) => {
      if (!changedId || changedId === messageId) void read();
    });
    return () => {
      active = false;
      unsubscribe();
      controller.current?.abort();
    };
  }, [enabled, hasMedia, messageId]);

  useEffect(() => {
    if (!cachedBlob) {
      activeBlobRef.current = null;
      setObjectUrl(null);
      return;
    }
    if (activeBlobRef.current === cachedBlob && objectUrl) {
      return () => {
        revokeMediaObjectUrl(objectUrl);
      };
    }
    activeBlobRef.current = cachedBlob;
    const url = URL.createObjectURL(cachedBlob);
    setObjectUrl(url);
    return () => revokeMediaObjectUrl(url);
  }, [cachedBlob]);

  const download = useCallback(async () => {
    if (!media || loading) return;
    const abortController = new AbortController();
    controller.current?.abort();
    controller.current = abortController;
    setLoading(true);
    setDownloadError(null);
    setFallback(null);
    setProgress({ loaded: 0, total: media.size || null, percent: 0 });
    try {
      const blob = await fetchMediaBlob(media.url, media.mimeType, media.size, abortController.signal, setProgress);
      if (abortController.signal.aborted) return;
      const savedAtValue = Date.now();
      const saved = await mediaCache.save(messageId, blob, {
        mimeType: blob.type || media.mimeType,
        size: blob.size,
        originalName: media.originalName ?? "Voice message",
        savedAt: savedAtValue,
      });
      if (saved) {
        savedAt.current = savedAtValue;
        setCachedBlob(blob);
      } else {
        setFallback(media.url);
      }
    } catch (caught) {
      if (abortController.signal.aborted) return;
      setDownloadError({ url: media.url, message: caught instanceof Error ? caught.message : "Could not download this media." });
      onDownloadError?.();
    } finally {
      if (controller.current === abortController) controller.current = null;
      if (!abortController.signal.aborted) setLoading(false);
    }
  }, [loading, media, messageId, onDownloadError]);

  const retry = useCallback(async () => {
    if (cachedBlob) {
      savedAt.current = null;
      setCachedBlob(null);
      await mediaCache.remove(messageId);
    }
    setFallback(null);
    setDownloadError(null);
    await download();
  }, [cachedBlob, download, messageId]);

  return {
    cacheChecked,
    cachedBlob,
    hasCachedBlob: !!cachedBlob,
    objectUrl,
    fallbackUrl: fallback === media?.url ? fallback : null,
    loading,
    progress,
    error: downloadError?.message ?? null,
    download,
    retry,
  };
}
