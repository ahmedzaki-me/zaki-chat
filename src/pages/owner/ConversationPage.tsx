import { useParams } from "react-router";
import { useEffect } from "react";
import { useProfiles } from "@/hooks/useConversationQuery";
import { useConversations } from "@/hooks/useConversationsQuery";

import { useAuth } from "@/hooks/useAuth";
import { useMessagesRealtime } from "@/hooks/useMessagesRealtime";
import { supabase } from "@/lib/supabase";

import { ChatView } from "@/components/chat/ChatView";
import ChatHeader from "./ChatHeader";
import { type Profile } from "@/components/chat/chat.types";

export const ConversationPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversations } = useConversations();
  const { data: profiles, isLoading: profilesLoading } = useProfiles() ?? {};
  const { user } = useAuth();

  useMessagesRealtime(user?.id, conversationId);

  const currentConversation = conversations?.find(
    (c) => c.id === conversationId,
  );
  const otherProfile = (profiles as Profile[] | undefined)?.find(
    (p) => p.id === currentConversation?.user_id,
  );
  useEffect(() => {
    async function seen() {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", user?.conversation_id)
        .eq("sender_id", user?.id)
        .eq("is_read", false);
      if (error) throw error;
    }
    seen();
  }, [conversationId, user]);
  
  return (
    <ChatView
      conversationId={conversationId}
      currentUserId={user?.id}
      subtitleDate={otherProfile?.created_at}
      header={<ChatHeader profile={otherProfile} isLoading={profilesLoading} />}
    />
  );
};
