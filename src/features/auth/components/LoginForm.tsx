import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/shared/components/ui/field";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { GuestLogin } from "@/features/auth/components/GuestLogin";
import { login } from "@/features/auth/api/auth.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { handleFormProblemErrors } from "@/shared/lib/problemDetails";
import { TurnstileWidget } from "@/features/auth/components/TurnstileWidget";
import { useTurnstile } from "@/features/auth/hooks/useTurnstile";
import { InputField } from "@/features/auth/components/InputField";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { FormServerError } from "@/features/auth/components/FormServerError";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth.schemas";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [forgotOpen, setForgotOpen] = useState(false);
  const {
    token,
    hasError: turnstileError,
    setToken,
    ref: turnstileRef,
    reset: resetTurnstile,
    handleError: handleTurnstileError,
    isReady,
  } = useTurnstile();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const { setAuth } = useAuth();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await login(data.username, data.password, token);
      if (response.user) {
        setAuth(response.accessToken, response.user);
      }
    } catch (error) {
      resetTurnstile();
      handleFormProblemErrors(error, form.setError, {
        defaultMessage: "Invalid username or password",
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md", className)} {...props}>
      <Card className="overflow-hidden border-border bg-card p-0 shadow-lg shadow-primary/5">
        <CardContent className="p-6 sm:p-8">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Login to your Zaki account
                </p>
              </div>

              <InputField
                label="Username"
                autoComplete="username"
                {...form.register("username")}
                error={form.formState.errors.username}
              />

              <PasswordField
                label="Password"
                autoComplete="current-password"
                extraHeader={
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot your password?
                  </button>
                }
                {...form.register("password")}
                error={form.formState.errors.password}
              />

              <FormServerError
                message={form.formState.errors.root?.serverError?.message}
              />

              <TurnstileWidget
                ref={turnstileRef}
                action="login"
                onSuccess={setToken}
                onExpire={resetTurnstile}
                onError={handleTurnstileError}
                hasError={turnstileError}
                onRetry={resetTurnstile}
              />

              <Field>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || !isReady}
                  className="w-full text-white/90"
                >
                  {form.formState.isSubmitting ? (
                    "Logging in..."
                  ) : (
                    "Login"
                  )}
                </Button>
              </Field>

              <FieldSeparator>Or</FieldSeparator>

              <Field>
                <GuestLogin
                  isSubmitting={form.formState.isSubmitting}
                />
              </Field>

              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link to="/auth/signup" className="font-medium underline underline-offset-4 hover:text-foreground">Sign up</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Password recovery</DialogTitle>
            <DialogDescription>
              Zaki Chat does not collect email addresses or phone numbers, so passwords cannot be reset automatically.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            If you lost access to your account, you can continue as a guest and message Ahmed directly to start a new thread.
          </p>
          <DialogFooter>
            <Button type="button" onClick={() => setForgotOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
