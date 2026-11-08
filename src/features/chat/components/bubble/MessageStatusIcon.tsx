import { Loader2, AlertCircle, Check, CheckCheck } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type MessageDeliveryStatus =
  | "sending"
  | "error"
  | "sent"
  | "delivered"
  | "read";

export function MessageStatusIcon({
  status,
}: {
  status: MessageDeliveryStatus;
}) {
  if (status === "sending")
    return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  if (status === "error")
    return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "sent") return <Check className="h-4 w-4 text-white/80" />;
  return (
    <CheckCheck
      className={cn(
        "h-4 w-4",
        status === "read" ? "text-sky-300" : "text-white/70",
      )}
    />
  );
}
