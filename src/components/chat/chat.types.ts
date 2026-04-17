export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file";
  created_at: string;
  is_read?: boolean;
  is_deleted?: boolean;
  status?: "sending" | "sent" | "error";
  reply_to_id?: string | null;
  reply_to?: Pick<Message, "id" | "content" | "sender_id" | "is_deleted"> | null; 
}

export interface Profile {
  id: string;
  role: "user" | "owner";
  full_name: string;
  avatar_url: string | null;
  last_seen: string;
  is_online: boolean;
  created_at: string;
  conversation_id: string;
  email: string;
}
