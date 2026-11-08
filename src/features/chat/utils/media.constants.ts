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
