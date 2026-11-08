export { formatSessionDate } from "@/shared/lib/date";

export function getDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /OPR\//.test(userAgent)
        ? "Opera"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)
            ? "Safari"
            : "Browser";
  const device = /iPad|Tablet/i.test(userAgent)
    ? "Tablet"
    : /Mobi|Android/i.test(userAgent)
      ? "Mobile"
      : "Desktop";
  const os = /Windows/i.test(userAgent)
    ? "Windows"
    : /iPhone|iPad|iOS/i.test(userAgent)
      ? "iOS"
      : /Android/i.test(userAgent)
        ? "Android"
        : /Mac OS|Macintosh/i.test(userAgent)
          ? "macOS"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : null;

  return `${browser} on ${os ? `${os} ` : ""}${device}`;
}
