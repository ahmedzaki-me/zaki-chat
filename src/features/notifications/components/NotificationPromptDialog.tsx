import { useEffect, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { usePushSubscription } from "@/features/notifications/hooks/usePushSubscription";

const WEEK = 7 * 24 * 60 * 60 * 1000;
function key(userId: string) {
  return `push-prompt-dismissed:${userId}`;
}
function wasDismissed(userId: string) {
  try {
    const timestamp = Number(localStorage.getItem(key(userId)));
    return Number.isFinite(timestamp) && Date.now() - timestamp < WEEK;
  } catch {
    return false;
  }
}
function dismiss(userId: string) {
  try {
    localStorage.setItem(key(userId), String(Date.now()));
  } catch {
    /* Storage may be unavailable. */
  }
}

export function NotificationPromptDialog({
  userId,
  ready,
}: {
  userId: string;
  ready: boolean;
}) {
  const { state, busy, enable } = usePushSubscription();
  const [open, setOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (
      !ready ||
      state !== "off" ||
      !("Notification" in window) ||
      Notification.permission !== "default" ||
      wasDismissed(userId)
    )
      return;
    try {
      if (sessionStorage.getItem(`push-prompt-shown:${userId}`)) return;
    } catch {
      /* Continue without session storage. */
    }
    let timer = 0;
    const showWhenClear = () => {
      if (
        document.querySelector(
          '[role="dialog"], [data-slot="sheet-content"], main.fixed.inset-0',
        )
      ) {
        timer = window.setTimeout(showWhenClear, 500);
        return;
      }
      try {
        sessionStorage.setItem(`push-prompt-shown:${userId}`, "1");
      } catch {
        /* Session tracking is best effort. */
      }
      setOpen(true);
    };
    timer = window.setTimeout(showWhenClear, 1800);
    return () => window.clearTimeout(timer);
  }, [ready, state, userId]);

  const close = (next: boolean) => {
    if (next) {
      setOpen(true);
      return;
    }
    setOpen(false);
    if (!attempted) dismiss(userId);
  };
  const activate = async () => {
    setAttempted(true);
    const result = await enable();
    setOpen(false);
    if (result === "enabled") toast.success("Notifications enabled");
    else if (result === "denied") {
      dismiss(userId);
      toast.info(
        "Notifications are blocked. You can enable them later from your browser settings.",
      );
    } else if (result === "error")
      toast.error("Couldn't enable notifications. Please try again.");
    else toast.info("Notifications are currently unavailable.");
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        dir="ltr"
        showCloseButton={false}
        className="w-[calc(100%-1.5rem)] max-w-sm gap-5 rounded-2xl p-5 text-left sm:p-6"
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss notification prompt"
            className="absolute right-2 top-2"
          >
            <X aria-hidden="true" />
          </Button>
        </DialogClose>
        <DialogHeader className="items-center text-center">
          <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Bell className="size-6" />
          </div>
          <DialogTitle className="text-lg font-semibold">
            Turn on notifications
          </DialogTitle>
          <DialogDescription className="text-sm">
            Subscribe to notifications so you get notified right away when Ahmed
            Zaki replies to you.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-col">
          <Button
            type="button"
            aria-label="Enable notifications"
            disabled={busy}
            onClick={() => void activate()}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Enable
            notifications
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label="Dismiss notification prompt"
            disabled={busy}
            onClick={() => close(false)}
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
