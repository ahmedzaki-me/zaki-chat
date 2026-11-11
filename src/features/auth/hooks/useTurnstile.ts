import { useCallback, useRef, useState } from "react";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const ref = useRef<TurnstileInstance | undefined>(undefined);
  const isEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

  const handleSuccess = useCallback((nextToken: string) => {
    setHasError(false);
    setToken(nextToken);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setHasError(false);
    try {
      ref.current?.reset();
    } catch {
      // Ignore reset failure if widget is unmounted or in error state
    }
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
  }, []);

  const handleError = useCallback(() => {
    setToken(null);
    setHasError(true);
  }, []);

  return {
    token,
    hasError,
    setToken: handleSuccess,
    ref,
    reset,
    handleExpire,
    handleError,
    isEnabled,
    isReady: !isEnabled || Boolean(token),
  };
}
