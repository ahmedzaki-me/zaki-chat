import { forwardRef, useState, useCallback } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTheme } from "@/shared/hooks/useTheme";
import { cn } from "@/shared/lib/utils";

export interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: unknown) => void;
  action?: string;
  className?: string;
  size?: "normal" | "flexible" | "compact";
  appearance?: "always" | "execute" | "interaction-only";
}

export const TurnstileWidget = forwardRef<
  TurnstileInstance | undefined,
  TurnstileWidgetProps
>(
  (
    {
      onSuccess,
      onExpire,
      onError,
      action,
      className = "",
      size = "flexible",
      appearance = "interaction-only",
    },
    ref,
  ) => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
    const { mode } = useTheme();
    const [needsInteraction, setNeedsInteraction] = useState(false);

    const handleBeforeInteractive = useCallback(() => {
      setNeedsInteraction(true);
    }, []);

    const handleSuccess = useCallback(
      (token: string) => {
        onSuccess(token);
      },
      [onSuccess],
    );

    const handleExpire = useCallback(() => {
      onExpire?.();
    }, [onExpire]);

    const handleError = useCallback(
      (error?: unknown) => {
        onError?.(error);
      },
      [onError],
    );

    if (!siteKey) {
      return null;
    }

    const isAlways = appearance === "always";
    const isVisible = isAlways || needsInteraction;

    return (
      <div
        className={cn(
          "flex w-full items-center justify-center transition-all duration-200 overflow-hidden",
          isVisible
            ? "min-h-[65px] my-2 opacity-100"
            : "h-0 min-h-0 my-0 py-0 opacity-0 pointer-events-none",
          className,
        )}
      >
        <Turnstile
          ref={ref}
          siteKey={siteKey}
          options={{
            theme: mode === "dark" ? "dark" : "light",
            size,
            action,
            appearance,
          }}
          onSuccess={handleSuccess}
          onExpire={handleExpire}
          onError={handleError}
          onBeforeInteractive={handleBeforeInteractive}
        />
      </div>
    );
  },
);

TurnstileWidget.displayName = "TurnstileWidget";

