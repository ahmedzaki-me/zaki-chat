import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/shared/components/ui/field";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signup } from "@/features/auth/api/auth.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { handleFormProblemErrors } from "@/shared/lib/problemDetails";
import { TurnstileWidget } from "@/features/auth/components/TurnstileWidget";
import { useTurnstile } from "@/features/auth/hooks/useTurnstile";
import { InputField } from "@/features/auth/components/InputField";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { FormServerError } from "@/features/auth/components/FormServerError";
import {
  signupSchema,
  type SignupFormValues,
} from "@/features/auth/schemas/auth.schemas";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const result = await signup(
        data.name,
        data.username,
        data.password,
        token,
      );

      if (result.user) {
        setAuth(result.accessToken, result.user);
      }
    } catch (error) {
      resetTurnstile();
      handleFormProblemErrors(error, form.setError, {
        conflictField: "username",
        defaultMessage: "Signup failed",
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
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Enter your details below to create your account
                </p>
              </div>

              <InputField
                label="Name"
                placeholder="Your name"
                autoComplete="name"
                {...form.register("name")}
                error={form.formState.errors.name}
              />

              <InputField
                label="Username"
                placeholder="e.g. ahmed_zaki"
                autoComplete="username"
                {...form.register("username")}
                error={form.formState.errors.username}
              />

              <div className="flex flex-col gap-4">
                <PasswordField
                  label="Password"
                  autoComplete="new-password"
                  {...form.register("password")}
                  error={form.formState.errors.password}
                />

                <PasswordField
                  label="Confirm Password"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                  error={form.formState.errors.confirmPassword}
                />
              </div>

              <FormServerError
                message={form.formState.errors.root?.serverError?.message}
              />

              <TurnstileWidget
                ref={turnstileRef}
                action="signup"
                onSuccess={setToken}
                onExpire={resetTurnstile}
                onError={handleTurnstileError}
                hasError={turnstileError}
                onRetry={resetTurnstile}
              />

              <Field>
                <Button
                  type="submit"
                  className="w-full text-white/90"
                  disabled={form.formState.isSubmitting || !isReady}
                >
                  {form.formState.isSubmitting
                    ? "Creating..."
                    : "Create Account"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Already have an account?{" "}
                <Link to="/auth/login" className="font-medium underline underline-offset-4 hover:text-foreground">Sign in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
