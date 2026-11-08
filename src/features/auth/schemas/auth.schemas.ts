import { z } from "zod";

/**
 * Username validation strictly matching backend OpenAPI schema:
 * - minLength: 2, maxLength: 20
 * - pattern: ^[a-z0-9_]+$
 * - Trimmed and lowercased before validation
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Username must be at least 2 characters.")
  .max(20, "Username must be at most 20 characters.")
  .regex(
    /^[a-z0-9_]+$/,
    "Username can only contain lowercase letters, numbers, and underscores.",
  );

/**
 * Password validation strictly matching backend OpenAPI schema:
 * - minLength: 6
 * - maxLength: 128
 */
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.")
  .max(128, "Password must be at most 128 characters.");

/**
 * Display name validation matching backend OpenAPI schema:
 * - minLength: 1 (or 2 for good UX)
 * - maxLength: 20
 */
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(20, "Name must be at most 20 characters.");

// --- Form Schemas ---

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: nameSchema,
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const guestSchema = z.object({
  name: nameSchema,
});

export type GuestFormValues = z.infer<typeof guestSchema>;

export const upgradeSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type UpgradeFormValues = z.infer<typeof upgradeSchema>;
