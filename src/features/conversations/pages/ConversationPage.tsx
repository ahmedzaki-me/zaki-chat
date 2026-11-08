import axios from "axios";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useConversation } from "@/features/conversations/hooks/useConversations";
import { useOwnerConversationsRealtime } from "@/features/conversations/hooks/useOwnerConversationsRealtime";
import { ChatView } from "@/features/chat/components/ChatView";
import { ChatHeader } from "@/features/chat/components/ChatHeader";

export const ConversationPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  useOwnerConversationsRealtime();

  const { data, isLoading, isError, error } = useConversation(conversationId);
  const conversation = data?.conversation;

  if (isLoading) {
    return (
      <main className="flex h-dvh flex-col bg-background">
        <header className="flex items-center gap-3 border-b bg-card px-3 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground"
            onClick={() => navigate("/owner")}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-6 w-32" />
        </div>
      </main>
    );
  }

  if (isError || !conversation) {
    const isNotFound =
      axios.isAxiosError(error) && error.response?.status === 404;
    return (
      <main className="flex h-dvh flex-col bg-background">
        <header className="flex items-center gap-2 border-b bg-card px-3 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground"
            onClick={() => navigate("/owner")}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-sm font-semibold">Conversation</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
          <p className="text-muted-foreground">
            {isNotFound
              ? "Conversation not found."
              : "Failed to load conversation."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/owner")}
          >
            Back to conversations
          </Button>
        </div>
      </main>
    );
  }

  return (
    <ChatView
      key={conversation.id}
      conversationId={conversation.id}
      currentUserId={user?.id}
      subtitleDate={conversation.createdAt}
      header={
        <ChatHeader
          conversation={conversation}
          showBack
          showGuestBadge
          isLoading={false}
        />
      }
      introText={`Chat with ${conversation.user.name}`}
      otherName={conversation.user.name}
      peerUser={{
        name: conversation.user.name,
        avatarUrl: conversation.user.avatarUrl,
      }}
      peerDeliveredUpTo={conversation.peerDeliveredUpTo}
      peerReadUpTo={conversation.peerReadUpTo}
      unreadCount={conversation.unreadCount}
      isOwner
    />
  );
};
