import { CopyIcon, TrashIcon, Reply } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { ReactNode } from "react";

interface MessageActionsProps {
  children: ReactNode;
  onCopy: () => void;
  onReply: () => void;
  onDelete?: () => void;
  className?: string;
}

export function MessageActions({
  children,
  onCopy,
  onReply,
  onDelete,
  className,
}: MessageActionsProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className={className}>{children}</ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem onSelect={onCopy}>
            <CopyIcon />
            Copy
          </ContextMenuItem>
          <ContextMenuItem onSelect={onReply}>
            <Reply />
            Reply
          </ContextMenuItem>
        </ContextMenuGroup>

        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem variant="destructive" onSelect={onDelete}>
                <TrashIcon />
                Delete
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
