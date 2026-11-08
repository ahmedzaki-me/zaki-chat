import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { getProblemMessage } from "@/shared/lib/problemDetails";

type LogoutKind = "logout" | "logout-all";
export function LogoutSection({
  onConfirm,
  busy,
  error,
}: {
  onConfirm: (kind: LogoutKind) => Promise<void>;
  busy: boolean;
  error?: unknown;
}) {
  const [kind, setKind] = useState<LogoutKind | null>(null);
  const submit = async () => {
    if (!kind) return;
    try {
      await onConfirm(kind);
      setKind(null);
    } catch {
      /* errors are shown in the section */
    }
  };
  const all = kind === "logout-all";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign out</CardTitle>
        <CardDescription>
          End this session or sign out everywhere
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setKind("logout")}
        >
          <LogOut /> Log out
        </Button>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={() => setKind("logout-all")}
        >
          Log out of all devices
        </Button>
        {error !== undefined && error !== null && (
          <p role="alert" className="w-full text-sm text-destructive">
            {getProblemMessage(error)}
          </p>
        )}
      </CardContent>
      <AlertDialog
        open={!!kind}
        onOpenChange={(open) => {
          if (!open && !busy) setKind(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {all ? "Log out of all devices?" : "Log out?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {all
                ? "Every active session will be revoked, including this device. You will need to log in again."
                : "You will be signed out of this device."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              {busy ? "Working…" : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
