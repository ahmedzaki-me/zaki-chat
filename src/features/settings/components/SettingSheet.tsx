import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { MoveUpRight } from "lucide-react";
import {
  LinkedInIcon,
  GitHubIcon,
  FacebookIcon,
  WhatsAppIcon,
  TelegramIcon,
} from "@/shared/components/SocialIcons";

import { type ReactNode } from "react";
import { useNavigate } from "react-router";

import ModeSwitch from "@/shared/components/feedback/ModeSwitch";
import { UserUpgrade } from "@/features/auth/components/UserUpgrade";
import { NotificationToggleRow } from "@/features/notifications/components/NotificationToggleRow";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/api/auth.service";
import { Separator } from "@/shared/components/ui/separator";

export function SettingSheet({ children }: { children: ReactNode }) {
  const { user, updateAvatar } = useAuth();
  const navigate = useNavigate();

  const refreshUser = () => {
    void getCurrentUser()
      .then(({ user: fresh }) => {
        updateAvatar(fresh.avatarUrl);
      })
      .catch(() => undefined);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
        >
          {children}
        </Button>
      </SheetTrigger>

      <SheetHeader className="sr-only">
        <SheetTitle>Settings Menu</SheetTitle>
        <SheetDescription>
          Manage your account settings and preferences.
        </SheetDescription>
      </SheetHeader>

      <SheetContent className="border-none outline-none flex flex-col">
        {/* User Info */}
        <div className="flex items-center gap-3 px-4 py-5 bg-chart-5/95 text-white/90">
          <UserAvatar
            name={user?.name ?? "User"}
            avatarUrl={user?.avatarUrl}
            className="h-10 w-10 border border-chart-5"
            onExpired={refreshUser}
          />

          <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
            <span className="truncate font-medium">{user?.name ?? "User"}</span>

            <span className="truncate text-xs text-white/60">
              {user?.username ?? "You are a guest"}
            </span>
          </div>
        </div>

        {/* Account Settings */}
        <Button
          variant="ghost"
          onClick={() => navigate("/settings")}
          className="w-full justify-start gap-3 px-3 h-14 text-[14px]"
        >
          Account Settings
        </Button>

        <Separator />

        {/* Appearance */}
        <div className="grid flex-1 auto-rows-min gap-6 px-4 mt-4">
          <ModeSwitch />
          <NotificationToggleRow />
        </div>

        {/* Guest Warning */}
        {user && !user.username && (
          <div className="px-4 py-3 bg-chart-1/10 border border-chart-1/20 rounded-lg text-chart-1 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">You are a guest</p>
                <p className="text-chart-1/80 mt-1">
                  You can't restore this account if you logout.
                </p>
              </div>
              <UserUpgrade className="h-8" />
            </div>
          </div>
        )}

        <Separator />

        {/* Footer info & Links */}
        <footer className="mt-auto p-4 space-y-4">
          <div className="space-y-3">
            <div className="text-center">
              <a
                href="https://ahmedzaki.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium group"
              >
                <span>Visit Portfolio</span>
                <MoveUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border">
              {[
                {
                  Icon: LinkedInIcon,
                  href: "https://www.linkedin.com/in/ahmedzaki-me",
                  color: "hover:text-[#0077B5]",
                  label: "LinkedIn",
                },
                {
                  Icon: GitHubIcon,
                  href: "https://github.com/ahmedzaki-me",
                  color: "hover:text-[#181717] dark:hover:text-white",
                  label: "GitHub",
                },
                {
                  Icon: FacebookIcon,
                  href: "https://www.facebook.com/AhmedZaki.me/",
                  color: "hover:text-[#1877F2]",
                  label: "Facebook",
                },
                {
                  Icon: WhatsAppIcon,
                  href: "https://wa.me/201286113602",
                  color: "hover:text-[#25D366]",
                  label: "WhatsApp",
                },
                {
                  Icon: TelegramIcon,
                  href: "http://t.me/AhmedZaki11103",
                  color: "hover:text-[#24A1DE]",
                  label: "Telegram",
                },
              ].map(({ Icon, href, color, label }, index) => (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`text-muted-foreground ${color} transition-all duration-200 transform hover:scale-125 active:scale-95`}
                >
                  <Icon className="text-2xl" />
                </a>
              ))}
            </div>

            <div className="text-center space-y-1">
              <p className="text-[12px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
                Made with love By
                <span className="text-primary font-bold text-[15px]">
                  Ahmed Zaki
                </span>
              </p>

              <p className="text-[10px] text-muted-foreground/80 tracking-widest uppercase">
                &copy; {new Date().getFullYear()} ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
