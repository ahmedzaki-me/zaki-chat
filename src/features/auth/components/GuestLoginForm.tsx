import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { FieldGroup } from "@/shared/components/ui/field";
import { signInGuest } from "@/features/auth/api/auth.service";
import { handleFormProblemErrors } from "@/shared/lib/problemDetails";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { TurnstileWidget } from "@/features/auth/components/TurnstileWidget";
import { useTurnstile } from "@/features/auth/hooks/useTurnstile";
import { InputField } from "@/features/auth/components/InputField";
import { FormServerError } from "@/features/auth/components/FormServerError";
import {
  guestSchema,
  type GuestFormValues,
} from "@/features/auth/schemas/auth.schemas";
import { cn } from "@/shared/lib/utils";

export interface GuestLoginFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  className?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  label?: React.ReactNode;
  placeholder?: string;
  inline?: boolean;
}

export function GuestLoginForm({
  onCancel,
  onSuccess,
  className,
  submitLabel = "Continue as a guest",
  autoFocus,
  label,
  placeholder,
  inline = false,
}: GuestLoginFormProps) {
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const { setAuth } = useAuth();
  const {
    token,
    hasError: turnstileError,
    setToken,
    ref: turnstileRef,
    reset: resetTurnstile,
    handleError: handleTurnstileError,
    isReady,
  } = useTurnstile();

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: GuestFormValues) => {
    if (isGuestLoading) return;

    setIsGuestLoading(true);
    try {
      const result = await signInGuest(values.name, token);
      if (result.user) {
        setAuth(result.accessToken, result.user);
        onSuccess?.();
      }
    } catch (error) {
      resetTurnstile();
      handleFormProblemErrors(error, form.setError, {
        defaultMessage: "Failed to login as guest",
      });
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <form
      id={inline ? "guest-form" : undefined}
      onSubmit={(e) => {
        e.stopPropagation();
        form.handleSubmit(onSubmit)(e);
      }}
      className={cn("flex flex-col gap-3", className)}
      noValidate
    >
      {inline ? (
        <div className="flex flex-col gap-2">
          <TurnstileWidget
            ref={turnstileRef}
            action="guest"
            onSuccess={setToken}
            onExpire={resetTurnstile}
            onError={handleTurnstileError}
            hasError={turnstileError}
            onRetry={resetTurnstile}
          />

          {label && (
            <label
              htmlFor="your-name"
              className="text-sm font-medium text-foreground"
            >
              {label}
            </label>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <InputField
                id="your-name"
                placeholder={placeholder ?? "Your name"}
                autoComplete="name"
                autoFocus={autoFocus}
                className="h-10 text-base sm:text-sm"
                {...form.register("name")}
                error={form.formState.errors.name}
              />
            </div>
            <Button
              type="submit"
              disabled={isGuestLoading || !isReady}
              className="h-10 w-full shrink-0 px-4 text-white/90 sm:w-auto"
            >
              {isGuestLoading ? "Connecting..." : submitLabel}
            </Button>
          </div>
        </div>
      ) : (
        <FieldGroup>
          <InputField
            label={label ?? "Your Name"}
            placeholder={placeholder ?? "Your name"}
            autoComplete="name"
            autoFocus={autoFocus}
            {...form.register("name")}
            error={form.formState.errors.name}
          />
        </FieldGroup>
      )}

      <FormServerError
        message={form.formState.errors.root?.serverError?.message}
      />

      {!inline && (
        <>
          <TurnstileWidget
            ref={turnstileRef}
            action="guest"
            onSuccess={setToken}
            onExpire={resetTurnstile}
            onError={handleTurnstileError}
            hasError={turnstileError}
            onRetry={resetTurnstile}
          />

          {onCancel ? (
            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isGuestLoading || !isReady}
                className="text-white/90"
              >
                {isGuestLoading ? "Logging in..." : submitLabel}
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              disabled={isGuestLoading || !isReady}
              className="w-full text-white/90"
            >
              {isGuestLoading ? "Logging in..." : submitLabel}
            </Button>
          )}
        </>
      )}
    </form>
  );
}
