import { useNavigate } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

import type { Profile } from "@/components/chat/chat.types";
import { getInitials, formatDateTime } from "@/components/chat/chat.utils";

import { useUsersStatus } from "@/context/UsersStatusContext";
import { SettingSheet } from "@/components/chat/SettingSheet";
interface ChatHeaderProps {
  profile: Profile | undefined;
  isLoading: boolean;
}

export default function ChatHeader({ profile, isLoading }: ChatHeaderProps) {
  const navigate = useNavigate();
  const { usersStatus } = useUsersStatus();

  const usersById = Object.fromEntries(
    Object.values(usersStatus).map((u) => [u.user_id, u]),
  );

  const userId = profile?.id;

  const userPresence = userId ? usersById[userId] : undefined;
  const isOnline = userPresence?.status === "online";

  const lastSeenLabel = profile?.last_seen
    ? isOnline
      ? "Online"
      : `Last seen ${formatDateTime(profile.last_seen)}`
    : "";

  return (
    <div className="relative">
      <div className="flex items-center px-3 py-2.5 bg-card shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {isLoading ? (
          <div className="flex items-center gap-2.5 flex-1">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate leading-tight">
                {profile?.full_name ?? "Unknown"}
              </p>

              <p
                className={cn(
                  "text-[10px] truncate leading-tight mt-0.5",
                  isOnline ? "text-green-500" : "text-muted-foreground",
                )}
              >
                {lastSeenLabel}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center shrink-0">
          <SettingSheet>
            <MoreVertical className="h-4 w-4" />
          </SettingSheet>
        </div>
      </div>

      <div
        className="flex items-center justify-center bg-black/60 text-white/60 
                      text-sm absolute top-full left-1/2 z-10 w-full -translate-x-1/2"
      >
        {profile?.email ? profile?.email : "guest "}
      </div>
    </div>
  );
}
