import { Switch } from "@/shared/components/ui/switch";
import { usePushSubscription } from "@/features/notifications/hooks/usePushSubscription";

export function NotificationToggleRow() {
  const { state, busy, toggle } = usePushSubscription();
  const disabled =
    busy ||
    [
      "unsupported",
      "needs-install",
      "server-disabled",
      "permission-denied",
    ].includes(state);
  const hint =
    state === "needs-install"
      ? "Install the app to your home screen first"
      : state === "permission-denied"
        ? "Blocked in browser settings"
        : state === "server-disabled"
          ? "Currently unavailable"
          : state === "unsupported"
            ? "Not supported on this browser"
            : null;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">Notifications</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {busy && (
          <p className="text-xs text-muted-foreground" role="status">
            Updating…
          </p>
        )}
      </div>
      <Switch
        aria-label="Toggle notifications"
        checked={state === "on"}
        disabled={disabled}
        onCheckedChange={(checked) => void toggle(checked)}
      />
    </div>
  );
}
