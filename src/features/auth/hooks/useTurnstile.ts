import { useCallback, useRef, useState } from "react";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const ref = useRef<TurnstileInstance | undefined>(undefined);
  const isEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

  const reset = useCallback(() => {
    setToken(null);
    try {
      ref.current?.reset();
    } catch {
      // Ignore reset failure if widget is unmounted or in error state
    }
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
  }, []);

  return {
    token,
    setToken,
    ref,
    reset,
    handleExpire,
    isEnabled,
    isReady: !isEnabled || Boolean(token),
  };
}
