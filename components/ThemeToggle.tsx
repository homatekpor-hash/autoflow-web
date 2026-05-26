"use client";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-lg border border-ink-ghost hover:bg-ink-paper transition"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
