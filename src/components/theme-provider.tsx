"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/hooks/use-theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    // Read from localStorage or fallback to OS theme setting
    const savedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme;
    
    setTheme(initialTheme);
  }, [setTheme]);

  return <>{children}</>;
}

export const themeScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('theme');
      var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : systemTheme;
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    } catch (e) {
      console.error('Failed to run immediate theme script:', e);
    }
  })();
`;
