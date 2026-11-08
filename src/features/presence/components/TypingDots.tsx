export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label="Typing">
      <i className="size-1 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
      <i className="size-1 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
      <i className="size-1 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
    </span>
  );
}
