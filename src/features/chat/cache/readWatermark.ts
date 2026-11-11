const STORAGE_KEY = "Zaki-chat-read-watermarks";
const MAX_ENTRIES = 200;

let memoryCache: Map<string, string> | null = null;

function entryKey(userId: string, conversationId: string): string {
  return `${userId}:${conversationId}`;
}

function loadStore(): Map<string, string> {
  if (memoryCache) return memoryCache;

  const map = new Map<string, string>();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string" && v.length > 0) {
            map.set(k, v);
          }
        }
      }
    }
  } catch {
    // Storage access is best effort (e.g. private browsing or quota).
  }

  memoryCache = map;
  return map;
}

function persistStore(store: Map<string, string>): void {
  try {
    if (store.size > MAX_ENTRIES) {
      const excess = store.size - MAX_ENTRIES;
      const keys = store.keys();
      for (let i = 0; i < excess; i += 1) {
        const next = keys.next();
        if (next.done) break;
        store.delete(next.value);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(store)));
  } catch {
    // Persistence is best effort.
  }
}

/**
 * Compare two server message ObjectIds chronologically.
 * MongoDB 24-hex ObjectIds encode a big-endian Unix timestamp prefix,
 * so fixed-length lowercase lexicographical comparison is monotonic.
 */
export function compareMessageIds(a: string, b: string): number {
  if (a === b) return 0;
  return a > b ? 1 : -1;
}

export function getReadWatermark(userId: string, conversationId: string): string {
  if (!userId || !conversationId) return "";
  return loadStore().get(entryKey(userId, conversationId)) ?? "";
}

export function setReadWatermark(
  userId: string,
  conversationId: string,
  messageId: string,
): void {
  if (!userId || !conversationId || !messageId) return;
  const store = loadStore();
  const key = entryKey(userId, conversationId);
  const current = store.get(key) ?? "";
  if (current && compareMessageIds(messageId, current) <= 0) return;

  // Refresh insertion order for bounded LRU eviction.
  store.delete(key);
  store.set(key, messageId);
  persistStore(store);
}

export function clearConversationReadWatermark(conversationId: string): void {
  if (!conversationId) return;
  const store = loadStore();
  const suffix = `:${conversationId}`;
  let changed = false;

  for (const key of store.keys()) {
    if (key.endsWith(suffix)) {
      store.delete(key);
      changed = true;
    }
  }

  if (changed) persistStore(store);
}

export function clearAllReadWatermarks(): void {
  memoryCache = new Map();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Cleanup is best effort.
  }
}
