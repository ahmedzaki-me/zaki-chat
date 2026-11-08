import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/shared/components/ui/field";
import { cn } from "@/shared/lib/utils";

export interface PasswordFieldProps extends Omit<
  React.ComponentProps<typeof Input>,
  "type"
> {
  label?: React.ReactNode;
  error?: { message?: string } | string;
  extraHeader?: React.ReactNode;
  description?: React.ReactNode;
}

export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(function PasswordField(
  {
    label = "Password",
    error,
    extraHeader,
    description,
    className,
    id,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId =
    id ||
    (typeof label === "string"
      ? label.toLowerCase().replace(/\s+/g, "-")
      : undefined);
  const errorMessage = typeof error === "string" ? { message: error } : error;
  const isInvalid = Boolean(error);

  return (
    <Field data-invalid={isInvalid}>
      {(label || extraHeader) && (
        <div className="flex items-center">
          {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
          {extraHeader && <div className="ml-auto">{extraHeader}</div>}
        </div>
      )}
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          id={inputId}
          type={showPassword ? "text" : "password"}
          aria-invalid={isInvalid}
          className={cn("pr-10", className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </Button>
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={[errorMessage]} />}
    </Field>
  );
});
