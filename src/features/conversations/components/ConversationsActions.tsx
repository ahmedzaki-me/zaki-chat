import { useState, type ReactNode } from "react";
import { MessageSquareOff, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { emitWithAck, SocketError } from "@/core/socket/socket";
import { canUseChatConnection } from "@/shared/lib/offlineGuard";

interface ConversationsActionsProps {
  children: ReactNode;
  conversationId: string;
  isPinned: boolean;
  onPinChange: (pinned: boolean) => void;
  className?: string;
}

export function ConversationsActions({
  children,
  conversationId,
  isPinned,
  onPinChange,
  className,
}: ConversationsActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const clearConversation = async () => {
    if (!canUseChatConnection(true)) return;
    setIsClearing(true);
    try {
      await emitWithAck<null>("conversation:clear", { conversationId });
      toast.success("Conversation cleared");
      setConfirmOpen(false);
    } catch (error) {
      const detail =
        error instanceof SocketError ? error.problem.detail : undefined;
      toast.error(
        detail ||
          (error instanceof Error
            ? error.message
            : "Could not clear conversation"),
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className={className}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuItem onSelect={() => onPinChange(!isPinned)}>
              {isPinned ? <PinOff /> : <Pin />}
              {isPinned ? "Unpin" : "Pin"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => setConfirmOpen(true)}
            >
              <MessageSquareOff />
              Clear chat
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !isClearing && setConfirmOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear this conversation?</DialogTitle>
            <DialogDescription>
              This permanently deletes every message in the conversation. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isClearing}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isClearing}
              onClick={() => void clearConversation()}
            >
              {isClearing ? "Clearing…" : "Clear chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
