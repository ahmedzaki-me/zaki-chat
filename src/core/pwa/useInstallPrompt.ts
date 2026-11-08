import { useSyncExternalStore } from "react";
import {
  getInstallPromptSnapshot,
  attemptNavigatorInstall,
  promptInstallApp,
  subscribeInstallPrompt,
} from "@/core/pwa/installPromptStore";

const serverSnapshot = { isStandalone: false, hasDeferredPrompt: false };

export function useInstallPrompt() {
  const state = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    () => serverSnapshot,
  );
  return {
    ...state,
    attemptNavigatorInstall,
    promptInstall: promptInstallApp,
  };
}
