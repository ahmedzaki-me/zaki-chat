import { useState } from "react";
import { Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/components/ui/alert-dialog";
import { SessionItem } from "@/features/settings/components/SessionItem";
import { getSessions } from "@/features/auth/api/auth.service";
import type { Session } from "@/features/auth/types/auth.types";
import { getProblemMessage } from "@/shared/lib/problemDetails";

export function SessionsSection({ onRevoke, busy, actionError }: { onRevoke: (session: Session) => Promise<void>; busy: boolean; actionError?: unknown }) {
  const sessions = useQuery({ queryKey: ["auth", "sessions"], queryFn: getSessions });
  const [target, setTarget] = useState<Session | null>(null);
  const confirm = async () => { if (!target) return; try { await onRevoke(target); setTarget(null); } catch { /* errors are shown in the section */ } };
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-4" /> Sessions</CardTitle><CardDescription>Devices that can access your account</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {sessions.isPending ? <>{[1, 2].map((item) => <Skeleton key={item} className="h-24 w-full" />)}</> : sessions.isError ? <div className="space-y-3"><p role="alert" className="text-sm text-destructive">{getProblemMessage(sessions.error)}</p><Button variant="outline" onClick={() => void sessions.refetch()}>Retry sessions</Button></div> : sessions.data.sessions.length === 0 ? <p className="text-sm text-muted-foreground">No active sessions found.</p> : sessions.data.sessions.map((session) => <SessionItem key={session.id} session={session} onRevoke={() => setTarget(session)} />)}
      {actionError !== undefined && actionError !== null && <p role="alert" className="text-sm text-destructive">{getProblemMessage(actionError)}</p>}
    </CardContent>
    <AlertDialog open={!!target} onOpenChange={(open) => { if (!open && !busy) setTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{target?.isCurrent ? "Log out this device?" : "Revoke this session?"}</AlertDialogTitle><AlertDialogDescription>This device will be signed out and will no longer have access to your account.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void confirm(); }}>{busy ? "Working…" : "Continue"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </Card>;
}
