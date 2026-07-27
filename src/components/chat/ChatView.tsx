import {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { SendHorizontal, Loader2 } from "lucide-react";

import { useMessages } from "@/hooks/useConversationQuery";
import { sendMessage } from "@/hooks/actions";
import { type Message } from "./chat.types";
import { formatDateLabel } from "./chat.utils";
import { DateSeparator, MessageBubble, MessageInput } from "./chat.shared";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

import { useHeartbeat } from "@/hooks/useHeartbeat";
import { playOutgoingSound } from "@/lib/sounds";

interface ChatViewProps {
  conversationId: string | undefined;
  currentUserId: string | undefined;
  header: ReactNode;
  subtitleDate?: string;
}

export function ChatView({
  conversationId,
  currentUserId,
  header,
  subtitleDate,
}: ChatViewProps) {
  useHeartbeat();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const { user } = useAuth();
  // ─── seen ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    async function markSeen() {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user?.id)
        .eq("is_read", false);
      if (error) throw error;
    }

    if (document.visibilityState === "visible" && document.hasFocus()) {
      markSeen();
    }
    const handleVisible = () => {
      if (document.visibilityState === "visible") markSeen();
    };
    const handleFocus = () => markSeen();
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleFocus);
    };
  }, [conversationId, user]);

  // ─── Track Presence ────────────────────────────────────────────────────────────────
  const HEARTBEAT_INTERVAL = 30_000;

  useEffect(() => {
    if (!user?.id) return;

    let isSubscribed = false;
    let heartbeatTimer: ReturnType<typeof setInterval>;

    const channel = supabase.channel("online_users", {
      config: { presence: { key: user.id } },
    });

    const getStatus = (): "online" | "away" => {
      if (document.hidden || !document.hasFocus()) return "away";
      return "online";
    };

    const trackPresence = async () => {
      if (!isSubscribed) return;
      await channel.track({
        status: getStatus(),
        user_id: user.id,
        is_typing: false,
        active_chat_id: user.conversation_id ?? null,
        online_at: new Date().toISOString(),
      });
    };

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        isSubscribed = true;
        trackPresence();
        heartbeatTimer = setInterval(trackPresence, HEARTBEAT_INTERVAL); // ✅ 30s
      } else {
        isSubscribed = false;
        clearInterval(heartbeatTimer);
      }
    });

    const handleVisibilityChange = () => trackPresence();
    const handleFocus = () => trackPresence();
    const handleBlur = () => trackPresence();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      isSubscribed = false;
      clearInterval(heartbeatTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.conversation_id]);

  // ─── Mutation ──────────────────────────────────────────────────────────────
  const { mutate: sendMessageMutate } = useMutation({
    mutationFn: async ({
      content,
      convId,
      replyToId,
    }: {
      content: string;
      convId: string;
      replyToId?: string | null;
    }) => {
      const { error } = await sendMessage(content, convId, replyToId);
      if (error) throw new Error("Failed to send");
    },

    onMutate: async (newMessage) => {
      await playOutgoingSound();
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previousMessages = queryClient.getQueryData<
        InfiniteData<Message[]>
      >(["messages", conversationId]);

      const optimisticMessage: Message = {
        id: Date.now().toString(),
        conversation_id: conversationId!,
        sender_id: currentUserId!,
        content: newMessage.content,
        message_type: "text",
        created_at: new Date().toISOString(),
        status: "sending",
        reply_to_id: newMessage.replyToId ?? null,
        reply_to: replyTo
          ? {
              id: replyTo.id,
              content: replyTo.content,
              sender_id: replyTo.sender_id,
              is_deleted: replyTo.is_deleted ?? false,
            }
          : null,
      };

      queryClient.setQueryData<InfiniteData<Message[]>>(
        ["messages", conversationId],
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === 0 ? [...page, optimisticMessage] : page,
            ),
          };
        },
      );

      return { previousMessages, tempId: optimisticMessage.id };
    },

    onError: (_err, _newMessage, context) => {
      queryClient.setQueryData<InfiniteData<Message[]>>(
        ["messages", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((msg) =>
                msg.id === context?.tempId ? { ...msg, status: "error" } : msg,
              ),
            ),
          };
        },
      );
    },
  });

  const handleRetry = (failedMessage: Message) => {
    queryClient.setQueryData<InfiniteData<Message[]>>(
      ["messages", conversationId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.filter((m) => m.id !== failedMessage.id),
          ),
        };
      },
    );
    sendMessageMutate({
      content: failedMessage.content,
      convId: failedMessage.conversation_id,
    });
  };
  // ─── Data ──────────────────────────────────────────────────────────────────

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
  } = useMessages(conversationId!, { enabled: !!conversationId });

  const allMessages = useMemo(
    () => data?.pages.toReversed().flat() ?? [],
    [data],
  );

  const groupedMessages =
    (allMessages as Message[] | undefined)?.reduce(
      (acc: { date: string; messages: Message[] }[], msg) => {
        const date = msg.created_at
          ? new Date(msg.created_at).toLocaleDateString("en-CA")
          : "unknown";
        const existing = acc.find((g) => g.date === date);
        if (existing) existing.messages.push(msg);
        else acc.push({ date, messages: [msg] });
        return acc;
      },
      [],
    ) ?? [];

  // ─── Load More ────────────────────────────────────────────────
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          const scrollOffsetFromBottom =
            container.scrollHeight - container.scrollTop;

          isLoadingMore.current = true;
          await fetchNextPage();

          requestAnimationFrame(() => {
            container.scrollTop =
              container.scrollHeight - scrollOffsetFromBottom;
            setTimeout(() => {
              isLoadingMore.current = false;
            }, 100);
          });
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // ─── Scroll to bottom ─────────────────────────────────────────
  const isInitialLoad = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const lastMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!allMessages || allMessages.length === 0) return;
    if (isLoadingMore.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    if (isInitialLoad.current) {
      scrollToBottom("instant");
      isInitialLoad.current = false;
      lastMessageIdRef.current = allMessages[allMessages.length - 1]?.id;
      return;
    }

    // هل آخر رسالة في المصفوفة اتغيرت؟ (يعني في حاجة انضافت تحت)
    const lastMessage = allMessages[allMessages.length - 1];
    const lastRealId = lastMessage?.id;

    const isOptimisticReplacement =
      lastMessageIdRef.current !== lastRealId &&
      lastMessage?.status !== "sending" &&
      allMessages.some(
        (m) => m.status === "sending" && m.sender_id === lastMessage?.sender_id,
      );

    const hasNewBottomMessage =
      lastRealId !== lastMessageIdRef.current && !isOptimisticReplacement;

    // تحديث المرجع لآخر رسالة
    if (!hasNewBottomMessage) return;
    lastMessageIdRef.current = lastMessage?.id;

    // لو مفيش رسالة جديدة تحت (يعني اللي زاد كان فوق "Pagination")، اخرج فوراً

    // لو الرسالة بتاعتي أو أنا قريب من القاع، اعمل سكرول
    const isMine = lastMessage?.sender_id === currentUserId;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      250;

    if (isMine || isNearBottom) {
      // استخدم requestAnimationFrame لضمان أن الـ DOM اتحدث
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    }
  }, [allMessages, currentUserId, scrollToBottom]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-dvh bg-muted/10 min-h-0 inset-0 ">
      <div className="shrink-0 z-10">{header}</div>

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col justify-end min-h-full py-4">
          <div ref={topSentinelRef} className="h-1 w-full" />
          {messagesLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 w-48 rounded-2xl" />
              <Skeleton className="h-12 w-32 rounded-2xl ml-auto" />
              <Skeleton className="h-12 w-54 rounded-2xl" />
              <Skeleton className="h-12 w-32 rounded-2xl ml-auto" />
              <DateSeparator label={formatDateLabel(`00:00:00`)} />
              <Skeleton className="h-12 w-54 rounded-2xl" />
              <Skeleton className="h-12 w-32 rounded-2xl ml-auto" />
              <Skeleton className="h-12 w-48 rounded-2xl" />
              <Skeleton className="h-12 w-32 rounded-2xl ml-auto" />
              <Skeleton className="h-12 w-48 rounded-2xl" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center gap-2 opacity-90 font-semibold italic md:text-foreground/50 text-white/90">
                {subtitleDate && (
                  <p className="text-[16px]">
                    ({formatDateLabel(subtitleDate)})
                  </p>
                )}
                <p className="text-[16px]">
                  Chat with Zaki, Your privacy is protected.
                </p>
              </div>

              {groupedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-70 ">
                  <SendHorizontal className="h-12 w-12" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                <>
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <DateSeparator
                        label={formatDateLabel(`${group.date}T00:00:00`)}
                      />
                      {group.messages.map((msg, idx) => {
                        const isOwn = msg.sender_id === currentUserId;
                        const prevMsg = group.messages[idx - 1];
                        const isConsecutive =
                          !!prevMsg && prevMsg.sender_id === msg.sender_id;
                        return (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={isOwn}
                            isConsecutive={isConsecutive}
                            onRetry={handleRetry}
                            onReply={(msg) => setReplyTo(msg)}
                          />
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} className="h-4 w-full" />
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <MessageInput
          onSend={(content) => {
            if (currentUserId && conversationId) {
              sendMessageMutate({
                content,
                convId: conversationId,
                replyToId: replyTo?.id ?? null,
              });
              setReplyTo(null);
            }
          }}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}
