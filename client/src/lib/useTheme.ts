import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
type ThemeChoice = Theme | "system";

const STORAGE_KEY = "sr-theme";

function readChoice(): ThemeChoice {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

/** Resolved light/dark theme plus a toggle. The choice persists in
 *  localStorage; with no stored choice we follow the OS (`prefers-color-scheme`). */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readChoice());

  // Keep the <html> attribute in sync with the current choice.
  useEffect(() => {
    apply(choice);
    if (choice === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, choice);
  }, [choice]);

  const resolved: Theme = choice === "system" ? systemTheme() : choice;

  function toggle() {
    setChoice(resolved === "dark" ? "light" : "dark");
  }

  return { theme: resolved, toggle };
}
