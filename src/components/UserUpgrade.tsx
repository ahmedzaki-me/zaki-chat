// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { UserPlus } from "lucide-react";

// import { cn } from "@/lib/utils";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Field,
//   FieldDescription,
//   FieldGroup,
//   FieldLabel,
//   FieldError,
// } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import { Link } from "react-router";

// import { Eye, EyeOff } from "lucide-react";
// import { Controller, useForm } from "react-hook-form";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { useState } from "react";

// import { upgradeAnonymousUser } from "@/lib/auth";

// const signupSchema = z
//   .object({
//     email: z.string().email("Invalid email address"),

//     password: z
//       .string()
//       .min(6, "Password must be at least 6 characters")
//       .max(20, "The password must be at most 20 characters"),
//     confirmPassword: z.string(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ["confirmPassword"],
//   });

// type SignupFormValues = z.infer<typeof signupSchema>;

// export function UserUpgrade() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConPassword, setShowConPassword] = useState(false);

//   const form = useForm<z.infer<typeof signupSchema>>({
//     resolver: zodResolver(signupSchema),
//     mode: "onTouched",
//     defaultValues: {
//       email: "",
//       password: "",
//       confirmPassword: "",
//     },
//   });

//   const onSubmit = async (data: SignupFormValues) => {
//     const result = await upgradeAnonymousUser(data.email, data.password);

//     if (result && "message" in result) {
//       form.setError("root.serverError", {
//         type: "manual",
//         message: result.message,
//       });
//       console.error("signup failed:", result.message);
//     }
//   };

//   return (
//     <Dialog>
//       <form>
//         <DialogTrigger asChild>
//           <Button className="text-white/90">
//             Sign Up
//             <UserPlus />
//           </Button>
//         </DialogTrigger>
//         <DialogContent className="sm:max-w-sm">
//           <DialogHeader>
//             <DialogTitle>Upgrade your Profile</DialogTitle>
//             <DialogDescription>
//               Make changes to your profile here. Click save when you&apos;re
//               done.
//             </DialogDescription>
//           </DialogHeader>
//           <FieldGroup>
//             <Field>
//               <Label htmlFor="name-1">Name</Label>
//               <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
//             </Field>
//             <Field>
//               <Label htmlFor="username-1">Username</Label>
//               <Input id="username-1" name="username" defaultValue="@peduarte" />
//             </Field>
//           </FieldGroup>
//           <DialogFooter>
//             <DialogClose asChild>
//               <Button variant="outline">Cancel</Button>
//             </DialogClose>
//             <Button type="submit" className="text-white/90">
//               Sign Up
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </form>
//     </Dialog>
//   );
// }
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
import { UserPlus, Eye, EyeOff } from "lucide-react";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { upgradeAnonymousUser } from "@/lib/auth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(20, "The password must be at most 20 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function UserUpgrade({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConPassword, setShowConPassword] = useState(false);

  const queryClient = useQueryClient();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignupFormValues) => {
    const result = await upgradeAnonymousUser(data.email, data.password);

    if (result && "message" in result) {
      form.setError("root.serverError", {
        type: "manual",
        message: result.message,
      });
      toast.error("Upgrade failed", { description: result.message });
      return;
    }

    toast.success("Account created!", {
      description: "Your account has been upgraded successfully.",
    });
    setOpen(false);
    form.reset();
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className={cn("bg-chart-1 text-white/90", className)}>
          Sign Up
          <UserPlus />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Upgrade your Profile</DialogTitle>
            <DialogDescription>
              <p className="m-1 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-center text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                You can use a fake email to protect your privacy - but{" "}
                <span className="font-semibold">
                  save your password carefully
                </span>
                , as account recovery is not available.
              </p>
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {form.formState.errors.root?.serverError && (
              <div className="text-destructive text-sm font-medium">
                {form.formState.errors.root.serverError.message}
              </div>
            )}

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="upgrade-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="upgrade-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="Z@ahmedzaki.me"
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="upgrade-password">Password</FieldLabel>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="duration-300 absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                    <Input
                      {...field}
                      id="upgrade-password"
                      aria-invalid={fieldState.invalid}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="upgrade-confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConPassword(!showConPassword)}
                      className="duration-300 absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showConPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                    <Input
                      {...field}
                      id="upgrade-confirm-password"
                      aria-invalid={fieldState.invalid}
                      type={showConPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="text-white/90"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving..." : "Sign Up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
