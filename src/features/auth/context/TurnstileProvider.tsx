import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTheme } from "@/shared/hooks/useTheme";
import { cn } from "@/shared/lib/utils";

export type TurnstileStatus =
  | "idle"
  | "verifying"
  | "ready"
  | "interactive"
  | "error";

export interface TurnstileContextValue {
  token: string | null;
  status: TurnstileStatus;
  errorMessage?: string;
  consume: () => string | null;
  reset: () => void;
  waitForToken: () => Promise<string>;
  registerSlot: (element: HTMLElement | null) => () => void;
  isEnabled: boolean;
  isReady: boolean;
}

const TurnstileContext = createContext<TurnstileContextValue | null>(null);

export function TurnstileProvider({ children }: { children: ReactNode }) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const isEnabled = Boolean(siteKey);
  const { mode } = useTheme();

  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<TurnstileStatus>(
    isEnabled ? "verifying" : "ready",
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [slots, setSlots] = useState<HTMLElement[]>([]);
  const [fallbackEl, setFallbackEl] = useState<HTMLDivElement | null>(null);

  const widgetRef = useRef<TurnstileInstance | undefined>(undefined);
  const tokenRef = useRef<string | null>(token);
  const statusRef = useRef<TurnstileStatus>(status);

  useEffect(() => {
    tokenRef.current = token;
    statusRef.current = status;
  }, [token, status]);

  const pendingResolversRef = useRef<Array<(token: string) => void>>([]);
  const pendingRejectersRef = useRef<Array<(error: Error) => void>>([]);

  const handleSuccess = useCallback((receivedToken: string) => {
    tokenRef.current = receivedToken;
    statusRef.current = "ready";
    setToken(receivedToken);
    setStatus("ready");
    setErrorMessage(undefined);
    const resolvers = pendingResolversRef.current;
    pendingResolversRef.current = [];
    pendingRejectersRef.current = [];
    resolvers.forEach((resolve) => resolve(receivedToken));
  }, []);

  const handleError = useCallback(() => {
    tokenRef.current = null;
    statusRef.current = "error";
    setStatus("error");
    setErrorMessage("Verification check failed. Please try again.");
    const rejecters = pendingRejectersRef.current;
    pendingResolversRef.current = [];
    pendingRejectersRef.current = [];
    const err = new Error("Turnstile verification failed");
    rejecters.forEach((reject) => reject(err));
  }, []);

  const handleBeforeInteractive = useCallback(() => {
    setStatus("interactive");
    statusRef.current = "interactive";
  }, []);

  const handleAfterInteractive = useCallback(() => {
    // Challenge was solved interactively; onSuccess will follow
  }, []);

  const handleExpire = useCallback(() => {
    tokenRef.current = null;
    statusRef.current = isEnabled ? "verifying" : "ready";
    setToken(null);
    setStatus(isEnabled ? "verifying" : "ready");
    try {
      widgetRef.current?.reset();
    } catch {
      // Ignore reset failure if widget unmounted
    }
  }, [isEnabled]);

  const reset = useCallback(() => {
    tokenRef.current = null;
    statusRef.current = isEnabled ? "verifying" : "ready";
    setToken(null);
    setStatus(isEnabled ? "verifying" : "ready");
    setErrorMessage(undefined);
    try {
      widgetRef.current?.reset();
    } catch {
      // Ignore reset failure
    }
  }, [isEnabled]);

  const consume = useCallback(() => {
    const current = tokenRef.current;
    tokenRef.current = null;
    statusRef.current = isEnabled ? "verifying" : "ready";
    setToken(null);
    setStatus(isEnabled ? "verifying" : "ready");
    try {
      widgetRef.current?.reset();
    } catch {
      // Ignore reset failure
    }
    return current;
  }, [isEnabled]);

  const waitForToken = useCallback((): Promise<string> => {
    if (!isEnabled) {
      return Promise.resolve("");
    }
    if (tokenRef.current && statusRef.current === "ready") {
      return Promise.resolve(tokenRef.current);
    }
    if (statusRef.current === "error") {
      reset();
    }
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Verification timed out. Please try again."));
      }, 15000);

      pendingResolversRef.current.push((t) => {
        clearTimeout(timer);
        resolve(t);
      });
      pendingRejectersRef.current.push((err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }, [isEnabled, reset]);

  const registerSlot = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};
    setSlots((prev) => [...prev, element]);
    return () => {
      setSlots((prev) => prev.filter((el) => el !== element));
    };
  }, []);

  const activeSlot = slots[slots.length - 1] ?? null;
  const portalTarget = activeSlot || fallbackEl;

  return (
    <TurnstileContext.Provider
      value={{
        token,
        status,
        errorMessage,
        consume,
        reset,
        waitForToken,
        registerSlot,
        isEnabled,
        isReady: !isEnabled || (status === "ready" && Boolean(token)),
      }}
    >
      {children}

      {/* Hidden fallback container so the widget remains attached if no slot is active */}
      <div
        ref={setFallbackEl}
        aria-hidden="true"
        style={{ display: "none" }}
      />

      {/* Persistent single widget instance portaled into active slot or fallback */}
      {isEnabled && siteKey && portalTarget && (
        createPortal(
          <Turnstile
            ref={widgetRef}
            siteKey={siteKey}
            options={{
              theme: mode === "dark" ? "dark" : "light",
              size: "flexible",
              appearance: "interaction-only",
            }}
            onSuccess={handleSuccess}
            onExpire={handleExpire}
            onError={handleError}
            onTimeout={handleExpire}
            onBeforeInteractive={handleBeforeInteractive}
            onAfterInteractive={handleAfterInteractive}
          />,
          portalTarget,
        )
      )}
    </TurnstileContext.Provider>
  );
}

export function useTurnstileToken() {
  const context = useContext(TurnstileContext);
  if (!context) {
    throw new Error(
      "useTurnstileToken must be used within a TurnstileProvider",
    );
  }
  return context;
}

export function TurnstileSlot({ className }: { className?: string }) {
  const { status, reset, registerSlot, isEnabled } = useTurnstileToken();
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slotRef.current) {
      return registerSlot(slotRef.current);
    }
  }, [registerSlot]);

  if (!isEnabled) {
    return null;
  }

  const isInteractive = status === "interactive";
  const isError = status === "error";

  return (
    <div
      className={cn(
        "w-full",
        isInteractive || isError
          ? "flex flex-col items-center gap-2 py-1.5 text-center"
          : "m-0 h-0 min-h-0 overflow-hidden p-0",
        className,
      )}
    >
      {isInteractive && (
        <p className="animate-in fade-in text-xs text-muted-foreground duration-200">
          Please complete the check below
        </p>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <span>Verification check failed.</span>
          <button
            type="button"
            onClick={reset}
            className="font-medium underline underline-offset-2 hover:opacity-80"
          >
            Try again
          </button>
        </div>
      )}

      <div
        ref={slotRef}
        className={cn(
          "w-full",
          isInteractive
            ? "flex min-h-[65px] min-w-[300px] max-w-full items-center justify-center overflow-x-auto"
            : "m-0 h-0 min-h-0 overflow-hidden p-0",
        )}
      />
    </div>
  );
}
