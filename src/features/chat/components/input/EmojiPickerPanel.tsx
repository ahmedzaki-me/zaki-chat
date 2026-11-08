import { memo, useCallback, type ComponentProps } from "react";
import { ArrowLeft } from "lucide-react";
import {
  EmojiPicker,
  defaultEmojiDataResolver,
  type EmojiDataResolver,
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
} from "frimousse";
import { isEmojiAllowed } from "@/features/chat/utils/emojiPolicy";

interface EmojiPickerPanelProps {
  onBack: () => void;
  onEmojiSelect: (emoji: string) => void;
}

const EmojiRow = (props: EmojiPickerListRowProps) => (
  <div {...props} className="grid grid-cols-8 gap-1" />
);

const EmojiCategoryHeader = ({
  category,
  ...props
}: EmojiPickerListCategoryHeaderProps) => (
  <div
    {...props}
    className="bg-popover px-1 py-1.5 text-xs font-medium text-muted-foreground"
  >
    {category.label}
  </div>
);

const EmojiButton = ({ emoji, ...props }: EmojiPickerListEmojiProps) => (
  <button
    {...props}
    type="button"
    title={emoji.label}
    className="flex size-8 items-center justify-center rounded-md text-xl hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
  >
    {emoji.emoji}
  </button>
);

const listComponents = {
  Row: EmojiRow,
  CategoryHeader: EmojiCategoryHeader,
  Emoji: EmojiButton,
};

const resolveAllowedEmojiData: EmojiDataResolver = async (locale, options) => {
  const data = await defaultEmojiDataResolver(locale, options);
  return {
    ...data,
    emojis: data.emojis.filter(({ emoji }) => isEmojiAllowed(emoji)),
  };
};

function EmojiPickerPanelComponent({
  onBack,
  onEmojiSelect,
}: EmojiPickerPanelProps) {
  const handleSelect = useCallback(
    (emoji: { emoji: string }) => onEmojiSelect(emoji.emoji),
    [onEmojiSelect],
  );
  const handleKeyDown: ComponentProps<"div">["onKeyDown"] = (event) => {
    if (event.key === "Escape") {
      // Keep Escape inside the context menu while returning to its reaction row.
      event.preventDefault();
      event.stopPropagation();
      onBack();
    }
  };

  return (
    <EmojiPicker.Root
      skinTone="light"
      onEmojiSelect={handleSelect}
      resolveEmojiData={resolveAllowedEmojiData}
    >
      <div
        className="max-w-80 rounded-md border bg-popover p-2 text-popover-foreground"
        onKeyDown={handleKeyDown}
      >
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-accent"
            aria-label="Back to quick reactions"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
          </button>
          <EmojiPicker.Search
            autoFocus
            placeholder="Search emoji…"
            className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <EmojiPicker.SkinToneSelector className="rounded-md p-1.5 hover:bg-accent" />
        </div>
        <EmojiPicker.Viewport className="h-64 overflow-y-auto">
          <EmojiPicker.Loading className="block py-4 text-center text-sm text-muted-foreground">
            Loading…
          </EmojiPicker.Loading>
          <EmojiPicker.Empty className="block py-4 text-center text-sm text-muted-foreground">
            No emoji found.
          </EmojiPicker.Empty>
          <EmojiPicker.List components={listComponents} />
        </EmojiPicker.Viewport>
      </div>
    </EmojiPicker.Root>
  );
}

const EmojiPickerPanel = memo(EmojiPickerPanelComponent);

export default EmojiPickerPanel;
