import { RouterProvider } from "react-router";
import { router } from "@/core/router/routes";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { SocketProvider } from "@/features/presence/context/SocketProvider";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  APP_BOOT_TIME,
  invalidateStaleChatQueries,
  queryClient,
} from "@/core/query/queryClient";
import { queryPersister } from "@/core/query/queryPersister";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/shared/context/ThemeProvider";
import { useEffect } from "react";
import { Toaster } from "@/shared/components/ui/sonner";
import { PwaUpdatePrompt } from "@/core/pwa/PwaUpdatePrompt";
import { AppPushEffects } from "@/features/notifications/components/AppPushEffects";
import "@/core/pwa/installPromptStore";

function App() {
  useEffect(() => {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;

    const unlock = (): void => {
      const ctx = new AudioCtx();
      void ctx.resume().then(() => ctx.close());
    };

    document.addEventListener("click", unlock, { once: true });
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      onSuccess={() => invalidateStaleChatQueries(queryClient, APP_BOOT_TIME)}
      persistOptions={{
        persister: queryPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        buster: `zaki-chat-${import.meta.env.VITE_APP_VERSION ?? "0.0.0"}`,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" &&
            (query.queryKey[0] === "conversations" || query.queryKey[0] === "messages"),
        },
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <RouterProvider router={router} />
            <AppPushEffects />
            <PwaUpdatePrompt />
            <Toaster position="top-center" richColors closeButton />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </PersistQueryClientProvider>
  );
}

export default App;
