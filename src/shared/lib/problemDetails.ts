import axios from "axios";
import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import type { ProblemDetails } from "@/shared/types";

export type { ProblemDetails };

export function extractProblemDetails(error: unknown): ProblemDetails | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      return data as ProblemDetails;
    }
  }
  return null;
}

export function getProblemMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (!error.response) {
    return error.message === "Network Error" || (typeof navigator !== "undefined" && !navigator.onLine)
      ? "Network connection lost. Please check your internet."
      : error.message || fallback;
  }

  const problem = error.response.data as ProblemDetails | undefined;
  if (!problem || typeof problem !== "object") {
    return error.response.statusText || fallback;
  }

  // 1. Prefer clean, human-readable 'detail' from RFC 7807
  if (problem.detail) {
    return problem.detail;
  }

  // 2. If no detail, use RFC 7807 'title'
  if (problem.title) {
    return problem.title;
  }

  // 3. If there are field errors, pick the first readable message
  const firstValidationError = Object.values(problem.errors ?? {})[0]?.[0]?.message;
  if (firstValidationError) {
    return firstValidationError;
  }

  return fallback;
}

export function handleFormProblemErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  options?: {
    conflictField?: Path<T>;
    defaultMessage?: string;
  },
): { hasFieldErrors: boolean; generalMessage?: string } {
  const problem = extractProblemDetails(error);
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  let hasFieldErrors = false;

  // 1. Map 422 validation errors to specific form fields ONLY
  if (status === 422 && problem?.errors) {
    for (const [field, fieldErrors] of Object.entries(problem.errors)) {
      const firstMsg = fieldErrors[0]?.message;
      if (firstMsg) {
        setError(field as Path<T>, {
          type: "server",
          message: firstMsg,
        });
        hasFieldErrors = true;
      }
    }
  }

  // 2. Map 409 Conflict to the specified conflict field ONLY (e.g. username taken)
  if (status === 409 && options?.conflictField) {
    const conflictMessage = problem?.detail || "This value is already in use.";
    setError(options.conflictField, {
      type: "server",
      message: conflictMessage,
    });
    hasFieldErrors = true;
  }

  // 3. General form error:
  // ONLY set root.serverError if NO specific field error was mapped!
  if (!hasFieldErrors) {
    const generalMessage = getProblemMessage(error, options?.defaultMessage);
    setError("root.serverError" as Path<T>, {
      type: "server",
      message: generalMessage,
    });
    return { hasFieldErrors: false, generalMessage };
  }

  return { hasFieldErrors: true };
}
