import { useAuth } from "@/hooks/useAuth";
import { useMessagesRealtime } from "@/hooks/useMessagesRealtime";
import { ChatView } from "@/components/chat/ChatView";
import ChatHeaderUser from "./ChatHeaderUser";

export const ChatPage = () => {
  const { user } = useAuth();

  useMessagesRealtime(user?.id, user?.conversation_id);

  const conversationId = user?.conversation_id ?? "";


  return (
    <ChatView
      conversationId={conversationId}
      currentUserId={user?.id}
      subtitleDate={user?.created_at}
      header={<ChatHeaderUser />}
    />
  );
};
