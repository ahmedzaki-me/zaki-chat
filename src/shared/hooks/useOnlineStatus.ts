import { useSyncExternalStore } from "react";
import { socket } from "@/core/socket/socket";

type OnlineSnapshot = { networkOnline: boolean; socketConnected: boolean };
const listeners = new Set<() => void>();
const serverSnapshot: OnlineSnapshot = { networkOnline: false, socketConnected: false };
let snapshot: OnlineSnapshot = {
  networkOnline: typeof navigator === "undefined" || navigator.onLine,
  socketConnected: socket.connected,
};

function update() {
  const next = {
    networkOnline: typeof navigator === "undefined" || navigator.onLine,
    socketConnected: socket.connected,
  };
  if (next.networkOnline === snapshot.networkOnline && next.socketConnected === snapshot.socketConnected) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  socket.on("connect", update);
  socket.on("disconnect", update);
  socket.on("connect_error", update);
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => snapshot,
    () => serverSnapshot,
  );
}
