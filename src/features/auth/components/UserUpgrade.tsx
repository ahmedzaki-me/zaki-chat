import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleFormProblemErrors } from "@/shared/lib/problemDetails";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { FieldGroup } from "@/shared/components/ui/field";
import { cn } from "@/shared/lib/utils";
import { upgrade } from "@/features/auth/api/auth.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { TurnstileWidget } from "@/features/auth/components/TurnstileWidget";
import { useTurnstile } from "@/features/auth/hooks/useTurnstile";
import { InputField } from "@/features/auth/components/InputField";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { FormServerError } from "@/features/auth/components/FormServerError";
import {
  upgradeSchema,
  type UpgradeFormValues,
} from "@/features/auth/schemas/auth.schemas";

export function UserUpgrade({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { accessToken, setAuth } = useAuth();
  const {
    token,
    setToken,
    ref: turnstileRef,
    reset: resetTurnstile,
    isReady,
  } = useTurnstile();

  const form = useForm<UpgradeFormValues>({
    resolver: zodResolver(upgradeSchema),
    mode: "onTouched",
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async ({ username, password }) => {
    try {
      const data = await upgrade(
        username.trim().toLowerCase(),
        password,
        token,
      );
      if (accessToken) setAuth(accessToken, data.user);
      toast.success("Account upgraded successfully.");
      setOpen(false);
      form.reset();
      resetTurnstile();
    } catch (error) {
      resetTurnstile();
      handleFormProblemErrors(error, form.setError, {
        conflictField: "username",
        defaultMessage: "Could not upgrade the account.",
      });
    }
  });

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
        <Button className={cn("bg-chart-1 text-white/90", className)}>
          Sign Up
          <UserPlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Upgrade your account</DialogTitle>
            <DialogDescription>
              <span className="my-1 block rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-center text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                Choose a username and keep your password safe, as there is no
                way to recover the account.
              </span>
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <InputField
              label="Username"
              id="upgrade-username"
              autoComplete="username"
              placeholder="e.g. ahmed_zaki"
              description="Letters, numbers, and underscores only (2–20 chars)."
              {...form.register("username")}
              error={form.formState.errors.username}
            />

            <PasswordField
              label="Password"
              id="upgrade-password"
              autoComplete="new-password"
              {...form.register("password")}
              error={form.formState.errors.password}
            />

            <PasswordField
              label="Confirm Password"
              id="upgrade-confirm"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
              error={form.formState.errors.confirmPassword}
            />
          </FieldGroup>

          <FormServerError
            message={form.formState.errors.root?.serverError?.message}
            className="mb-4"
          />

          <TurnstileWidget
            ref={turnstileRef}
            action="upgrade"
            onSuccess={setToken}
            onExpire={resetTurnstile}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !isReady}
            >
              {form.formState.isSubmitting ? "Saving..." : "Sign Up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
