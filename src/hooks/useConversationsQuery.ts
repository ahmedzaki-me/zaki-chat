import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/lib/supabase";
import { getProfiles } from "@/lib/supabase";

export const conversationsKeys = {
  conversations: ["conversations"],
  profiles: ["profiles"],
};

export const conversationsQueries = {
  conversations: () => ({
    queryKey: conversationsKeys.conversations,
    queryFn: getConversations,
    refetchOnMount: true,
    staleTime: 0,
  }),
  profiles: () => ({
    queryKey: conversationsKeys.profiles,
    queryFn: getProfiles,
  }),
};

export const useConversations = () =>
  useQuery(conversationsQueries.conversations());

export const useProfiles = () => useQuery(conversationsQueries.profiles());
