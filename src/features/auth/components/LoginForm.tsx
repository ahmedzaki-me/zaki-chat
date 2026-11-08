import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
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
  const { token, setToken, ref: turnstileRef, reset: resetTurnstile, isReady } = useTurnstile();

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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-6 md:p-8"
            noValidate
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
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
                    className="text-sm underline-offset-2 hover:underline"
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

              <TurnstileWidget
                ref={turnstileRef}
                action="login"
                onSuccess={setToken}
                onExpire={resetTurnstile}
              />

              <Field>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || !isReady}
                  className="text-white/90"
                >
                  {form.formState.isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </Field>

              <FieldSeparator>Or</FieldSeparator>

              <Field>
                <GuestLogin
                  isSubmitting={form.formState.isSubmitting}
                />
              </Field>

              <FieldDescription className="text-center">
                Don&apos;t have an account?
                <Link to="/auth/signup">Sign up</Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/logo.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
