/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { pushPayloadSchema } from "@/features/notifications/lib/payload";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null; integrity?: string }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Do not runtime-cache APIs, Socket.IO, or signed Backblaze B2 URLs. Offline media is in IndexedDB.
const nonAppPath = /^\/(?!$|settings\/?$|auth(?:\/(?:login|signup))?\/?$|owner(?:\/[^/]+)?\/?$|chat-with-zaki\/?$).*/;
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html"), { denylist: [nonAppPath] }));

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

function previewLabel(preview: { kind: string; text: string; durationSec?: number } | undefined) {
  if (!preview) return "New message";
  if (preview.kind === "text") return preview.text || "New message";
  if (preview.kind === "image") return preview.text.trim() ? `📷 ${preview.text}` : "📷 Photo";
  if (preview.kind === "gif") return preview.text.trim() ? `GIF ${preview.text}` : "GIF";
  if (preview.kind === "video") return preview.text.trim() ? `🎥 ${preview.text}` : "🎥 Video";
  if (preview.kind === "voice") {
    if (preview.text.trim()) return `🎤 ${preview.text}`;
    const seconds = Math.max(0, preview.durationSec ?? 0);
    return `🎤 Voice message ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  return "New message";
}

self.addEventListener("push", (event: PushEvent) => {
  event.waitUntil((async () => {
    let payload;
    try {
      payload = pushPayloadSchema.parse(event.data?.json());
    } catch {
      await self.registration.showNotification("New message", { body: "You have a new notification.", icon: "/pwa-192x192.png", badge: "/pwa-64x64.png", dir: "auto" });
      return;
    }
    if (payload.type === "new-user") {
      await self.registration.showNotification("New user", {
        body: `${payload.sender.name} just joined`, tag: `new-user:${payload.sender.id}`,
        icon: "/pwa-192x192.png", badge: "/pwa-64x64.png", timestamp: Date.parse(payload.createdAt), dir: "auto",
        data: { type: "new-user", url: "/?openOwnerHome=1" },
      } as NotificationOptions);
      return;
    }
    const tag = `conv:${payload.conversationId}`;
    const [existing] = await self.registration.getNotifications({ tag });
    const prior = existing?.data as { lines?: unknown; count?: unknown } | undefined;
    const lines = Array.isArray(prior?.lines) ? prior.lines.filter((line): line is string => typeof line === "string") : [];
    const line = payload.type === "reaction"
      ? `${payload.emoji ?? "❤️"} reacted to "${previewLabel(payload.reactedToPreview)}"`
      : previewLabel(payload.preview);
    lines.push(line);
    const recentLines = lines.slice(-5);
    const count = (typeof prior?.count === "number" ? prior.count : 0) + 1;
    await self.registration.showNotification(`${payload.sender.name}${count > 1 ? ` (${count} messages)` : ""}`, {
      body: recentLines.join("\n"), tag, renotify: true,
      icon: "/pwa-192x192.png", badge: "/pwa-64x64.png", timestamp: Date.parse(payload.createdAt), dir: "auto",
      data: { conversationId: payload.conversationId, lines: recentLines, count, type: payload.type, url: `/?openConversation=${encodeURIComponent(payload.conversationId)}` },
    } as NotificationOptions);
  })());
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const data = event.notification.data as { type?: string; conversationId?: string } | undefined;
  const isNewUser = data?.type === "new-user";
  const target = isNewUser ? "/?openOwnerHome=1" : `/?openConversation=${encodeURIComponent(data?.conversationId ?? "")}`;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      try {
        await client.focus();
        client.postMessage(isNewUser ? { type: "open-owner-home" } : { type: "open-conversation", conversationId: data?.conversationId });
        return;
      } catch { /* Try another open app window, then open a new one. */ }
    }
    await self.clients.openWindow(target);
  })());
});

// Edits and deletes are not pushed yet, so the worker cannot update or close notifications from the server.
