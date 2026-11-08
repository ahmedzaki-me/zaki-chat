import { formatDuration } from "@/shared/lib/date";

type Props = { values: number[]; progress?: number; className?: string };

export function VoiceWaveform({ values, progress = 0, className }: Props) {
  const bars = values.length ? values : Array.from({ length: 48 }, () => 8);
  return (
    <div
      className={`flex h-9 min-w-0 flex-1 items-center gap-[2px] ${className ?? ""}`}
      aria-hidden="true"
    >
      {bars.map((value, index) => (
        <span
          key={index}
          className={`min-w-0 flex-1 rounded-full ${index / bars.length <= progress ? "bg-primary" : "bg-muted-foreground/35"}`}
          style={{ height: `${Math.max(10, Math.min(100, value))}%` }}
        />
      ))}
    </div>
  );
}

export const formatVoiceTime = formatDuration;
