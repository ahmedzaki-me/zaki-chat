import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, ChevronsUpDown, MoveUpRight } from "lucide-react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLinkedin,
  faWhatsapp,
  faFacebook,
  faGithub,
  faTelegram,
} from "@fortawesome/free-brands-svg-icons";

import { type ReactNode } from "react";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import ModeSwitch from "@/components/ModeSwitch";
import SubscribeSwitch from "@/components/SubscribeSwitch";
import { UserUpgrade } from "@/components/UserUpgrade";

import { logoutOneSignal } from "./chat.utils";
import { useAuth } from "@/hooks/useAuth";

export function SettingSheet({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutOneSignal();
      const error = await signOut();

      if (!error) {
        queryClient.clear();
        navigate("/login");
      }
    } catch (err) {
      console.log("Logout Error: ", err);
    }
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
      <SheetContent className="border-none outline-none">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 py-4  mb-10 h-auto rounded-none border-none
                        focus-visible:ring-0 bg-chart-5/95 text-white/90 w-full duration-200"
            >
              <Avatar className="h-10 w-10 rounded-full border border-chart-5 ">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {(user?.full_name ?? "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || <User className="size-4" />}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.full_name}</span>
                <span className="truncate text-xs text-[#bbb]">
                  {user?.email ? user?.email : "You are gusst"}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-60 w-full rounded-lg"
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                    {(user?.full_name ?? "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || <User className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.full_name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email ? user?.email : "You are gusst"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <ModeSwitch />
          <SubscribeSwitch />
        </div>

        {!user?.email && (
          <div className="w-full m-auto mb-10">
            <p className=" rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-center text-sm text-purple-800 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-300">
              Your chat history might be lost at any time since you are a guest
              user. To save it,{" "}
              <span className="font-semibold">
                sign up now with an email and password.
              </span>
              <UserUpgrade className="w-7/8 py-5 mt-3 mx-auto" />
            </p>
          </div>
        )}

        <footer className="mt-auto border-t-2 border-border bg-[#eee]/60 dark:bg-card/50 backdrop-blur-md">
          <div className="p-4 space-y-4">
            <Button
              asChild
              variant="outline"
              className="w-full h-12 rounded-2xl font-semibold group relative overflow-hidden border-primary/20 hover:border-primary/50 transition-all duration-300"
            >
              <a
                href="https://ahmedzaki.me"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="relative z-10 flex items-center gap-2 group-hover:text-primary transition-colors">
                  Visit Portfolio{" "}
                  <MoveUpRight className="size-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </Button>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border">
              {[
                {
                  icon: faLinkedin,
                  href: "https://www.linkedin.com/in/ahmedzaki-me",
                  color: "hover:text-[#0077B5]",
                },
                {
                  icon: faGithub,
                  href: "https://github.com/ahmedzaki-me",
                  color: "hover:text-[#181717] dark:hover:text-white",
                },
                {
                  icon: faFacebook,
                  href: "https://www.facebook.com/AhmedZaki.dev/",
                  color: "hover:text-[#1877F2]",
                },
                
                {
                  icon: faWhatsapp,
                  href: "https://wa.me/201286113602",
                  color: "hover:text-[#25D366]",
                },
                {
                  icon: faTelegram,
                  href: "http://t.me/AhmedZaki11103",
                  color: "hover:text-[#24A1DE]",
                },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-muted-foreground ${social.color} transition-all duration-200 transform hover:scale-125 active:scale-95`}
                >
                  <FontAwesomeIcon icon={social.icon} className="text-2xl" />
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
