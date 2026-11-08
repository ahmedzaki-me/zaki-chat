import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";

export function OfflineBanner() {
  const { networkOnline, socketConnected } = useOnlineStatus();
  const [phase, setPhase] = useState<
    "offline" | "reconnecting" | "back-online" | null
  >(null);
  const target = !networkOnline
    ? "offline"
    : !socketConnected
      ? "reconnecting"
      : null;

  useEffect(() => {
    if (target === phase) return;
    if (!target && phase === null) return;
    const delay = target ? 400 : phase === "back-online" ? 2500 : 0;
    const timer = window.setTimeout(() => {
      setPhase(target ?? (phase === "back-online" ? null : "back-online"));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase, target]);

  const message =
    phase === "offline"
      ? "Offline, showing saved messages"
      : phase === "reconnecting"
        ? "Reconnecting…"
        : "Back online";
  return (
    <div className="h-8 shrink-0 overflow-hidden" aria-live="polite">
      <AnimatePresence>
        {phase && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            className="flex h-8 items-center justify-center bg-muted/80 px-3 text-xs text-muted-foreground"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
