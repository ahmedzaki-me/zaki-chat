import { Switch } from "@/shared/components/ui/switch";
import { useTheme } from "@/shared/hooks/useTheme";
import { Label } from "@/shared/components/ui/label";

export default function ModeSwitch() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <Label className="pr-3">Switch Theme</Label>
      <Switch
        id="mode"
        checked={mode === "dark"}
        onCheckedChange={(checked) => setMode(checked ? "dark" : "light")}
      />
    </div>
  );
}
