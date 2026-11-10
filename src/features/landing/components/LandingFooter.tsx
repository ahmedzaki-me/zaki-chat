import { LANDING_COPY } from "@/features/landing/constants/landing.constants";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-8 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <img
            src="/Full_logo.png"
            alt="Zaki Chat Logo"
            className="h-5 w-5 object-contain"
          />
          <p>{LANDING_COPY.footer.copyright}</p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="underline-offset-4 hover:underline hover:text-foreground"
          >
            Terms of Service
          </a>
          <span className="text-border">·</span>
          <a
            href="#"
            className="underline-offset-4 hover:underline hover:text-foreground"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
