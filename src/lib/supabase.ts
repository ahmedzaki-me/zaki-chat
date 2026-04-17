import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();
    if (sessionError || !user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch profile:", error.message);
      return null;
    }
    return { ...(user ?? {}), ...(profile ?? {}) };
  } catch (e) {
    console.error("getCurrentUser threw: ", e);
    return null;
  }
};

const fetchData = async (
  table: string,
  errorMessage: string,
  sortColumn = "id",
  ascending = true,
) => {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(sortColumn, { ascending });
  if (error) {
    console.error(`Error fetching ${table}:`, error.message);
    throw new Error(errorMessage);
  }
  return data || [];
};

export const getConversations = () =>
  fetchData(
    "conversations",
    "Failed to fetch conversations",
    "last_message_time",
    true,
  );
  
export const getProfiles = () =>
  fetchData("profiles", "Failed to fetch profiles");


export const PAGE_SIZE = 50;

export const getMessages = async (
  conversationId: string,
  pageParam: number = 0,
) => {
  const { data, error } = await supabase
    .from("messages_safe")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false }) 
    .range(pageParam, pageParam + PAGE_SIZE - 1);

  if (error) {
    throw new Error("Failed to fetch messages for this conversation");
  }

  const messages = data || [];

  const replyIds = messages
    .map((m) => m.reply_to_id)
    .filter(Boolean) as string[];

  if (replyIds.length) {
    const { data: replies } = await supabase
      .from("messages_safe")
      .select("id, content, sender_id, is_deleted")
      .in("id", replyIds);

    return messages
      .map((msg) => ({
        ...msg,
        reply_to: replies?.find((r) => r.id === msg.reply_to_id) ?? null,
      }))
      .reverse(); 
  }

  return messages.reverse(); 
};
