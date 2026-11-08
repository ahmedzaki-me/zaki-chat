export type MediaCacheMeta = {
  mimeType: string;
  size: number;
  originalName: string;
  savedAt: number;
  aspectRatio?: number;
  width?: number;
  height?: number;
};

export type CachedMedia = MediaCacheMeta & { messageId: string; blob: Blob };
export type MediaCacheUsage = { count: number; totalBytes: number };

const DATABASE_NAME = "zaki-chat-media";
const DATABASE_VERSION = 1;
const STORE_NAME = "messages";
const CHANGE_EVENT = "zaki-chat-media-cache-change";
const MAX_MEMORY_ITEMS = 80;

let persistRequested = false;
let dbPromise: Promise<IDBDatabase | null> | null = null;

// L1 In-Memory Caches for synchronous O(1) checks & instant rendering
let cachedKeys: Set<string> | null = null;
const memoryCache = new Map<string, CachedMedia>();
let initPromise: Promise<void> | null = null;

function notifyChange(messageId?: string): void {
  try {
    window.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, { detail: { messageId } }),
    );
  } catch {
    // Cache notifications are best-effort.
  }
}

function getDatabase(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, {
            keyPath: "messageId",
          });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          dbPromise = null;
        };
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        dbPromise = null;
        resolve(null);
      };
      request.onblocked = () => {
        dbPromise = null;
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

export function initMediaCache(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const database = await getDatabase();
      if (!database) return;
      await new Promise<void>((resolve) => {
        try {
          const transaction = database.transaction(STORE_NAME, "readonly");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.getAll();
          request.onsuccess = () => {
            const records = (request.result as CachedMedia[]) || [];
            cachedKeys = new Set(records.map((r) => r.messageId));
            // Prewarm L1 memory cache with the most recent items
            const sorted = records
              .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))
              .slice(0, MAX_MEMORY_ITEMS);
            for (const item of sorted) {
              memoryCache.set(item.messageId, item);
            }
            resolve();
          };
          request.onerror = () => resolve();
          transaction.onerror = () => resolve();
          transaction.onabort = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // Best-effort initialization
    }
  })();
  return initPromise;
}

// Auto-initialize when running in browser
if (typeof window !== "undefined") {
  void initMediaCache();
}

export function isCachedSync(messageId: string): boolean | null {
  if (memoryCache.has(messageId)) return true;
  if (cachedKeys !== null) return cachedKeys.has(messageId);
  return null;
}

export function getMemory(messageId: string): CachedMedia | null {
  return memoryCache.get(messageId) ?? null;
}

async function requestValue<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  try {
    const database = await getDatabase();
    if (!database) return null;
    return await new Promise<T | null>((resolve) => {
      let value: T | null = null;
      let settled = false;
      const finish = (result: T | null) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      try {
        const transaction = database.transaction(STORE_NAME, mode);
        const request = run(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => {
          value = request.result ?? null;
        };
        transaction.oncomplete = () => finish(value);
        transaction.onerror = () => finish(null);
        transaction.onabort = () => finish(null);
      } catch {
        finish(null);
      }
    });
  } catch {
    return null;
  }
}

async function writeRequest(
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<boolean> {
  try {
    const database = await getDatabase();
    if (!database) return false;
    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (success: boolean) => {
        if (settled) return;
        settled = true;
        resolve(success);
      };
      try {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        run(transaction.objectStore(STORE_NAME));
        transaction.oncomplete = () => finish(true);
        transaction.onerror = () => finish(false);
        transaction.onabort = () => finish(false);
      } catch {
        finish(false);
      }
    });
  } catch {
    return false;
  }
}

export async function get(messageId: string): Promise<CachedMedia | null> {
  const fromMemory = memoryCache.get(messageId);
  if (fromMemory) return fromMemory;

  if (cachedKeys !== null && !cachedKeys.has(messageId)) {
    return null;
  }

  try {
    const record = await requestValue<CachedMedia>("readonly", (store) =>
      store.get(messageId),
    );
    if (record) {
      cachedKeys?.add(messageId);
      if (memoryCache.size >= MAX_MEMORY_ITEMS) {
        const oldestKey = memoryCache.keys().next().value;
        if (oldestKey) memoryCache.delete(oldestKey);
      }
      memoryCache.set(messageId, record);
    }
    return record;
  } catch {
    return null;
  }
}

export async function save(
  messageId: string,
  blob: Blob,
  meta: MediaCacheMeta,
): Promise<boolean> {
  try {
    const item: CachedMedia = { messageId, blob, ...meta };
    const saved = await writeRequest((store) => store.put(item));
    if (!saved) return false;

    cachedKeys?.add(messageId);
    if (memoryCache.size >= MAX_MEMORY_ITEMS) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }
    memoryCache.set(messageId, item);

    notifyChange(messageId);
    if (!persistRequested) {
      persistRequested = true;
      try {
        void navigator.storage?.persist?.().catch(() => false);
      } catch {
        // Persistent storage is an optional browser optimization.
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function updateMetadata(
  messageId: string,
  patch: Partial<MediaCacheMeta>,
): Promise<void> {
  try {
    const memoryItem = memoryCache.get(messageId);
    if (memoryItem) {
      Object.assign(memoryItem, patch);
    }
    await writeRequest((store) => {
      const req = store.get(messageId);
      req.onsuccess = () => {
        const existing = req.result as CachedMedia | undefined;
        if (existing) {
          store.put({ ...existing, ...patch });
        }
      };
      return req;
    });
  } catch {
    // Non-critical optimization
  }
}

export async function remove(messageId: string): Promise<void> {
  try {
    cachedKeys?.delete(messageId);
    memoryCache.delete(messageId);
    await writeRequest((store) => store.delete(messageId));
    notifyChange(messageId);
  } catch {
    // Cache cleanup must never interrupt message deletion.
  }
}

export async function clearAll(): Promise<boolean> {
  try {
    cachedKeys?.clear();
    memoryCache.clear();
    const cleared = await writeRequest((store) => store.clear());
    if (!cleared) return false;
    notifyChange();
    return true;
  } catch {
    // Cache cleanup must never interrupt logout or settings actions.
    return false;
  }
}

export async function getUsage(): Promise<MediaCacheUsage> {
  try {
    const records = await requestValue<CachedMedia[]>("readonly", (store) =>
      store.getAll(),
    );
    return records
      ? {
          count: records.length,
          totalBytes: records.reduce((total, item) => total + item.size, 0),
        }
      : { count: 0, totalBytes: 0 };
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}

export function addMediaCacheListener(
  listener: (messageId?: string) => void,
): () => void {
  const onChange = (event: Event) => {
    const detail = (event as CustomEvent<{ messageId?: string }>).detail;
    listener(detail?.messageId);
  };
  try {
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  } catch {
    return () => undefined;
  }
}
