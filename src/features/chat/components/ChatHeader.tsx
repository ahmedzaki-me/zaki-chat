import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { AvatarBadge } from "@/shared/components/ui/avatar";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { SettingSheet } from "@/features/settings/components/SettingSheet";
import { InstallButton } from "@/core/pwa/InstallButton";
import { AvatarViewerModal } from "@/features/chat/components/media/AvatarViewerModal";
import { UserUpgrade } from "@/features/auth/components/UserUpgrade";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePeerTyping, usePresence } from "@/features/presence/context/ChatRealtimeProvider";
import { TypingDots } from "@/features/presence/components/TypingDots";
import { formatDateTime } from "@/shared/lib/date";
import type { Conversation, OwnerProfile } from "@/features/conversations/types/conversation.types";
import { useQueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";

export interface ChatHeaderProps {
  conversation?: Conversation;
  conversationId?: string;
  ownerProfile?: OwnerProfile;
  name?: string;
  avatarUrl?: string | null;
  username?: string | null;
  userId?: string;
  lastSeenAt?: string | null;
  isLoading?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  subtitleFallback?: string;
  showGuestBadge?: boolean;
  onAvatarExpired?: () => void;
}

export function ChatHeader({
  conversation,
  conversationId: explicitConversationId,
  ownerProfile,
  name: explicitName,
  avatarUrl: explicitAvatarUrl,
  username: explicitUsername,
  userId: explicitUserId,
  lastSeenAt: explicitLastSeenAt,
  isLoading = false,
  showBack = false,
  onBack,
  subtitleFallback,
  showGuestBadge = false,
  onAvatarExpired,
}: ChatHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const conversationId = conversation?.id ?? explicitConversationId;
  const name = conversation?.user.name ?? ownerProfile?.name ?? explicitName ?? "User";
  const avatarUrl = conversation?.user.avatarUrl ?? ownerProfile?.avatarUrl ?? explicitAvatarUrl;
  const username = conversation?.user.username ?? explicitUsername;
  const userId = conversation?.user.id ?? explicitUserId;
  const lastSeenAt = conversation?.user.lastSeenAt ?? explicitLastSeenAt;

  const online = usePresence().has(userId ?? "");
  const typing = usePeerTyping().has(conversationId ?? "");

  const handleBack = onBack ?? (() => navigate("/owner"));
  const handleAvatarExpired =
    onAvatarExpired ??
    (() => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });
    });

  return (
    <div className="relative">
      <div className="flex items-center gap-3 bg-card px-3 py-2.5 shadow-sm">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground"
            onClick={handleBack}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center gap-2.5">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="relative shrink-0">
              <motion.div
                layoutId={`chat-header-avatar-${conversationId || "peer"}`}
                onClick={() => setIsExpanded(true)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`View ${name}'s profile photo`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsExpanded(true);
                  }
                }}
              >
                <UserAvatar
                  name={name}
                  avatarUrl={avatarUrl}
                  size="lg"
                  className="size-10"
                  onExpired={handleAvatarExpired}
                >
                  {online && (
                    <AvatarBadge className="bg-emerald-500 ring-background" />
                  )}
                </UserAvatar>
              </motion.div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground leading-tight">
                {name}
              </p>
              <p className="truncate text-xs leading-tight mt-0.5 text-muted-foreground italic">
                {typing ? (
                  <>
                    typing <TypingDots />
                  </>
                ) : online ? (
                  <span className="text-primary font-medium">Online</span>
                ) : lastSeenAt ? (
                  `Last seen ${formatDateTime(lastSeenAt)}`
                ) : (
                  subtitleFallback ?? ""
                )}
              </p>
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center">
          {user && !user.username && <UserUpgrade />}
          <InstallButton />
          <SettingSheet>
            <MoreVertical className="size-4" />
          </SettingSheet>
        </div>
      </div>

      {!isLoading && showGuestBadge && (
        <div className="absolute left-1/2 top-full z-10 w-full -translate-x-1/2 bg-black/60 px-2 py-1 text-center text-xs text-white/70">
          {username ? `@${username}` : "guest"}
        </div>
      )}

      <AvatarViewerModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        avatarUrl={avatarUrl}
        name={name}
        layoutId={`chat-header-avatar-${conversationId || "peer"}`}
      />
    </div>
  );
}

export default ChatHeader;
