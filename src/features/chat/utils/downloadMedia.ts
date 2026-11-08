import type { QueryClient } from "@tanstack/react-query";
import type { Message } from "@/features/chat/types/chat.types";
import { socket } from "@/core/socket/socket";
import * as mediaCache from "@/features/chat/cache/mediaCache";
import { fetchMediaBlob, MediaDownloadError } from "@/features/chat/hooks/useCachedMedia";
import { messagesKeys } from "@/features/chat/hooks/useMessagesQuery";
import { extensionForMime, ensureExtension } from "@/features/chat/utils/media.constants";

export async function downloadMedia(
  message: Message,
  conversationId?: string,
  queryClient?: QueryClient,
): Promise<void> {
  if (!message.media) throw new Error("Media is unavailable.");
  const cached = await mediaCache.get(message.id);
  let blob = cached?.blob;
  if (!blob) {
    if (!navigator.onLine || !socket.connected) {
      throw new Error(
        "You are offline. Connect to the internet to download media.",
      );
    }
    const controller = new AbortController();
    try {
      blob = await fetchMediaBlob(
        message.media.url,
        message.media.mimeType,
        message.media.size,
        controller.signal,
      );
    } catch (error) {
      if (
        !(error instanceof MediaDownloadError) ||
        ![401, 403, 404].includes(error.status)
      ) {
        throw error;
      }
      if (queryClient) {
        await queryClient.invalidateQueries({
          queryKey: messagesKeys.messages(conversationId ?? ""),
          exact: true,
        });
        const latest = queryClient
          .getQueryData<{ pages: { messages: Message[] }[] }>(
            messagesKeys.messages(conversationId ?? ""),
          )
          ?.pages.flatMap((page) => page.messages)
          .find((item) => item.id === message.id);
        if (!latest?.media || latest.deletedAt) throw error;
        blob = await fetchMediaBlob(
          latest.media.url,
          latest.media.mimeType,
          latest.media.size,
          controller.signal,
        );
      } else {
        throw error;
      }
    }
    await mediaCache.save(message.id, blob, {
      mimeType: blob.type || message.media.mimeType,
      size: blob.size,
      originalName:
        message.media.originalName ??
        `${message.type}-${message.createdAt.replace(/[:.]/g, "-")}`,
      savedAt: Date.now(),
    });
  }
  const extension = extensionForMime(message.media.mimeType);
  const filename = ensureExtension(
    message.media.originalName ||
      `${message.type}-${message.createdAt.replace(/[:.]/g, "-")}`,
    extension,
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
