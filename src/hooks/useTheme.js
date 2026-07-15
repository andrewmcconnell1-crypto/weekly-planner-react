import { useEffect, useState } from "react";

// Theme preference: "light" | "dark" | "system". Stored per-device in
// localStorage (appearance isn't account data), applied as a data-theme
// attribute on <html> that the dark palette in App.css keys off. An inline
// script in index.html sets the same attribute before paint to avoid a flash.
const STORAGE_KEY = "theme";

function prefersDark() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolved(theme) {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return prefersDark() ? "dark" : "light";
}

function apply(theme) {
  document.documentElement.setAttribute("data-theme", resolved(theme));
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      // New visitors default to dark; picking Light or System from Settings
      // overrides it (and persists), so the toggle stays fully in control.
      return localStorage.getItem(STORAGE_KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  // Apply on change (DOM write only — no state update in the effect).
  useEffect(() => {
    apply(theme);
  }, [theme]);

  // While on "system", follow OS changes live.
  useEffect(() => {
    if (theme !== "system" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply("system");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(next) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable — the choice just won't persist.
    }
    setThemeState(next);
  }

  return { theme, setTheme };
}
