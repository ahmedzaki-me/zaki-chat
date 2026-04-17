import { supabase } from "@/lib/supabase";
import { toast } from "sonner"

export const sendMessage = async (
  message: string,
  senderId: string | undefined,
  conversationId: string | undefined,
    replyToId?: string | null,
) => {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        content: message,
        sender_id: senderId,
        conversation_id: conversationId,
            reply_to_id: replyToId ?? null,
      },
    ])
    .select();
  return { data, error };
};

export const deleteMessage = async (id: string) => {
  const toastId = toast.loading("Deleting message...");

  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', id)
      .select();

    if (error) {
      toast.error("Delete failed: " + error.message, { id: toastId });
      return { data: null, error };
    }

    toast.success("Message deleted successfully", { id: toastId });
    return { data, error: null };

  } catch (err) {
    toast.error("An unexpected error occurred", { id: toastId });
    return { data: null, error: err };
  }
};

export const DeleteConv = async (id: string)=>{
  try {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', id);


    if (error) {
      toast.error("Delete failed: " + error.message, { id: id });
      return { error };
    }

    toast.success("Message deleted successfully", { id: id });

  } catch (err) {
    toast.error("An unexpected error occurred", { id: id });
    return { error: err };
  }
}
