import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "./context/ThemeProvider";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" richColors closeButton />{" "}
        </AuthProvider>
      </ThemeProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

export default App;
