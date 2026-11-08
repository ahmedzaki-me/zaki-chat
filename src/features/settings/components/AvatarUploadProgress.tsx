import { Loader2 } from "lucide-react";

export type AvatarUploadStage =
  | "processing"
  | "uploading"
  | "saving"
  | "success"
  | "error";

const labels: Record<AvatarUploadStage, string> = {
  processing: "Processing photo…",
  uploading: "Uploading photo…",
  saving: "Saving profile photo…",
  success: "Profile photo updated.",
  error: "Upload failed.",
};

export function AvatarUploadProgress({
  stage,
  percent,
}: {
  stage: AvatarUploadStage;
  percent: number;
}) {
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-2 text-sm">
        {(stage === "processing" || stage === "saving") && (
          <Loader2 className="size-4 animate-spin" />
        )}
        <span>{labels[stage]}</span>
      </div>
      {stage === "uploading" && (
        <div
          role="progressbar"
          aria-label="Photo upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
