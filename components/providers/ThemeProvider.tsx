"use client";

import { useEffect } from "react";

interface ThemeProviderProps {
  colorMode: string;
  accentColor: string;
  children: React.ReactNode;
}

export function ThemeProvider({
  colorMode,
  accentColor,
  children,
}: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;

    function applyMode(mode: string) {
      if (mode === "dark") {
        root.classList.add("dark");
      } else if (mode === "light") {
        root.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        if (prefersDark) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    }

    applyMode(colorMode);

    if (colorMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (event: MediaQueryListEvent) => {
        if (event.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [colorMode]);

  useEffect(() => {
    const root = document.documentElement;
    const accentMap: Record<string, string> = {
      blue: "59 130 246",
      green: "34 197 94",
      purple: "168 85 247",
      red: "239 68 68",
      amber: "245 158 11",
      rose: "244 63 94",
    };
    const rgb = accentMap[accentColor] ?? accentMap.blue;
    root.style.setProperty("--accent", rgb);
  }, [accentColor]);

  return <>{children}</>;
}
