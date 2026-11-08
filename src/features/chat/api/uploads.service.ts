import { api } from "@/core/http/axios";

import type { components } from "@/shared/types/api.generated";

type PresignResponse = components["schemas"]["PresignUploadResponse"];

export type UploadOptions = { signal?: AbortSignal; onProgress?: (percent: number) => void; originalName?: string };

function putToStorage(url: string, headers: Record<string, string>, blob: Blob, options: UploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cleanup = () => options.signal?.removeEventListener("abort", abort);
    const abort = () => xhr.abort();
    if (options.signal?.aborted) return reject(new DOMException("Upload canceled", "AbortError"));
    xhr.open("PUT", url);
    xhr.withCredentials = false;
    Object.entries(headers).forEach(([name, value]) => {
      if (name.toLowerCase() !== "content-length") xhr.setRequestHeader(name, value);
    });
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("The file upload failed. Please try again."));
    };
    xhr.onerror = () => { cleanup(); reject(new Error("The file upload failed. Check your connection and try again.")); };
    xhr.onabort = () => { cleanup(); reject(new DOMException("Upload canceled", "AbortError")); };
    options.signal?.addEventListener("abort", abort, { once: true });
    xhr.send(blob);
  });
}

export async function uploadFile(purpose: string, blob: Blob, options: UploadOptions = {}): Promise<string> {
  const contentType = blob.type || "application/octet-stream";
  const { data } = await api.post<PresignResponse>("/uploads/presign", {
    purpose,
    contentType,
    size: blob.size,
    ...(options.originalName !== undefined ? { originalName: options.originalName } : {}),
  }, { signal: options.signal });
  await putToStorage(data.url, data.headers, blob, options);
  return data.key;
}
