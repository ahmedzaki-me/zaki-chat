import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { Label } from "./ui/label";

export default function ModeSwitch() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <Label>Switch Theme</Label>
      <Switch
        id="mode"
        checked={mode === "dark"}
        onCheckedChange={(checked) => setMode(checked ? "dark" : "light")}
      />
    </div>
  );
}
