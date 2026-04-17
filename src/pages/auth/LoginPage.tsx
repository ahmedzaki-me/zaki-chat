import { LoginForm } from "@/components/login-form";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState, useRef } from "react";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

export default function LoginPage() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleResetCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <p className="mb-4 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-center text-sm text-purple-800 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
          You can sign in as a guest.{" "}
          <span className="font-bold">Sync your chat</span> across all your
          devices by upgrading to a full account with your email later.
        </p>
        <LoginForm
          captcha={captchaToken}
          onCaptchaExpired={handleResetCaptcha}
        />
        <Turnstile
          className="absolute bottom-0 right-1/2 translate-x-1/2 "
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setCaptchaToken(token)}
          ref={turnstileRef}
          onExpire={handleResetCaptcha}
        />
      </div>
    </div>
  );
}
