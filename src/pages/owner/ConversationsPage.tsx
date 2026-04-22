import { useState } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { Search, MessageSquare, Pin, CheckCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingSheet } from "@/components/chat/SettingSheet";

import { useConversations, useProfiles } from "@/hooks/useConversationsQuery";

import { useAuth } from "@/hooks/useAuth";
import { ConversationsActions } from "./ConversationsActions";
import { DeleteConv } from "@/hooks/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_online: boolean;
  email: string | null;
}

interface ConversationRow {
  id: string;
  user_id: string;
  last_message_text: string | null;
  last_message_time: string;
  unread_count: number;
  is_typing: boolean;
  updated_at: string;
  is_pinned: boolean;
  isLastMessageFromMe: boolean;
  last_message_read: boolean;
  last_message_sender_id: string;
}

interface MappedConversation {
  id: string;
  user: {
    name: string;
    avatarUrl?: string;
    isOnline: boolean;
    isFocused: boolean;
  };
  lastMessage: {
    text: string;
    sentAt: Date;
  };
  unreadCount: number;
  isTyping: boolean;
  isPinned: boolean;
  isRead: boolean;
  isLastMessageFromMe: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
async function handleDelete(convId: string) {
  const error = await DeleteConv(convId);
  if (error) console.log(error);
}

function ConversationItem({
  conversation,
  onClick,
}: {
  conversation: MappedConversation;
  onClick: () => void;
}) {
  const {
    user,
    lastMessage,
    unreadCount,
    isTyping,
    isLastMessageFromMe,
    isRead,
    id,
  } = conversation;
  const hasUnread = unreadCount > 0;

  return (
    <ConversationsActions onDelete={() => handleDelete(id)}>
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left",
          "transition-colors duration-150 cursor-pointer ",
          "hover:bg-accent focus-visible:outline-none focus-visible:bg-accent",
          hasUnread && "bg-accent/30",
        )}
      >
        {/* Avatar + Online Dot */}
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {user.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              {conversation.isPinned && (
                <Pin className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm truncate",
                  hasUnread
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground/90",
                )}
              >
                {user.name}
              </span>
            </div>

            <span
              className={cn(
                "text-xs shrink-0",
                hasUnread
                  ? "text-primary font-semibold"
                  : "text-muted-foreground",
              )}
            >
              {format(lastMessage.sentAt, "hh:mm a")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {isLastMessageFromMe && !isTyping && (
                <span className="shrink-0">
                  {isRead ? (
                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </span>
              )}

              <p
                className={cn(
                  "text-xs truncate max-w-55 [unicode-bidi:plaintext]",
                  isTyping
                    ? "text-primary italic"
                    : hasUnread
                      ? "text-foreground/80 font-medium"
                      : "text-muted-foreground",
                )}
              >
                {isTyping ? "Typing..." : lastMessage.text || "No messages yet"}
              </p>
            </div>

            {hasUnread && (
              <Badge className="h-5 min-w-5 ...">{unreadCount}</Badge>
            )}
          </div>
        </div>
      </button>
    </ConversationsActions>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
import { useUsersStatus } from "@/context/UsersStatusContext";

export default function ConversationsPage() {
  const [search, setSearch] = useState("");
  const { user: currentUser } = useAuth();
  const { usersStatus } = useUsersStatus();

  const { data: conversations, isLoading: convsLoading } =
    useConversations() ?? {};
  const { data: profiles, isLoading: profilesLoading } = useProfiles() ?? {};

  const navigate = useNavigate();

  const usersById = Object.fromEntries(
    Object.values(usersStatus).map((u) => [u.user_id, u]),
  );
  const mappedConversations: MappedConversation[] = (conversations ?? [])

    .map((conv: ConversationRow) => {
      const profile = (profiles ?? []).find(
        (p: Profile) => p.id === conv.user_id,
      );

      const userPresence = usersById[conv.user_id];
      const isOnline = userPresence?.status === "online";
      const isTyping = userPresence?.is_typing ?? false;
      const isFocused = userPresence?.is_focused;

      const isLastMessageFromMe =
        conv.last_message_sender_id === currentUser?.id;

      return {
        id: conv.id,
        isPinned: conv.is_pinned,
        user: {
          name: profile?.full_name ?? profile?.email ?? "Unknown User",
          avatarUrl: profile?.avatar_url ?? undefined,
          isOnline: isOnline,
          isFocused: isFocused,
        },
        lastMessage: {
          text: conv.last_message_text ?? "",
          sentAt: new Date(conv.last_message_time),
        },
        unreadCount: conv.unread_count,
        isTyping: isTyping,
        isLastMessageFromMe,
        isRead: conv.last_message_read,
      };
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.lastMessage.sentAt.getTime() - a.lastMessage.sentAt.getTime();
    });
  const totalUnread = mappedConversations.reduce(
    (acc, c) => acc + c.unreadCount,
    0,
  );

  const filtered = mappedConversations.filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isLoading = convsLoading || profilesLoading;

  return (
    <div
      className="flex flex-col h-dvh w-full mx-auto bg-background
                  border-r border-border bg-none overflow-hidden"
    >
      {/* ── Header ── */}
      <header className="px-4 pt-5 pb-3 space-y-4 flex-none ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Zaki Messages
            </h1>
            {totalUnread > 0 && (
              <Badge
                variant="secondary"
                className="h-5 rounded-full text-[10px] font-bold"
              >
                {totalUnread}
              </Badge>
            )}
          </div>
          <div className="flex justify-center items-center gap-1">
            <SettingSheet>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </SettingSheet>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:border-input rounded-full text-sm"
          />
        </div>
      </header>

      <Separator />

      {/* ── Conversation List ── */}
      <ScrollArea className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading conversations...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No conversations found
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {search
                ? "Try searching with a different name"
                : "No customer conversations yet"}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map((conversation, index) => (
              <div key={conversation.id}>
                <ConversationItem
                  conversation={conversation}
                  onClick={() => navigate(`/owner/${conversation.id}`)}
                />
                {index < filtered.length - 1 && (
                  <Separator className="ml-17 opacity-50" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* ── Footer ── */}
      <Separator />
      <div className="px-4 py-3 flex-none">
        <p className="text-center text-xs text-muted-foreground/50">
          {filtered.length} conversation{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
