import { useState } from "react";
import { LANDING_COPY } from "@/features/landing/constants/landing.constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

type LegalModal = "terms" | "privacy" | null;

export function LandingFooter() {
  const [modal, setModal] = useState<LegalModal>(null);

  return (
    <>
      <footer className="border-t border-border/40 bg-muted/30 py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img
              src="/Small_logo.png"
              alt="Zaki Chat Logo"
              className="h-5 w-5 object-contain"
            />
            <p>{LANDING_COPY.footer.copyright}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setModal("terms")}
              className="cursor-pointer underline-offset-4 hover:text-foreground hover:underline"
            >
              Terms of Service
            </button>
            <span className="text-border">·</span>
            <button
              type="button"
              onClick={() => setModal("privacy")}
              className="cursor-pointer underline-offset-4 hover:text-foreground hover:underline"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modal === "terms" ? "Terms of Service" : "Privacy Policy"}
            </DialogTitle>
            <DialogDescription>
              {modal === "terms"
                ? "Guidelines for using Zaki Chat."
                : "How Zaki Chat handles your messages and data."}
            </DialogDescription>
          </DialogHeader>
          {modal === "terms" ? (
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <p>
                Zaki Chat is a direct 1-on-1 messaging platform for contacting Ahmed Zaki.
              </p>
              <p>
                Please use the platform respectfully and avoid automated spam, abuse, or sharing unlawful content. Accounts or messages that violate these rules may be removed.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <p>
                You can chat as a guest with just a display name or register with a username and password — no email or phone number is required.
              </p>
              <p>
                Your messages, media attachments, and optional push notification subscriptions are used solely to deliver your conversations. Cached messages and media may also be stored locally in your browser for offline access and can be cleared anytime in Settings.
              </p>
              <p>
                Authentication forms are protected by Cloudflare Turnstile to prevent automated abuse.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
