import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { signInAnonymously } from "@/lib/auth";
import { useState } from "react";

import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const guestSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(20, "Name is too long"),
});
type GuestFormValues = z.infer<typeof guestSchema>;

export function GuestLogin({
  captcha,
  isSubmitting,
}: {
  captcha: string | null | undefined;
  isSubmitting: boolean;
}) {
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const form = useForm<z.infer<typeof guestSchema>>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: "guest",
    },
  });

  const onSubmit = async (values: GuestFormValues) => {
    setIsGuestLoading(true);
    try {
      const result = await signInAnonymously(values.name, captcha);

      if (result && "message" in result) {
        form.setError("root.serverError", {
          type: "manual",
          message: result.message,
        });
        console.error("Login failed:", result.message);
      }
    } catch (error) {
      console.error("Failed to login as guest: ", error);
    } finally {
      setIsGuestLoading(false);
    }
  };
  console.log(form.formState.errors);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isSubmitting || !captcha}
        >
          Continue as a guest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Type Your Name</DialogTitle>
            <DialogDescription>
              Type your name for Continue as a guest
            </DialogDescription>
            {form.formState.errors.root?.serverError && (
              <div className="text-destructive text-sm font-medium">
                {form.formState.errors.root.serverError.message}
              </div>
            )}
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-name">
                    Your Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="your name"
                    autoComplete="on"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="submit"
              disabled={isGuestLoading || !captcha}
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
