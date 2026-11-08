import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { InstallGuideDialog } from "@/core/pwa/InstallGuideDialog";
import { useInstallPrompt } from "@/core/pwa/useInstallPrompt";

export function InstallButton() {
  const { isStandalone, attemptNavigatorInstall, promptInstall } =
    useInstallPrompt();
  const [guideOpen, setGuideOpen] = useState(false);
  const [explainNoOneClick, setExplainNoOneClick] = useState(false);

  const handleClick = async () => {
    try {
      if (await attemptNavigatorInstall()) return;
    } catch {
      setExplainNoOneClick(false);
      setGuideOpen(true);
      return;
    }

    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") return;
      setExplainNoOneClick(outcome === null);
      setGuideOpen(true);
    } catch {
      setExplainNoOneClick(false);
      setGuideOpen(true);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-9 w-9 text-muted-foreground ${isStandalone ? "invisible pointer-events-none" : ""}`}
              aria-label="Install app"
              aria-hidden={isStandalone}
              tabIndex={isStandalone ? -1 : 0}
              disabled={isStandalone}
              onClick={() => void handleClick()}
            >
              <Download className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Install app</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        explainNoOneClick={explainNoOneClick}
      />
    </>
  );
}
