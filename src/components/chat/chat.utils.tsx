import { format, isToday, isYesterday } from "date-fns";
import { enUS } from "date-fns/locale";
import OneSignal from "react-onesignal";

export function parseMessageWithLinks(
  text: string,
  isOwn: boolean,
): React.ReactNode[] {
  const URL_REGEX =
    /(https?:\/\/[^\s]+|(?<![\w.])(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;

  return text
    .split(URL_REGEX)
    .filter((part) => part !== undefined && part !== "")
    .map((part, index) => {
      const isUrl = /^(https?:\/\/|(?:[a-z0-9-]+\.)+[a-z]{2,})/i.test(part);
      if (isUrl) {
        const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${isOwn ? "text-white" : "text-blue-500"} hover:text-blue-300 underline break-all wrap-break-word transition-colors`}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
}
export function formatDateLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "d MMMM yyyy", { locale: enUS });
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), "hh:mm a", { locale: enUS }); // ✅
  } catch {
    return "";
  }
}
export function formatDateTime(dateStr: string): string {
  try {
    const dateLabel = formatDateLabel(dateStr);
    const time = formatTime(dateStr);
    if (!time) return dateLabel;
    return `${dateLabel} at ${time}`;
  } catch {
    return dateStr;
  }
}

export function getInitials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}


export async function logoutOneSignal() {
  try {
    const isOptedIn = OneSignal.User?.PushSubscription?.optedIn ?? false;
    if (isOptedIn) {
      await OneSignal.User.PushSubscription.optOut();
    }
    await OneSignal.logout();
  } catch (err) {
    console.error("OneSignal logout error:", err);
  }
}
