import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

function detectPlatform(): "android" | "iphone" | "desktop" {
  if (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
    return "iphone";
  return /Android/i.test(navigator.userAgent) ? "android" : "desktop";
}

export function InstallGuideDialog({
  open,
  onOpenChange,
  explainNoOneClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  explainNoOneClick: boolean;
}) {
  const [platform] = useState(detectPlatform);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Zaki Chat</DialogTitle>
          {explainNoOneClick && (
            <p className="text-xs text-muted-foreground">
              This browser does not allow one-click install, so use the steps
              below.
            </p>
          )}
          <DialogDescription>
            Follow these steps to add the app to your device.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={platform}>
          <TabsList>
            <TabsTrigger value="android">Android</TabsTrigger>
            <TabsTrigger value="iphone">iPhone</TabsTrigger>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
          </TabsList>
          <TabsContent value="android">
            <ol className="list-decimal space-y-2 pl-5">
              <li>In Chrome, open the three-dot menu.</li>
              <li>Choose “Install app” or “Add to Home screen.”</li>
              <li>Tap “Install.”</li>
            </ol>
          </TabsContent>
          <TabsContent value="iphone">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open this page in Safari, not an in-app browser.</li>
              <li>Tap the Share button.</li>
              <li>Choose “Add to Home Screen,” then tap “Add.”</li>
            </ol>
          </TabsContent>
          <TabsContent value="desktop">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                In Chrome or Edge, click the install icon at the right of the
                address bar.
              </li>
              <li>Or open the browser menu.</li>
              <li>Choose “Install Zaki Chat.”</li>
            </ol>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
