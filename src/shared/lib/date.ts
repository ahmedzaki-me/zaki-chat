import { format, isToday, isYesterday } from "date-fns";
import { enUS } from "date-fns/locale";

/**
 * Format date for chat separators and day headers:
 * - "Today"
 * - "Yesterday"
 * - "d MMMM yyyy" (e.g., "8 November 2026")
 */
export function formatDateLabel(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMMM yyyy", { locale: enUS });
}

/**
 * Format time for message bubbles:
 * - "hh:mm a" (e.g., "09:41 PM")
 */
export function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";

  return format(date, "hh:mm a", { locale: enUS });
}

/**
 * Format full date and time:
 * - e.g., "Today, 09:41 PM" or "8 November 2026, 09:41 PM"
 */
export function formatDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";

  const dateLabel = formatDateLabel(date);
  const time = formatTime(date);
  return `${dateLabel}, ${time}`;
}

/**
 * Format date for conversations list:
 * - Today -> "hh:mm a"
 * - Yesterday -> "Yesterday"
 * - Older -> "d MMMM yyyy"
 */
export function formatConversationDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";

  if (isToday(date)) return formatTime(date);
  if (isYesterday(date)) return "Yesterday";
  return formatDateLabel(date);
}

/**
 * Format media duration (audio/video) in seconds to "m:ss" or "h:mm:ss"
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, "0");
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

/**
 * Format session date / last active date:
 */
export function formatSessionDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString("en-GB");
}
