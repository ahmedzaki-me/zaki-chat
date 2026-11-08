import type { Message } from "@/features/chat/types/chat.types";
import { formatDateTime } from "@/features/chat/utils/chat.utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface EditHistoryDialogProps {
  message: Message;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHistoryDialog({
  message,
  open,
  onOpenChange,
}: EditHistoryDialogProps) {
  const versions = [...(message.editHistory ?? [])].reverse();
  const isCaption = message.type === "image" || message.type === "video";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[85dvh] w-[calc(100%-1rem)] max-w-md grid-rows-[auto_minmax(0,1fr)] gap-3 p-4">
        <DialogHeader className="pe-8">
          <DialogTitle>Edit history</DialogTitle>
          {isCaption && (
            <p className="text-xs text-muted-foreground">Caption versions</p>
          )}
        </DialogHeader>
        <ScrollArea className="min-h-0 max-h-[70dvh]">
          <div className="space-y-3 pe-3">
            <Version
              text={message.text ?? ""}
              label="Current"
              time={message.editedAt}
            />
            {versions.map((version, index) => (
              <Version
                key={`${version.editedAt}-${index}`}
                text={version.text}
                label="Previous version"
                time={version.editedAt}
                timeLabel="Replaced"
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Version({
  text,
  label,
  time,
  timeLabel,
}: {
  text: string;
  label: string;
  time: string | null;
  timeLabel?: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-border/70 bg-muted/30 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-medium">{label}</span>
        {time && (
          <time className="text-[11px] text-muted-foreground">
            {timeLabel ? `${timeLabel} · ` : ""}
            {formatDateTime(time)}
          </time>
        )}
      </div>
      <p
        dir="auto"
        className="whitespace-pre-wrap [unicode-bidi:plaintext] wrap-anywhere break-words text-sm"
      >
        {text}
      </p>
    </section>
  );
}
