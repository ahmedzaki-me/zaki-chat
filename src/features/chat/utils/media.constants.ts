export const MEDIA_LIMITS = {
  videoTypes: ["video/mp4", "video/webm", "video/quicktime"],
  animatedImageType: "image/gif",
  gifMaxSizeBytes: 10 * 1024 * 1024,
  videoMaxSizeBytes: 50 * 1024 * 1024,
  maxProcessedImageSizeBytes: 2 * 1024 * 1024,
  imageProcessing: { maxDimension: 1600, maxSizeMB: 1 },
  voiceTypes: ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"],
  voiceMaxSizeBytes: 5 * 1024 * 1024,
  voiceMaxDurationSec: 5 * 60,
  voiceMinDurationSec: 1,
  voiceWaveformBars: 48,
} as const;

export const MEDIA_BUBBLE = {
  minWidth: 200,
  maxWidth: 380,
  maxHeight: 320,
  defaultAspectRatio: 4 / 3,
  minDisplayAspectRatio: 4 / 5,
  maxDisplayAspectRatio: 16 / 9,
} as const;

export type MediaDimensions = {
  width?: number;
  height?: number;
  aspectRatio: number;
};

const dimensionCache = new Map<string, MediaDimensions>();

export function getCachedMediaDimensions(
  key?: string | null,
): MediaDimensions | null {
  if (!key) return null;
  return dimensionCache.get(key) ?? null;
}

export function setCachedMediaDimensions(
  key: string,
  dimensions: MediaDimensions,
): void {
  if (key) {
    dimensionCache.set(key, dimensions);
  }
}

export function getMediaBubbleDimensions(
  aspectRatio?: number | null,
  naturalWidth?: number | null,
  naturalHeight?: number | null,
): {
  width: number;
  height: number;
  clampedAspectRatio: number;
  naturalAspectRatio: number;
  aspectRatio: number;
} {
  const naturalRatio =
    aspectRatio && Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : naturalWidth && naturalHeight && naturalHeight > 0
        ? naturalWidth / naturalHeight
        : MEDIA_BUBBLE.defaultAspectRatio;

  const clampedRatio = Math.max(
    MEDIA_BUBBLE.minDisplayAspectRatio,
    Math.min(MEDIA_BUBBLE.maxDisplayAspectRatio, naturalRatio),
  );

  let targetWidth: number;
  let targetHeight: number;

  if (
    naturalWidth &&
    naturalHeight &&
    naturalWidth > 0 &&
    naturalHeight > 0 &&
    naturalWidth < MEDIA_BUBBLE.minWidth
  ) {
    // If image is naturally smaller than minWidth (e.g. 64x64 icon):
    // Clamped to minWidth (200px), height follows clampedRatio
    targetWidth = MEDIA_BUBBLE.minWidth;
    targetHeight = Math.min(
      MEDIA_BUBBLE.maxHeight,
      Math.max(1, Math.round(targetWidth / clampedRatio)),
    );
  } else {
    // Media computes width and height directly from clampedRatio constrained by maxWidth and maxHeight:
    // If clampedRatio <= maxWidth / maxHeight (380 / 320 = 1.1875):
    // Height reaches maxHeight (320px), width = round(320 * clampedRatio)
    // If clampedRatio > 1.1875:
    // Width reaches maxWidth (380px), height = round(380 / clampedRatio)
    if (clampedRatio <= MEDIA_BUBBLE.maxWidth / MEDIA_BUBBLE.maxHeight) {
      targetHeight = MEDIA_BUBBLE.maxHeight;
      targetWidth = Math.round(targetHeight * clampedRatio);
    } else {
      targetWidth = MEDIA_BUBBLE.maxWidth;
      targetHeight = Math.round(targetWidth / clampedRatio);
    }
  }

  const width = Math.max(
    MEDIA_BUBBLE.minWidth,
    Math.min(MEDIA_BUBBLE.maxWidth, targetWidth),
  );
  const height = Math.min(
    MEDIA_BUBBLE.maxHeight,
    Math.max(1, targetHeight),
  );

  return {
    width,
    height,
    clampedAspectRatio: clampedRatio,
    naturalAspectRatio: naturalRatio,
    aspectRatio: clampedRatio,
  };
}

export function validateMediaFile(file: File): string | null {
  if (file.type === MEDIA_LIMITS.animatedImageType) {
    return file.size <= MEDIA_LIMITS.gifMaxSizeBytes
      ? null
      : "GIF files must be 10 MB or smaller.";
  }
  if (file.type.startsWith("image/")) return null;
  if (!(MEDIA_LIMITS.videoTypes as readonly string[]).includes(file.type)) {
    return "Choose a supported image, MP4, WebM, or QuickTime video.";
  }
  return file.size <= MEDIA_LIMITS.videoMaxSizeBytes
    ? null
    : "Videos must be 50 MB or smaller.";
}

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extensionForMime(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(";")[0];
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",
    "image/tiff": ".tiff",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/x-icon": ".ico",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-matroska": ".mkv",
    "video/ogg": ".ogv",
  };
  if (extensions[normalized]) return extensions[normalized];
  const subtype = normalized
    .split("/")[1]
    ?.replace(/^x-/, "")
    .replace(/\+xml$/, "");
  return subtype ? `.${subtype}` : ".bin";
}

export function ensureExtension(filename: string, extension: string): string {
  const base = filename.replace(/[\\/]/g, "_").replace(/\.[^.]+$/, "");
  return `${base}${extension}`;
}
