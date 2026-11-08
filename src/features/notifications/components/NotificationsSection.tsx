import { Bell } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { usePushSubscription } from "@/features/notifications/hooks/usePushSubscription";

export function NotificationsSection() {
  const { state, busy, toggle, promptInstall } = usePushSubscription();
  const on = state === "on";
  const disabled =
    busy ||
    [
      "unsupported",
      "needs-install",
      "server-disabled",
      "permission-denied",
    ].includes(state);
  const message =
    state === "needs-install"
      ? "Install the app first (Share > Add to Home Screen) to enable notifications"
      : state === "server-disabled"
        ? "Push notifications are currently unavailable."
        : state === "permission-denied"
          ? "Allow notifications in your browser settings to turn this on."
          : state === "unsupported"
            ? import.meta.env.PROD
              ? "This browser does not support push notifications."
              : "Notifications are available in the production build."
            : "Get notified about messages when Zaki Chat is not in view.";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-4" />
          Notifications
        </CardTitle>
        <CardDescription>
          Choose whether this device can receive push notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{message}</p>
          {state === "needs-install" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void promptInstall()}
            >
              Install app
            </Button>
          )}
        </div>
        <Switch
          aria-label="Push notifications"
          checked={on}
          disabled={disabled}
          onCheckedChange={(checked) => void toggle(checked)}
        />
      </CardContent>
    </Card>
  );
}
