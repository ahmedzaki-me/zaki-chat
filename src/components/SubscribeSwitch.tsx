import { useState, useEffect } from "react";
import OneSignal from "react-onesignal";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

export default function SubscribeSwitch() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = () => {
      try {
        const optedIn = OneSignal.User?.PushSubscription?.optedIn ?? false;
        const hasExternalId = !!OneSignal.User?.externalId;
        setIsSubscribed(optedIn && hasExternalId);
      } catch (err) {
        console.error("Error checking OneSignal status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    const handleSubscriptionChange = (event: {
      current: { optedIn: boolean };
    }) => {
      setIsSubscribed(event.current.optedIn);
    };

    OneSignal.User.PushSubscription.addEventListener(
      "change",
      handleSubscriptionChange,
    );

    return () => {
      OneSignal.User.PushSubscription.removeEventListener(
        "change",
        handleSubscriptionChange,
      );
    };
  }, []);

  const handleToggle = async (checked: boolean) => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (checked) {
        const granted = await OneSignal.Notifications.requestPermission();
        if (!granted) {
          setIsLoading(false);
          return; 
        }
        await OneSignal.User.PushSubscription.optIn();
        setIsSubscribed(true);
      } 

      else {
        await OneSignal.User.PushSubscription.optOut();
        await OneSignal.logout();
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <Label
        htmlFor="notifications-mode"
        className={`leading-none ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
      >
        Subscribe
      </Label>
      <Switch
        id="notifications-mode"
        className="cursor-pointer"
        checked={isSubscribed}
        disabled={isLoading}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}
