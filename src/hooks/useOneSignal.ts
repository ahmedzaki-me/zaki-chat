import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";
import { useAuth } from "@/hooks/useAuth";

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

let initialized = false;
let lastUserId: string | null = null;

export function useOneSignal() {
  const { user } = useAuth();
  const initCalledRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (initialized && lastUserId === user.id) return;

    const initOneSignal = async () => {
      try {
        if (!initialized) {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/" },
          });
          initialized = true;
        }

        await OneSignal.login(user.id);
        
        lastUserId = user.id;
        initCalledRef.current = true;
        console.log("OneSignal is ready!");
      } catch (err) {
        console.error("OneSignal Init Error:", err);
      }
    };

    initOneSignal();
  }, [user]);

}
