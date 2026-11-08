import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function AvatarDropzone({
  disabled,
  onFile,
  onInvalid,
}: {
  disabled: boolean;
  onFile: (file: File) => void;
  onInvalid: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const pick = () => inputRef.current?.click();
  const accept = (file?: File) => {
    if (file?.type.startsWith("image/")) onFile(file);
    else if (file) onInvalid("Choose an image file.");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick();
    }
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);
    if (!disabled) accept(event.dataTransfer.files[0]);
  };
  return (
    <div
      role="group"
      tabIndex={disabled ? -1 : 0}
      aria-label="Image drop zone. Press Enter or Space to choose a photo."
      onKeyDown={disabled ? undefined : onKeyDown}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      className={`rounded-xl border border-dashed p-6 text-center transition-colors ${isOver ? "border-primary bg-primary/5" : "border-border"} ${disabled ? "opacity-60" : "cursor-pointer hover:border-primary/60"}`}
    >
      <input
        ref={inputRef}
        aria-label="Choose profile photo"
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <ImagePlus className="mx-auto mb-2 size-6 text-muted-foreground" />
      <p className="text-sm font-medium">Drag a photo here or choose one</p>
      <p className="mt-1 text-xs text-muted-foreground">
        You can also paste an image from your clipboard.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="mt-3"
        onClick={pick}
      >
        Choose photo
      </Button>
    </div>
  );
}
