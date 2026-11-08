import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { canUseChatConnection } from "@/shared/lib/offlineGuard";
import { useInstallPrompt } from "@/core/pwa/useInstallPrompt";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { deletePushSubscription, getPushConfig, hasPushFlag, savePushSubscription, setPushFlag } from "@/features/notifications/api/push.service";
import type { PushSubscriptionData } from "@/features/notifications/types/notification.types";

export type PushState = "unsupported" | "needs-install" | "server-disabled" | "permission-denied" | "off" | "on" | "busy";
type EnableResult = "enabled" | "denied" | "unavailable" | "error";
const PUSH_CHANGE_EVENT = "push-subscription-change";
function iosInstallRequired() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function standalone() { return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone); }
function toApplicationKey(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}
function subscriptionData(subscription: PushSubscription): PushSubscriptionData {
  const data = subscription.toJSON();
  if (!data.keys?.p256dh || !data.keys.auth) throw new Error("The browser did not provide valid push keys.");
  return { endpoint: subscription.endpoint, keys: { p256dh: data.keys.p256dh, auth: data.keys.auth } };
}

export function usePushSubscription() {
  const { user } = useAuth();
  const { promptInstall } = useInstallPrompt();
  const [state, setState] = useState<PushState>("off");
  const [busy, setBusy] = useState(false);
  const inspect = useCallback(async () => {
    if (!import.meta.env.PROD) { setState("unsupported"); return; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setState("unsupported"); return; }
    if (iosInstallRequired() && !standalone()) { setState("needs-install"); return; }
    if (Notification.permission === "denied") { setState("permission-denied"); return; }
    try {
      const config = await getPushConfig();
      if (!config.enabled || !config.publicKey) { setState("server-disabled"); return; }
    } catch { setState("server-disabled"); return; }
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    setState(user && subscription && hasPushFlag(user.id) && Notification.permission === "granted" ? "on" : "off");
  }, [user]);
  useEffect(() => {
    void inspect();
    const refresh = () => void inspect();
    window.addEventListener(PUSH_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(PUSH_CHANGE_EVENT, refresh);
  }, [inspect]);

  const enable = useCallback(async (): Promise<EnableResult> => {
    if (!user || busy) return "unavailable";
    if (!canUseChatConnection(true)) return "unavailable";
    setBusy(true); setState("busy");
    let subscription: PushSubscription | null = null;
    try {
      const config = await getPushConfig();
      if (!config.enabled || !config.publicKey) { setState("server-disabled"); return "unavailable"; }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "permission-denied" : "off");
        return permission === "denied" ? "denied" : "unavailable";
      }
      const registration = await navigator.serviceWorker.ready;
      subscription = await registration.pushManager.getSubscription();
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toApplicationKey(config.publicKey) });
      await savePushSubscription(subscriptionData(subscription));
      setPushFlag(user.id, true); setState("on");
      window.dispatchEvent(new Event(PUSH_CHANGE_EVENT));
      return "enabled";
    } catch {
      if (subscription) await subscription.unsubscribe().catch(() => false);
      setPushFlag(user.id, false); setState("off");
      return "error";
    } finally { setBusy(false); }
  }, [busy, user]);

  const toggle = useCallback(async (enabled: boolean) => {
    if (!user || busy) return;
    if (!enabled) {
      setBusy(true); setState("busy");
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await deletePushSubscription(sub.endpoint).catch(() => undefined);
        }
        setPushFlag(user.id, false); setState("off"); window.dispatchEvent(new Event(PUSH_CHANGE_EVENT));
      } catch (error) { toast.error(error instanceof Error ? error.message : "Could not turn notifications off."); await inspect(); }
      finally { setBusy(false); }
      return;
    }
    const result = await enable();
    if (result === "enabled") toast.success("Notifications enabled");
    else if (result === "error") toast.error("Couldn't enable notifications. Please try again.");
  }, [enable, busy, inspect, user]);
  return { state, busy, toggle, enable, promptInstall };
}
