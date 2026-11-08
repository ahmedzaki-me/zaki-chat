import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChatView } from "@/features/chat/components/ChatView";
import { ChatHeader } from "@/features/chat/components/ChatHeader";

import { useConversationQuery } from "@/features/conversations/hooks/useConversations";
import { Button } from "@/shared/components/ui/button";
import { NotificationPromptDialog } from "@/features/notifications/components/NotificationPromptDialog";

export const ChatPage = () => {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useConversationQuery();

  const conversation = data?.conversation;
  if (isError)
    return (
      <div className="grid h-dvh place-content-center gap-4 text-center">
        <p>Could not load your conversation.</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  return (
    <>
      <ChatView
        conversationId={conversation?.id}
        currentUserId={user?.id}
        subtitleDate={conversation?.createdAt}
        peerDeliveredUpTo={conversation?.peerDeliveredUpTo}
        peerReadUpTo={conversation?.peerReadUpTo}
        unreadCount={conversation?.unreadCount}
        isConversationLoading={isLoading}
        introText="Your private conversation is protected."
        header={
          <ChatHeader
            conversationId={conversation?.id}
            ownerProfile={conversation?.owner ?? undefined}
            subtitleFallback="Usually respond in less than a day."
          />
        }
        peerUser={{
          name: conversation?.owner?.name ?? "",
          avatarUrl: conversation?.owner?.avatarUrl ?? "",
        }}
      />

      {user?.role !== "owner" && user && (
        <NotificationPromptDialog
          userId={user.id}
          ready={!isLoading && !!conversation}
        />
      )}
    </>
  );
};
