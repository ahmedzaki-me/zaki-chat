import { useEffect, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<string>(
    () => localStorage.getItem("mode") || "light",
  );

  useEffect(() => {
    // const metaTheme = document.querySelector('meta[name="theme-color"]');
    // const isDark = mode === "dark";
    // if (metaTheme) {
    //   metaTheme.setAttribute("content", isDark ? "#0f0f0f" : "#ffffff");
    // }
    const isDark = mode === "dark";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.setAttribute(
        "content",
        isDark ? "oklch(0.21 0.006 285.885)" : "oklch(1 0 0)",
      );

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
    localStorage.setItem("mode", mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
