import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { clearAllReadWatermarks } from "@/features/chat/cache/readWatermark";

const DATABASE = "zaki-chat-query-cache";
const STORE = "query-client";
let persistenceBlocked = false;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

export const queryPersister = createAsyncStoragePersister({
  key: "zaki-chat-query-cache",
  storage: {
    getItem: (key) => transact<string | undefined>("readonly", (store) => store.get(key)).then((value) => value ?? null),
    setItem: (key, value) => persistenceBlocked
      ? Promise.resolve()
      : transact("readwrite", (store) => store.put(value, key)).then(() => undefined),
    removeItem: (key) => transact("readwrite", (store) => store.delete(key)).then(() => undefined),
  },
});

export async function clearPersistedQueryCache() {
  persistenceBlocked = true;
  clearAllReadWatermarks();
  try {
    await queryPersister.removeClient();
  } catch {
    // Persistence is best effort; logout must still complete.
  }
}

export function enablePersistedQueryCache() {
  persistenceBlocked = false;
}
