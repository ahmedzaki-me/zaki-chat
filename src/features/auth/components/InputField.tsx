import * as React from "react";
import { Input } from "@/shared/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/shared/components/ui/field";

export interface InputFieldProps extends React.ComponentProps<typeof Input> {
  label?: React.ReactNode;
  error?: { message?: string } | string;
  description?: React.ReactNode;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField({ label, error, description, id, ...props }, ref) {
    const inputId =
      id ||
      (typeof label === "string"
        ? label.toLowerCase().replace(/\s+/g, "-")
        : undefined);
    const errorMessage = typeof error === "string" ? { message: error } : error;
    const isInvalid = Boolean(error);

    return (
      <Field data-invalid={isInvalid}>
        {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
        <Input {...props} ref={ref} id={inputId} aria-invalid={isInvalid} />
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={[errorMessage]} />}
      </Field>
    );
  },
);
