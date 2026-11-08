import { MonitorSmartphone } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { Session } from "@/features/auth/types/auth.types";
import { formatSessionDate, getDeviceLabel } from "@/features/settings/utils/sessionUtils";

export function SessionItem({
  session,
  onRevoke,
}: {
  session: Session;
  onRevoke: () => void;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <MonitorSmartphone className="mt-1 size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{getDeviceLabel(session.userAgent)}</p>
              {session.isCurrent && (
                <Badge variant="secondary">This device</Badge>
              )}
            </div>
            <p className="break-all text-muted-foreground">
              IP: {session.ip ?? "Unavailable"}
            </p>
            <p className="text-muted-foreground">
              Last seen {formatSessionDate(session.lastSeenAt)}
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={onRevoke}>
          {session.isCurrent ? "Log out this device" : "Revoke"}
        </Button>
      </CardContent>
    </Card>
  );
}
