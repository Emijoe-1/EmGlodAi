"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-9 w-16 items-center rounded-full border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-1 transition-colors"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-violet text-white transition-transform duration-300 ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
    </button>
  );
}
