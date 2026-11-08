import { useEffect, useRef, useState } from "react";
import type { ConversationResponse } from "@/features/conversations/types/conversation.types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";
import { queryClient } from "@/core/query/queryClient";
import { closeConversationNotifications } from "@/features/notifications/lib/notifications";
import { socket } from "@/core/socket/socket";
import {
  hasPushFlag,
  savePushSubscription,
  setPushFlag,
} from "@/features/notifications/api/push.service";
import { getConversation } from "@/features/conversations/api/conversation.service";
import { router } from "@/core/router/routes";

type Target = { kind: "conversation"; id: string } | { kind: "home" };
function readTarget(search: string): Target | null {
  const params = new URLSearchParams(search);
  const id = params.get("openConversation");
  if (id) return { kind: "conversation", id };
  return params.has("openOwnerHome") ? { kind: "home" } : null;
}

export function AppPushEffects() {
  const { user, isLoading } = useAuth();
  const [route, setRoute] = useState(() => router.state.location);
  const pending = useRef<Target | null>(readTarget(window.location.search));
  const lastSent = useRef("");
  useEffect(() => router.subscribe((state) => setRoute(state.location)), []);

  useEffect(() => {
    const onMessage = (
      event: MessageEvent<{ type?: string; conversationId?: string }>,
    ) => {
      if (event.data?.type === "open-conversation" && event.data.conversationId)
        pending.current = {
          kind: "conversation",
          id: event.data.conversationId,
        };
      else if (event.data?.type === "open-owner-home")
        pending.current = { kind: "home" };
      else return;
      void applyTarget();
    };
    async function applyTarget() {
      const target = pending.current;
      if (!target || isLoading || !user) return;
      pending.current = null;
      try {
        if (target.kind === "home")
          await router.navigate(
            user.role === "owner" ? "/owner" : "/chat-with-zaki",
            { replace: true },
          );
        else if (user.role === "owner") {
          await getConversation(target.id);
          await router.navigate(`/owner/${encodeURIComponent(target.id)}`, {
            replace: true,
          });
        } else await router.navigate("/chat-with-zaki", { replace: true });
      } catch {
        await router.navigate(
          user.role === "owner" ? "/owner" : "/chat-with-zaki",
          { replace: true },
        );
      }
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }
    navigator.serviceWorker?.addEventListener("message", onMessage);
    void applyTarget();
    return () =>
      navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, [isLoading, user, route]);

  useEffect(() => {
    if (!user || isLoading) {
      lastSent.current = "";
      return;
    }
    const send = () => {
      if (!socket.connected) return;
      let conversationId: string | undefined;
      const ownerMatch = router.state.location.pathname.match(
        /^\/owner\/([^/]+)\/?$/,
      );
      if (user.role === "owner")
        conversationId = ownerMatch
          ? decodeURIComponent(ownerMatch[1])
          : undefined;
      else
        conversationId = queryClient.getQueryData<ConversationResponse>(
          conversationKeys.mine(),
        )?.conversation.id;
      const visible =
        document.visibilityState === "visible" && document.hasFocus();
      const id = visible ? conversationId : undefined;
      const key = `${visible}:${id ?? ""}`;
      if (key === lastSent.current) return;
      lastSent.current = key;
      socket.emit(
        "app:visibility",
        id ? { visible, conversationId: id } : { visible },
      );
      if (id) void closeConversationNotifications(id);
    };
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(send, 150);
    };
    const onConnect = () => {
      lastSent.current = "";
      schedule();
    };
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("focus", schedule);
    window.addEventListener("blur", schedule);
    window.addEventListener("pagehide", schedule);
    socket.on("connect", onConnect);
    const unsubscribe = queryClient.getQueryCache().subscribe(schedule);
    schedule();
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("focus", schedule);
      window.removeEventListener("blur", schedule);
      window.removeEventListener("pagehide", schedule);
      socket.off("connect", onConnect);
      unsubscribe();
    };
  }, [isLoading, user, route]);

  useEffect(() => {
    if (
      !user ||
      isLoading ||
      !import.meta.env.PROD ||
      !("serviceWorker" in navigator) ||
      !("Notification" in window)
    )
      return;
    let cancelled = false;
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (cancelled) return;
        if (!subscription && hasPushFlag(user.id)) setPushFlag(user.id, false);
        if (
          subscription &&
          hasPushFlag(user.id) &&
          Notification.permission === "granted"
        ) {
          const json = subscription.toJSON();
          if (json.keys?.auth && json.keys.p256dh)
            await savePushSubscription({
              endpoint: subscription.endpoint,
              keys: { auth: json.keys.auth, p256dh: json.keys.p256dh },
            });
        }
      } catch {
        /* Restoring an existing subscription is best effort. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);
  return null;
}
