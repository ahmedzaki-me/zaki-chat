import { api } from "@/core/http/axios";

import type { PushConfig, PushSubscriptionData } from "@/features/notifications/types/notification.types";



export async function getPushConfig() {
  const { data } = await api.get<PushConfig>("/push/config");
  return data;
}
export async function savePushSubscription(subscription: PushSubscriptionData) {
  await api.post("/push/subscriptions", subscription);
}
export async function deletePushSubscription(endpoint: string) {
  await api.delete("/push/subscriptions", { data: { endpoint } });
}

export function pushFlagKey(userId: string) { return `push:enabled:${userId}`; }
export function clearPushFlag(userId: string) {
  try { localStorage.removeItem(pushFlagKey(userId)); } catch { /* Storage may be unavailable. */ }
}
export function setPushFlag(userId: string, enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(pushFlagKey(userId), "1");
    else clearPushFlag(userId);
  } catch { /* Storage is best effort. */ }
}
export function hasPushFlag(userId: string) {
  try { return localStorage.getItem(pushFlagKey(userId)) === "1"; } catch { return false; }
}
export async function removeLocalPushSubscription(userId?: string) {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      if (userId) {
        void deletePushSubscription(subscription.endpoint).catch(() => undefined);
      }
      await subscription.unsubscribe();
    }
  } catch { /* Logout must never wait on push cleanup. */ }
  if (userId) clearPushFlag(userId);
}
