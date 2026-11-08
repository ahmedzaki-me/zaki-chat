import { forwardRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTheme } from "@/shared/hooks/useTheme";

export interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: unknown) => void;
  action?: string;
  className?: string;
}

export const TurnstileWidget = forwardRef<
  TurnstileInstance | undefined,
  TurnstileWidgetProps
>(({ onSuccess, onExpire, onError, action, className = "" }, ref) => {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const { mode } = useTheme();

  if (!siteKey) {
    return null;
  }

  return (
    <div
      className={`my-2 flex min-h-[65px] w-full items-center justify-center ${className}`}
    >
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        options={{
          theme: mode === "dark" ? "dark" : "light",
          size: "normal",
          action,
        }}
        onSuccess={onSuccess}
        onExpire={onExpire}
        onError={onError}
      />
    </div>
  );
});

TurnstileWidget.displayName = "TurnstileWidget";
