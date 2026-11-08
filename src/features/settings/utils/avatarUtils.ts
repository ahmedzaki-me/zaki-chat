import { processImage } from "@/features/chat/utils/processImage";
import { getProblemMessage } from "@/shared/lib/problemDetails";

export const AVATAR_IMAGE_OPTIONS = {
  maxDimension: 512,
  maxSizeMB: 0.2,
  cropSquare: true,
} as const;

export async function processAvatarImage(file: File): Promise<Blob> {
  return processImage(file, AVATAR_IMAGE_OPTIONS);
}

export function avatarError(error: unknown): string {
  const problem = getProblemMessage(error);
  const code = problem.match(
    /UNSUPPORTED_FILE_TYPE|FILE_TOO_LARGE|INVALID_IMAGE|INVALID_UPLOAD|UPLOAD_NOT_OWNED|UPLOAD_NOT_FOUND/,
  )?.[0];
  const messages: Record<string, string> = {
    UNSUPPORTED_FILE_TYPE: "Choose a supported image file.",
    FILE_TOO_LARGE: "This image is too large.",
    INVALID_IMAGE: "This image could not be validated. Try another image.",
    INVALID_UPLOAD: "The image upload is invalid. Please choose it again.",
    UPLOAD_NOT_OWNED:
      "This upload is no longer available for your account. Please try again.",
    UPLOAD_NOT_FOUND:
      "The uploaded image could not be found. Please try again.",
  };
  if (code) return messages[code];
  return error instanceof Error ? error.message : problem;
}
