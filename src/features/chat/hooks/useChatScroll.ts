import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import type { Message, PendingMessage } from "@/features/chat/types/chat.types";

interface UseChatScrollOptions {
  conversationId?: string;
  currentUserId?: string;
  messages: (Message | PendingMessage)[];
  loading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => unknown;
  goToReply: (replyToId: string) => Promise<unknown>;
}

interface UseChatScrollReturn {
  containerRef: RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  handleGoToReply: (replyToId: string) => Promise<void>;
  scrollToBottom: (smooth?: boolean) => void;
}

export function useChatScroll({
  conversationId,
  currentUserId,
  messages,
  loading,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  goToReply,
}: UseChatScrollOptions): UseChatScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrolledRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);

  // Reset scroll state on conversation switch
  useEffect(() => {
    initialScrolledRef.current = false;
    lastMessageIdRef.current = null;
    isNearBottomRef.current = true;
  }, [conversationId]);

  // Initial scroll to bottom once messages are ready
  useLayoutEffect(() => {
    if (loading || !messages.length) return;
    const container = containerRef.current;
    if (!container) return;

    if (!initialScrolledRef.current) {
      container.scrollTop = container.scrollHeight;
      initialScrolledRef.current = true;
      lastMessageIdRef.current = messages.at(-1)?.id ?? null;
      isNearBottomRef.current = true;
    }
  }, [loading, messages]);

  // Keep pinned to bottom when content resizes (e.g. media decoding / images rendering) if near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const inner = container.querySelector("[data-messages-inner]");
    if (!inner) return;

    const observer = new ResizeObserver(() => {
      if (!initialScrolledRef.current) {
        container.scrollTop = container.scrollHeight;
        initialScrolledRef.current = true;
        lastMessageIdRef.current = messages.at(-1)?.id ?? null;
        isNearBottomRef.current = true;
      } else if (isNearBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(inner);

    return () => observer.disconnect();
  }, [messages]);

  // Follow output when new message arrives or is sent
  useEffect(() => {
    if (!messages.length || !initialScrolledRef.current) return;
    const latest = messages.at(-1)!;
    if (latest.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = latest.id;

    const container = containerRef.current;
    if (!container) return;

    const isMine = latest.senderId === currentUserId;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;

    if (isMine || isNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      isNearBottomRef.current = true;
    }
  }, [messages, currentUserId]);

  // Infinite scroll: fetch older messages when near top
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distance < 100;

    if (!hasNextPage || isFetchingNextPage || !initialScrolledRef.current) return;

    if (container.scrollTop < 80) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Scroll to reply message
  const handleGoToReply = useCallback(
    async (replyToId: string) => {
      let el = document.getElementById(`msg-${replyToId}`);
      if (!el && hasNextPage) {
        await goToReply(replyToId);
        el = document.getElementById(`msg-${replyToId}`);
      }
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight-msg");
        window.setTimeout(() => el.classList.remove("highlight-msg"), 2000);
      }
    },
    [hasNextPage, goToReply],
  );

  const scrollToBottom = useCallback((smooth = true) => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  return {
    containerRef,
    handleScroll,
    handleGoToReply,
    scrollToBottom,
  };
}
