import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const percent = Math.max(0, Math.min(100, value ?? 0));
  return <ProgressPrimitive.Root data-slot="progress" value={percent} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)} {...props}>
    <ProgressPrimitive.Indicator data-slot="progress-indicator" className="h-full w-full flex-1 bg-primary transition-transform" style={{ transform: `translateX(-${100 - percent}%)` }} />
  </ProgressPrimitive.Root>;
}

export { Progress };
