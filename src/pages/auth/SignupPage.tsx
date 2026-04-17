import { SignupForm } from "@/components/signup-form";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState, useRef } from "react";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

export default function SignupPage() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleResetCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <p className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-center text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          You can use a fake email to protect your privacy - but{" "}
          <span className="font-semibold">save your password carefully</span>,
          as account recovery is not available.
        </p>
        <SignupForm
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
