interface FullPageSpinnerProps {
  message?: string;
}

export function FullPageSpinner({
  message = "Loading...",
}: FullPageSpinnerProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-background">
      <div className="relative h-16 w-16">
        {/* Outer ring — CW */}
        <div className="absolute inset-0 animate-spin rounded-full border-[2.5px] border-transparent border-r-foreground border-t-foreground opacity-[0.12] [animation-duration:1.4s]" />

        {/* Inner ring — CCW */}
        <div className="absolute inset-[10px] animate-spin rounded-full border-[2.5px] border-transparent border-b-foreground border-l-foreground opacity-[0.55] [animation-direction:reverse] [animation-duration:1s]" />

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
        </div>
      </div>

      {message && (
        <p className="animate-pulse text-[13px] tracking-widest text-muted-foreground [animation-duration:1.8s]">
          {message}
        </p>
      )}
    </div>
  );
}
