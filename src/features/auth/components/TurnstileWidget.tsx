import { forwardRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTheme } from "@/shared/hooks/useTheme";

export interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: unknown) => void;
  hasError?: boolean;
  onRetry?: () => void;
  action?: string;
  className?: string;
  size?: "normal" | "flexible" | "compact";
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
      hasError = false,
      onRetry,
      action,
      className = "",
      size = "normal",
    },
    ref,
  ) => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
    const { mode } = useTheme();

    if (!siteKey) {
      return null;
    }

    return (
      <div
        className={`my-2 flex min-h-[65px] w-full flex-col items-center justify-center gap-1.5 ${className}`}
      >
        <Turnstile
          ref={ref}
          siteKey={siteKey}
          options={{
            theme: mode === "dark" ? "dark" : "light",
            size,
            action,
          }}
          onSuccess={onSuccess}
          onExpire={onExpire}
          onError={onError}
        />
        {hasError && (
          <p role="alert" className="text-center text-xs text-destructive">
            Security check failed to load.{" "}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="cursor-pointer font-medium underline underline-offset-2 hover:text-destructive/80"
              >
                Retry
              </button>
            )}
          </p>
        )}
      </div>
    );
  },
);

TurnstileWidget.displayName = "TurnstileWidget";


