import { useCallback, useEffect, useState } from "react";
import { HardDrive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/components/ui/alert-dialog";
import { getUsage, clearAll, type MediaCacheUsage } from "@/features/chat/cache/mediaCache";

type BrowserStorageEstimate = { usage?: number; quota?: number };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function StorageSection() {
  const [usage, setUsage] = useState<MediaCacheUsage>({ count: 0, totalBytes: 0 });
  const [estimate, setEstimate] = useState<BrowserStorageEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const currentUsage = await getUsage();
    setUsage(currentUsage);
    try {
      setEstimate(await navigator.storage?.estimate?.() ?? null);
    } catch {
      setEstimate(null);
      setError("Browser storage details are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const clearStoredMedia = async () => {
    setClearing(true);
    try {
      const cleared = await clearAll();
      if (!cleared) throw new Error("Storage is unavailable.");
      setOpen(false);
      toast.success("Downloaded media cleared from this device.");
      await refresh();
    } catch {
      setError("Could not clear stored media. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><HardDrive className="size-4" />Storage</CardTitle>
        <CardDescription>Downloaded photos and videos saved on this device</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
        ) : (
          <>
            <p className="text-sm">{usage.count} {usage.count === 1 ? "media file" : "media files"} · {formatBytes(usage.totalBytes)}</p>
            {estimate && <p className="text-xs text-muted-foreground">Browser storage: {formatBytes(estimate.usage ?? 0)} used of {estimate.quota ? formatBytes(estimate.quota) : "unknown quota"}</p>}
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
            <Button type="button" variant="outline" disabled={!usage.count || clearing} onClick={() => setOpen(true)}>
              <Trash2 /> Clear stored media
            </Button>
          </>
        )}
      </CardContent>
      <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!clearing) setOpen(nextOpen); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear stored media?</AlertDialogTitle>
            <AlertDialogDescription>Downloaded photos and videos will be removed from this device. You can download them again from the chat.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={clearing} onClick={(event) => { event.preventDefault(); void clearStoredMedia(); }}>
              {clearing ? "Clearing…" : "Clear media"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
