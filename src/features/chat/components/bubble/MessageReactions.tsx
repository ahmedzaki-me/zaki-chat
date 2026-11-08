import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { Reaction } from "@/features/chat/types/chat.types";
import { groupReactions } from "@/features/chat/utils/chat.utils";

interface MessageReactionsProps {
  reactions: Reaction[];
  messageId: string;
  currentUserId?: string;
  isOwner?: boolean;
  otherName?: string;
  onReact?: (id: string, emoji: string) => void;
}

export function MessageReactions({
  reactions,
  messageId,
  currentUserId,
  isOwner = false,
  otherName,
  onReact,
}: MessageReactionsProps) {
  if (!reactions.length) return null;

  return (
    <TooltipProvider>
      <div className="mt-1 flex flex-wrap gap-1">
        {groupReactions(reactions, currentUserId).map((group) => (
          <Tooltip key={group.emoji}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onReact?.(messageId, group.emoji)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs transition-colors cursor-pointer",
                  group.active
                    ? "border-primary bg-primary/15"
                    : "border-border bg-background/40 hover:bg-background/60",
                )}
              >
                {group.emoji}
                {group.count > 1 && ` ${group.count}`}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {group.userIds
                .map((id) =>
                  id === currentUserId
                    ? "You"
                    : isOwner
                      ? otherName || "User"
                      : otherName || "Owner",
                )
                .join(", ")}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
