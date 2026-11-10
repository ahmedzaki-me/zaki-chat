import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { GuestLoginForm } from "@/features/auth/components/GuestLoginForm";

export function GuestLogin({ isSubmitting }: { isSubmitting?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isSubmitting}
        >
          Continue as a guest
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Type Your Name</DialogTitle>
          <DialogDescription>
            Type your name to continue as a guest
          </DialogDescription>
        </DialogHeader>
        {open && (
          <GuestLoginForm
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
            autoFocus
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

