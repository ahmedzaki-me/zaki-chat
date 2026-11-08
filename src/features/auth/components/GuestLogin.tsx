import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { FieldGroup } from "@/shared/components/ui/field";

import { signInGuest } from "@/features/auth/api/auth.service";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

export function GuestLogin({ isSubmitting }: { isSubmitting?: boolean }) {
  const [open, setOpen] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { setAuth } = useAuth();
  const {
    token,
    setToken,
    ref: turnstileRef,
    reset: resetTurnstile,
    isReady,
  } = useTurnstile();

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: GuestFormValues) => {
    setIsGuestLoading(true);
    try {
      const result = await signInGuest(values.name, token);
      if (result.user) {
        setAuth(result.accessToken, result.user);
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          resetTurnstile();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isSubmitting}
        >
          Continue as a guest
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            form.handleSubmit(onSubmit)(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>Type Your Name</DialogTitle>
            <DialogDescription>
              Type your name to continue as a guest
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <InputField
              label="Your Name"
              placeholder="Your name"
              autoComplete="name"
              {...form.register("name")}
              error={form.formState.errors.name}
            />
          </FieldGroup>

          <FormServerError
            message={form.formState.errors.root?.serverError?.message}
            className="mb-4"
          />

          <TurnstileWidget
            ref={turnstileRef}
            action="guest"
            onSuccess={setToken}
            onExpire={resetTurnstile}
          />

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="submit"
              disabled={isGuestLoading || !isReady}
              className="text-white/90"
            >
              {isGuestLoading ? "Logging in..." : "Continue as a guest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
