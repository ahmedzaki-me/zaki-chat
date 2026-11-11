import { LastMessagePreview } from "@/features/conversations/components/LastMessagePreview";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { formatConversationDate } from "@/shared/lib/date";
import { MessageSquareText, Pin, Search, Settings } from "lucide-react";
import { AvatarBadge } from "@/shared/components/ui/avatar";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { useQueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/features/conversations/hooks/useConversations";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { SettingSheet } from "@/features/settings/components/SettingSheet";

import type { Conversation } from "@/features/conversations/types/conversation.types";
import {
  useConversationsList,
  usePinMutation,
} from "@/features/conversations/hooks/useConversations";
import { sortConversations } from "@/features/conversations/cache/conversationCache";
import { ConversationsActions } from "@/features/conversations/components/ConversationsActions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  usePeerTyping,
  usePresence,
} from "@/features/presence/context/ChatRealtimeProvider";

const EMPTY_CONVERSATIONS: Conversation[] = [];

function conversationTime(dateValue: string | null): string {
  return dateValue ? formatConversationDate(dateValue) : "";
}

function ConversationItem({
  conversation,
  onOpen,
  onPin,
}: {
  conversation: Conversation;
  onOpen: () => void;
  onPin: (pinned: boolean) => void;
}) {
  const unreadCount = conversation.unreadCount ?? 0;
  const typing = usePeerTyping().has(conversation.id);
  const online = usePresence().has(conversation.user.id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pinned = !!conversation.pinnedAt;
  return (
    <ConversationsActions
      conversationId={conversation.id}
      isPinned={pinned}
      onPinChange={onPin}
      className="block"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:bg-accent cursor-pointer"
      >
        <UserAvatar
          name={conversation.user.name}
          avatarUrl={conversation.user.avatarUrl}
          size="lg"
          className="size-11"
          onExpired={() =>
            void queryClient.invalidateQueries({
              queryKey: conversationKeys.all,
            })
          }
        >
          {online && <AvatarBadge className="bg-emerald-500 ring-background" />}
        </UserAvatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold text-sm text-foreground">
              {conversation.user.name}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {conversationTime(
                conversation.lastMessageAt ?? conversation.createdAt,
              )}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted-foreground">
              <LastMessagePreview
                conversation={conversation}
                ownerId={user?.id}
                typing={typing}
              />
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              {pinned && <Pin className="size-3 text-primary rotate-45" />}
              {unreadCount > 0 && (
                <Badge
                  variant="default"
                  className="size-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </button>
    </ConversationsActions>
  );
}

export default function ConversationsPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data, isLoading } = useConversationsList();
  const pinMutation = usePinMutation();

  const conversations = data?.conversations ?? EMPTY_CONVERSATIONS;

  const totalUnread = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0),
    [conversations],
  );

  const sortedConversations = useMemo(() => {
    return sortConversations(conversations);
  }, [conversations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedConversations;
    const term = search.toLowerCase();
    return sortedConversations.filter(
      (c) =>
        c.user.name.toLowerCase().includes(term) ||
        (c.user.username && c.user.username.toLowerCase().includes(term)),
    );
  }, [sortedConversations, search]);

  return (
    <main className="flex h-dvh flex-col bg-background">
      {/* ── Header with integrated sleek search bar ── */}
      <header className="flex flex-col gap-3 border-b bg-card px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-5 text-primary" />
            <h1 className="font-semibold text-base tracking-tight">Zaki Chat</h1>
            {totalUnread > 0 && (
              <Badge
                variant="secondary"
                className="h-5 rounded-full px-2 text-[10px] font-bold"
              >
                {totalUnread > 99 ? "99+" : totalUnread}
              </Badge>
            )}
          </div>
          <SettingSheet>
            <Settings className="size-4" />
          </SettingSheet>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:border-input rounded-full text-sm"
          />
        </div>
      </header>

      {/* ── Conversations List ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
            <MessageSquareText className="size-10 stroke-1" />
            <p className="text-sm">
              {search.trim()
                ? "No conversations match your search."
                : "No conversations yet."}
            </p>
          </div>
        ) : (
          filtered.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              onOpen={() => navigate(`/owner/${c.id}`)}
              onPin={(pinned) => pinMutation.mutate({ id: c.id, pinned })}
            />
          ))
        )}
      </div>

      {/* ── Footer with conversation count ── */}
      <footer className="border-t bg-card/40 px-4 py-2.5 shrink-0">
        <p className="text-center text-xs text-muted-foreground/70">
          {conversations.length === 0
            ? "No conversations"
            : search.trim()
              ? `${filtered.length} of ${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
              : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
        </p>
      </footer>
    </main>
  );
}
