import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

export function PwaUpdatePrompt() {
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const promptShown = useRef(false);
  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, swRegistration) {
      registration.current = swRegistration;
    },
    onNeedRefresh() {
      if (promptShown.current) return;
      promptShown.current = true;
      toast("A new version is available", {
        duration: Infinity,
        action: {
          label: "Update",
          onClick: () => void updateServiceWorker(true),
        },
        cancel: {
          label: "Later",
          onClick: () => {
            promptShown.current = false;
          },
        },
        onDismiss: () => {
          promptShown.current = false;
        },
      });
    },
  });

  useEffect(() => {
    let lastCheck = 0;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !registration.current)
        return;
      const now = Date.now();
      if (now - lastCheck < 3 * 60 * 1000) return;
      lastCheck = now;
      void registration.current.update();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return null;
}
