import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, PendingMessage } from "@/features/chat/types/chat.types";
import { MEDIA_LIMITS } from "@/features/chat/utils/media.constants";
import { processImage } from "@/features/chat/utils/processImage";
import { getProblemMessage } from "@/shared/lib/problemDetails";
import { SocketError } from "@/core/socket/socket";
import { uploadFile } from "@/features/chat/api/uploads.service";
import { registerPendingMediaMessageHandler, type MediaMessagePayload } from "@/features/chat/api/mediaMessage.api";
import * as mediaCache from "@/features/chat/cache/mediaCache";
import { canUseChatConnection } from "@/shared/lib/offlineGuard";

type UploadRecord = {
  id: string;
  conversationId: string;
  file: File;
  kind: "image" | "video" | "voice";
  caption: string | null;
  replyToId: string | null;
  durationSec?: number;
  waveform?: number[];
  previewUrl: string;
  preparedBlob?: Blob;
  controller?: AbortController;
  awaitingMessage: boolean;
  settling: boolean;
  serverMessageId?: string;
};

function errorMessage(error: unknown): string {
  if (error instanceof SocketError) {
    const problem = error.problem;
    const fields = Object.entries(problem.errors ?? {})
      .flatMap(([field, entries]) => entries.map((entry) => `${field}: ${entry.message ?? entry.code ?? "Invalid value"}`))
      .join("; ");
    return [problem.detail ?? problem.title, fields].filter(Boolean).join(" - ") || "Media could not be sent. Please try again.";
  }
  if (error instanceof Error && "response" in error) return getProblemMessage(error);
  return error instanceof Error ? error.message : "Media could not be sent. Please try again.";
}

export function usePendingUploads(
  conversationId: string | undefined,
  currentUserId: string | undefined,
  sendMedia: (payload: MediaMessagePayload) => Promise<Message>,
  acceptMediaMessage: (message: Message) => void,
) {
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const records = useRef(new Map<string, UploadRecord>());
  const isMounted = useRef(true);
  const creationTime = useRef(0);

  const updateMessage = useCallback((id: string, update: (message: PendingMessage) => PendingMessage) => {
    if (!isMounted.current) return;
    setMessages((current) => current.map((message) => message.clientId === id ? update(message) : message));
  }, []);

  const remove = useCallback((id: string, abort = false) => {
    const record = records.current.get(id);
    if (!record) return;
    if (abort) record.controller?.abort();
    record.controller = undefined;
    URL.revokeObjectURL(record.previewUrl);
    void mediaCache.remove(`tmp-${record.id}`);
    records.current.delete(id);
    if (isMounted.current) setMessages((current) => current.filter((message) => message.clientId !== id));
  }, []);

  const settle = useCallback(async (record: UploadRecord, message: Message) => {
    if (record.settling) return;
    record.settling = true;
    record.serverMessageId = message.id;
    if (record.preparedBlob && message.media) {
      await mediaCache.save(message.id, record.preparedBlob, {
        mimeType: message.media.mimeType || record.preparedBlob.type,
        size: record.preparedBlob.size,
        originalName: record.kind === "voice" ? "Voice message" : message.media.originalName || record.file.name,
        savedAt: Date.now(),
      });
    }
    if (records.current.get(record.id) !== record) return;
    acceptMediaMessage(message);
    record.controller = undefined;
    remove(record.id);
  }, [acceptMediaMessage, remove]);

  const run = useCallback(async (record: UploadRecord) => {
    if (!canUseChatConnection(true)) return;
    const controller = new AbortController();
    record.controller = controller;
    record.awaitingMessage = false;
    updateMessage(record.id, (message) => ({
      ...message,
      status: "sending",
      upload: { stage: record.preparedBlob ? "uploading" : "preparing", progress: 0 },
    }));

    try {
      const blob = record.preparedBlob ?? (
        record.kind === "image" && record.file.type !== MEDIA_LIMITS.animatedImageType
          ? await processImage(record.file, MEDIA_LIMITS.imageProcessing)
          : record.file
      );
      if (controller.signal.aborted || records.current.get(record.id) !== record) return;
      record.preparedBlob = blob;
      if (record.kind === "voice") {
        await mediaCache.save(`tmp-${record.id}`, blob, {
          mimeType: blob.type,
          size: blob.size,
          originalName: "Voice message",
          savedAt: Date.now(),
        });
        if (controller.signal.aborted || records.current.get(record.id) !== record) {
          await mediaCache.remove(`tmp-${record.id}`);
          return;
        }
      }

      if (blob !== record.file) {
        const oldUrl = record.previewUrl;
        record.previewUrl = URL.createObjectURL(blob);
        URL.revokeObjectURL(oldUrl);
      }
      updateMessage(record.id, (message) => ({
        ...message,
        media: message.media ? { ...message.media, url: record.previewUrl, mimeType: blob.type, size: blob.size } : null,
        upload: { stage: "uploading", progress: 0 },
      }));

      const key = await uploadFile("chat-media", blob, {
        signal: controller.signal,
        ...(record.kind === "voice" ? {} : { originalName: record.file.name }),
        onProgress: (progress) => updateMessage(record.id, (message) => ({
          ...message,
          upload: { stage: "uploading", progress },
        })),
      });
      if (controller.signal.aborted || records.current.get(record.id) !== record) return;

      const payload: MediaMessagePayload = record.kind === "voice"
        ? {
            conversationId: record.conversationId,
            replyToId: record.replyToId,
            attachment: { key, kind: "voice", size: blob.size, durationSec: record.durationSec ?? 0, waveform: record.waveform ?? [] },
          }
        : {
            conversationId: record.conversationId,
            replyToId: record.replyToId,
            attachment: { key, kind: record.kind, originalName: record.file.name, size: blob.size },
            caption: record.caption,
          };
      record.awaitingMessage = true;
      updateMessage(record.id, (message) => ({ ...message, upload: { stage: "sending", progress: 100 } }));
      const message = await sendMedia(payload);
      if (records.current.get(record.id) === record) await settle(record, message);
    } catch (error) {
      if (controller.signal.aborted || records.current.get(record.id) !== record || record.settling) return;
      record.controller = undefined;
      const detail = errorMessage(error);
      updateMessage(record.id, (message) => ({
        ...message,
        status: "error",
        upload: { stage: "error", progress: message.upload?.progress ?? 0, error: detail },
      }));
    }
  }, [sendMedia, settle, updateMessage]);

  const startRecord = useCallback((file: File, kind: UploadRecord["kind"], caption: string | null, replyToId: string | null, voice?: { durationSec: number; waveform: number[] }): boolean => {
    if (!canUseChatConnection(true) || !conversationId) return false;
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const clientId = `upload-${id}`;
    const previewUrl = URL.createObjectURL(file);
    const record: UploadRecord = {
      id: clientId,
      conversationId,
      file,
      kind,
      caption: caption?.trim() || null,
      replyToId,
      ...(voice ? { durationSec: voice.durationSec, waveform: voice.waveform } : {}),
      previewUrl,
      awaitingMessage: false,
      settling: false,
    };
    records.current.set(clientId, record);
    const timestamp = Math.max(Date.now(), creationTime.current + 1);
    creationTime.current = timestamp;
    const message: PendingMessage = {
      id: `tmp-${clientId}`,
      clientId,
      conversationId,
      senderId: currentUserId ?? "",
      type: kind,
      createdAt: new Date(timestamp).toISOString(),
      text: record.caption,
      media: { url: previewUrl, kind, mimeType: file.type, size: file.size, originalName: kind === "voice" ? "Voice message" : file.name, ...(voice ? { durationSec: voice.durationSec, waveform: voice.waveform } : {}) },
      reactions: [],
      editedAt: null,
      deletedAt: null,
      replyToId,
      status: "sending",
      upload: { stage: "preparing", progress: 0 },
    };
    setMessages((current) => [...current, message]);
    void run(record);
    return true;
  }, [conversationId, currentUserId, run]);

  const start = useCallback((file: File, caption: string, replyToId?: string | null) => {
    return startRecord(file, file.type.startsWith("video/") ? "video" : "image", caption, replyToId ?? null);
  }, [startRecord]);
  const startVoice = useCallback((blob: Blob, contentType: string, durationSec: number, waveform: number[], replyToId?: string | null) => {
    const type = contentType || blob.type || "audio/webm";
    const baseType = type.split(";")[0];
    const extension = baseType === "audio/ogg" ? "ogg" : baseType === "audio/mp4" ? "m4a" : "webm";
    return startRecord(new File([blob], `voice-message.${extension}`, { type }), "voice", null, replyToId ?? null, { durationSec, waveform });
  }, [startRecord]);

  const cancel = useCallback((id: string) => remove(id, true), [remove]);
  const removeFailed = useCallback((id: string) => remove(id), [remove]);
  const retry = useCallback((id: string) => {
    if (!canUseChatConnection(true)) return;
    const record = records.current.get(id);
    if (record && !record.controller) void run(record);
  }, [run]);

  useEffect(() => {
    isMounted.current = true;
    const interceptMessage = (message: Message) => {
      if (message.conversationId !== conversationId || message.senderId !== currentUserId || !message.media) return false;
      const match = [...records.current.values()].find((record) => {
        if (!record.awaitingMessage) return false;
        return message.media?.kind === record.kind &&
          message.media.size === record.preparedBlob?.size &&
          (record.kind === "voice"
            ? message.media.durationSec === record.durationSec && JSON.stringify(message.media.waveform) === JSON.stringify(record.waveform)
            : message.media.originalName === record.file.name && (message.text?.trim() || null) === record.caption) &&
          (message.replyToId ?? null) === record.replyToId;
      });
      if (!match) return false;
      if (match.settling) return match.serverMessageId === message.id;
      void settle(match, message);
      return true;
    };
    const unregister = registerPendingMediaMessageHandler(interceptMessage);
    const activeRecords = records.current;
    return () => {
      isMounted.current = false;
      unregister();
      for (const [id, record] of activeRecords) {
        record.controller?.abort();
        URL.revokeObjectURL(record.previewUrl);
        void mediaCache.remove(`tmp-${record.id}`);
        activeRecords.delete(id);
      }
    };
  }, [conversationId, currentUserId, settle]);

  return { messages, start, startVoice, cancel, retry, removeFailed };
}
