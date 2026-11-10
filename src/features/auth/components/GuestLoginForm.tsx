import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { FieldGroup } from "@/shared/components/ui/field";
import { Spinner } from "@/shared/components/ui/spinner";
import { signInGuest } from "@/features/auth/api/auth.service";
import { handleFormProblemErrors } from "@/shared/lib/problemDetails";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useTurnstileToken,
  TurnstileSlot,
} from "@/features/auth/context/TurnstileProvider";
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
  const [isVerifying, setIsVerifying] = useState(false);

  const { setAuth } = useAuth();
  const { token, consume, reset, waitForToken, isEnabled } = useTurnstileToken();

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: GuestFormValues) => {
    if (isVerifying || isGuestLoading) return;

    let authToken = token;
    if (isEnabled && !authToken) {
      setIsVerifying(true);
      try {
        authToken = await waitForToken();
      } catch {
        setIsVerifying(false);
        return;
      }
      setIsVerifying(false);
    }

    consume();

    setIsGuestLoading(true);
    try {
      const result = await signInGuest(values.name, authToken);
      if (result.user) {
        setAuth(result.accessToken, result.user);
        onSuccess?.();
      }
    } catch (error) {
      reset();
      handleFormProblemErrors(error, form.setError, {
        defaultMessage: "Failed to login as guest",
      });
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <form
      id="guest-form"
      onSubmit={(e) => {
        e.stopPropagation();
        form.handleSubmit(onSubmit)(e);
      }}
      className={cn("flex flex-col gap-3", className)}
      noValidate
    >
      {inline ? (
        <div className="flex flex-col gap-2">
          {label && (
            <label
              htmlFor="your-name"
              className="text-sm font-medium text-foreground"
            >
              {label}
            </label>
          )}

          <TurnstileSlot />

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <InputField
                id="your-name"
                placeholder={placeholder ?? "Your name"}
                autoComplete="name"
                autoFocus={autoFocus}
                className="h-10 text-base sm:h-7 sm:text-sm"
                {...form.register("name")}
                error={form.formState.errors.name}
              />
            </div>
            <Button
              type="submit"
              disabled={isGuestLoading || isVerifying}
              className="h-10 w-full shrink-0 px-4 text-white/90 sm:h-7 sm:w-auto"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="size-3.5" />
                  <span>Verifying you&apos;re human...</span>
                </span>
              ) : isGuestLoading ? (
                "Connecting..."
              ) : (
                submitLabel
              )}
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
          <TurnstileSlot />

          {onCancel ? (
            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isGuestLoading || isVerifying}
                className="text-white/90"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner className="size-3.5" />
                    <span>Verifying you&apos;re human...</span>
                  </span>
                ) : isGuestLoading ? (
                  "Logging in..."
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              disabled={isGuestLoading || isVerifying}
              className="w-full text-white/90"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="size-3.5" />
                  <span>Verifying you&apos;re human...</span>
                </span>
              ) : isGuestLoading ? (
                "Logging in..."
              ) : (
                submitLabel
              )}
            </Button>
          )}
        </>
      )}
    </form>
  );
}
