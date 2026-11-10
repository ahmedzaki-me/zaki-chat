import { Link, useLocation } from "react-router";
import { Button } from "@/shared/components/ui/button";
import ModeSwitch from "@/shared/components/feedback/ModeSwitch";
import { useTheme } from "@/shared/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export function LandingHeader() {
  const location = useLocation();
  const { mode, setMode } = useTheme();
  const isLoginPage = location.pathname.includes("/login");
  const isSignupPage = location.pathname.includes("/signup");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <img
            src="/Small_logo.png"
            alt="Zaki Chat Logo"
            className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="text-sm font-bold tracking-tight text-foreground sm:text-base">
            Zaki Chat
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile icon-only theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            className="relative h-9 w-9 sm:hidden"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Desktop full mode switch */}
          <div className="hidden sm:flex sm:items-center">
            <ModeSwitch />
          </div>

          {isLoginPage ? (
            <Button variant="ghost" size="sm" asChild className="h-9 px-3 text-sm sm:h-9 sm:px-4">
              <Link to="/auth/signup">Sign Up</Link>
            </Button>
          ) : isSignupPage ? (
            <Button variant="ghost" size="sm" asChild className="h-9 px-3 text-sm sm:h-9 sm:px-4">
              <Link to="/auth/login">Log In</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild className="h-9 px-3 text-sm sm:h-9 sm:px-4">
              <Link to="/auth/login">Log In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
