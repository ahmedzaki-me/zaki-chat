import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/shared/components/ui/field";
import { Spinner } from "@/shared/components/ui/spinner";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { GuestLogin } from "@/features/auth/components/GuestLogin";
import { login } from "@/features/auth/api/auth.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { handleFormProblemErrors } from "@/shared/lib/problemDetails";
import {
  useTurnstileToken,
  TurnstileSlot,
} from "@/features/auth/context/TurnstileProvider";
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
  const { token, consume, reset, waitForToken, isEnabled } = useTurnstileToken();
  const [isVerifying, setIsVerifying] = useState(false);

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
    if (isVerifying) return;

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

    try {
      const response = await login(data.username, data.password, authToken);
      if (response.user) {
        setAuth(response.accessToken, response.user);
      }
    } catch (error) {
      reset();
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
                  <a
                    href="/error"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
                  >
                    Forgot your password?
                  </a>
                }
                {...form.register("password")}
                error={form.formState.errors.password}
              />

              <FormServerError
                message={form.formState.errors.root?.serverError?.message}
              />

              <TurnstileSlot />

              <Field>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || isVerifying}
                  className="w-full text-white/90"
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="size-3.5" />
                      <span>Verifying you&apos;re human...</span>
                    </span>
                  ) : form.formState.isSubmitting ? (
                    "Logging in..."
                  ) : (
                    "Login"
                  )}
                </Button>
              </Field>

              <FieldSeparator>Or</FieldSeparator>

              <Field>
                <GuestLogin
                  isSubmitting={form.formState.isSubmitting || isVerifying}
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
    </div>
  );
}
