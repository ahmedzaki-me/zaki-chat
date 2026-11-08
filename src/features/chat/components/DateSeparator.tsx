import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";

export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <Separator className="flex-1" />
      <Badge
        variant="secondary"
        className="text-[11px] font-normal px-3 py-0.5 rounded-full"
      >
        {label}
      </Badge>
      <Separator className="flex-1" />
    </div>
  );
}
