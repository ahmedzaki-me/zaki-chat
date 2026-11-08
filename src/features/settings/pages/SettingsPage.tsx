import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { socket } from "@/core/socket/socket";
import {
  logout,
  logoutAll,
  revokeSession,

} from "@/features/auth/api/auth.service";
import type { Session } from "@/features/auth/types/auth.types";
import { getProblemMessage } from "@/shared/lib/problemDetails";
import { toast } from "sonner";
import { ProfileSection } from "@/features/settings/components/ProfileSection";
import { SessionsSection } from "@/features/settings/components/SessionsSection";
import { LogoutSection } from "@/features/settings/components/LogoutSection";
import { StorageSection } from "@/features/settings/components/StorageSection";
import { NotificationsSection } from "@/features/notifications/components/NotificationsSection";
import { removeLocalPushSubscription } from "@/features/notifications/api/push.service";

type Action =
  | { kind: "logout" }
  | { kind: "logout-all" }
  | { kind: "revoke"; session: Session };
const sessionsKey = ["auth", "sessions"] as const;

export default function SettingsPage() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [lastAction, setLastAction] = useState<Action["kind"] | null>(null);
  const finishLogout = () => {
    socket.disconnect();
    clearAuth();
    navigate("/auth/login", { replace: true });
  };
  const action = useMutation({
    mutationFn: async (request: Action) => {
      if (request.kind === "logout") {
        try {
          await removeLocalPushSubscription(user?.id);
          await logout();
        } catch (error) {
          toast.error(getProblemMessage(error));
        } finally {
          finishLogout();
        }
        return;
      }
      if (request.kind === "logout-all") {
        await removeLocalPushSubscription(user?.id);
        await logoutAll();
        finishLogout();
        return;
      }
      if (request.session.isCurrent) await removeLocalPushSubscription(user?.id);
      await revokeSession(request.session.id);
      if (request.session.isCurrent) finishLogout();
      else await client.invalidateQueries({ queryKey: sessionsKey });
    },
  });
  const run = (request: Action) => {
    setLastAction(request.kind);
    action.reset();
    return action.mutateAsync(request);
  };
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-5 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="max-md:not-dark:text-white/90 hover:bg-black/50"
          onClick={() =>
            navigate(user?.role === "owner" ? "/owner" : "/chat-with-zaki")
          }
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-xl font-semibold max-md:not-dark:text-white/90">
            Settings
          </h1>
          <p className="text-sm max-md:not-dark:text-white/90">
            Account and active sessions
          </p>
        </div>
      </header>
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <ProfileSection />
          <NotificationsSection />
          <StorageSection />
          <LogoutSection
            onConfirm={(kind) => run({ kind })}
            busy={action.isPending}
            error={
              action.isError && lastAction === "logout-all"
                ? action.error
                : undefined
            }
          />
        </div>
        <SessionsSection
          onRevoke={(session) => run({ kind: "revoke", session })}
          busy={action.isPending}
          actionError={
            action.isError && lastAction === "revoke" ? action.error : undefined
          }
        />
      </div>
      {action.isError && !user && (
        <p role="alert" className="text-sm text-destructive">
          {getProblemMessage(action.error)}
        </p>
      )}
    </main>
  );
}
