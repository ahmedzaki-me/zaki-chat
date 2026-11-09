import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import {
  CopyIcon,
  Plus,
  Reply,
  TrashIcon,
  Pencil,
  History,
  Download,
  LoaderCircle,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { Reaction } from "@/features/chat/types/chat.types";
import type { Message } from "@/features/chat/types/chat.types";
import { EditHistoryDialog } from "./EditHistoryDialog";
import { toast } from "sonner";
import { useHistoryModal } from "@/shared/hooks/useHistoryModal";

interface MessageActionsProps {
  children: ReactNode;
  onCopy: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onDownload?: () => Promise<void>;
  historyMessage?: Message;
  onDelete?: () => void;
  onDeletePermanently?: () => void;
  onReact?: (emoji: string) => void;
  reactions: Reaction[];
  currentUserId?: string;
  canCopy?: boolean;
  canReply?: boolean;
  canReact?: boolean;
  canDeletePermanently?: boolean;
  className?: string;
}

const quickReactions = [
  "😆",
  "🫠",
  "😂",
  "❤️",
  "😎",
  "😫",
  "😁",
  "😚",
  "🫡",
] as const;

const EmojiPickerPanel = lazy(
  () => import("@/features/chat/components/input/EmojiPickerPanel"),
);

interface QuickReactionsProps {
  onReact?: (emoji: string) => void;
  reactions: Reaction[];
  currentUserId?: string;
  onOpenPicker: () => void;
  onPreloadPicker: () => void;
}

const QuickReactions = memo(function QuickReactions({
  onReact,
  reactions,
  currentUserId,
  onOpenPicker,
  onPreloadPicker,
}: QuickReactionsProps) {
  return (
    <div className="grid grid-cols-5 max-w-70 px-1 py-1 gap-y-3">
      {quickReactions.map((emoji) => {
        const isActive = reactions.some(
          (reaction) =>
            reaction.userId === currentUserId && reaction.emoji === emoji,
        );
        return (
          <button
            key={emoji}
            type="button"
            className={`rounded-full border p-1 m-0.5 text-lg hover:bg-accent cursor-pointer ${
              isActive ? "border-primary bg-accent" : "border-transparent"
            }`}
            aria-label={`React ${emoji}`}
            aria-pressed={isActive}
            onClick={() => onReact?.(emoji)}
          >
            {emoji}
          </button>
        );
      })}
      <button
        type="button"
        className="rounded-md p-1.5 hover:bg-accent cursor-pointer flex items-center justify-center"
        aria-label="More reactions"
        onPointerEnter={onPreloadPicker}
        onFocus={onPreloadPicker}
        onClick={(event) => {
          // Prevent Radix from treating this button as a menu selection.
          event.preventDefault();
          event.stopPropagation();
          onOpenPicker();
        }}
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
});

export function MessageActions({
  children,
  onCopy,
  onReply,
  onEdit,
  onDownload,
  historyMessage,
  onDelete,
  onDeletePermanently,
  onReact,
  reactions,
  currentUserId,
  canCopy = true,
  canReply = true,
  canReact = false,
  canDeletePermanently = false,
  className,
}: MessageActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPickerOpen, setDialogPickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Mobile back button closes the reaction picker dialog without leaving the chat
  useHistoryModal(
    dialogPickerOpen,
    () => setDialogPickerOpen(false),
    "reaction-picker",
  );

  const closeMenu = useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
  }, []);

  const handleOpenPicker = useCallback(() => {
    // Close context menu without remounting trigger/children
    closeMenu();
    setDialogPickerOpen(true);
  }, [closeMenu]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onReact?.(emoji);
      setDialogPickerOpen(false);
      closeMenu();
    },
    [closeMenu, onReact],
  );

  const preloadPicker = useCallback(() => {
    void import("@/features/chat/components/input/EmojiPickerPanel");
  }, []);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className={className}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent
          side="top"
          avoidCollisions
          collisionPadding={8}
        >
          {canReact && (
            <>
              <QuickReactions
                onReact={handleEmojiSelect}
                reactions={reactions}
                currentUserId={currentUserId}
                onOpenPicker={handleOpenPicker}
                onPreloadPicker={preloadPicker}
              />
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuGroup>
            {onEdit && (
              <ContextMenuItem onSelect={onEdit}>
                <Pencil />
                Edit
              </ContextMenuItem>
            )}
            {historyMessage?.editHistory?.length ? (
              <ContextMenuItem onSelect={() => setHistoryOpen(true)}>
                <History />
                Edit history
              </ContextMenuItem>
            ) : null}
            {onDownload && (
              <ContextMenuItem
                disabled={downloading}
                onSelect={(event) => {
                  event.preventDefault();
                  setDownloading(true);
                  void onDownload()
                    .catch((error: unknown) =>
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Could not download media.",
                      ),
                    )
                    .finally(() => {
                      setDownloading(false);
                      closeMenu();
                    });
                }}
              >
                {downloading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Download />
                )}
                Download
              </ContextMenuItem>
            )}
            {canCopy && (
              <ContextMenuItem onSelect={onCopy}>
                <CopyIcon />
                Copy
              </ContextMenuItem>
            )}
            {canReply && (
              <ContextMenuItem onSelect={onReply}>
                <Reply />
                Reply
              </ContextMenuItem>
            )}
            {onDelete && (
              <ContextMenuItem variant="destructive" onSelect={onDelete}>
                <TrashIcon />
                Delete
              </ContextMenuItem>
            )}
            {canDeletePermanently && (
              <ContextMenuItem
                variant="destructive"
                onSelect={() => setDialogOpen(true)}
              >
                <TrashIcon />
                Delete permanently
              </ContextMenuItem>
            )}
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>

      {/* ── Responsive Centered Reaction Picker Dialog ── */}
      <Dialog open={dialogPickerOpen} onOpenChange={setDialogPickerOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-auto max-w-[min(350px,calc(100vw-2rem))] p-0 border-0 bg-transparent shadow-none"
        >
          <DialogTitle className="sr-only">Reaction Picker</DialogTitle>
          <DialogDescription className="sr-only">
            Choose an emoji reaction
          </DialogDescription>
          <Suspense
            fallback={
              <div className="flex h-64 w-72 items-center justify-center rounded-xl bg-popover text-sm text-muted-foreground shadow-2xl border">
                <LoaderCircle className="animate-spin mr-2 size-5" /> Loading emojis…
              </div>
            }
          >
            <EmojiPickerPanel
              onBack={() => setDialogPickerOpen(false)}
              onEmojiSelect={handleEmojiSelect}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      {historyMessage && (
        <EditHistoryDialog
          message={historyMessage}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      )}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this message permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be removed for
              everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDeletePermanently?.()}>
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
