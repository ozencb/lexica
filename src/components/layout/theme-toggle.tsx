"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

function getStoredTheme(): "light" | "dark" | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("theme") as "light" | "dark" | null;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    const resolved = stored ?? getSystemTheme();
    setTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  if (!mounted) return <div className="size-8" />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="inline-flex items-center justify-center rounded-md size-8 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  );
}
