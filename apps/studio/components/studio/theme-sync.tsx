"use client";
import { useEffect } from "react";
import { ThemeProvider, useTheme } from "@humain/ui";
import { PREF_KEY, RESOLVED_KEY, THEME_EVENT, readPref, resolveMode, type Resolved } from "@/lib/theme";

/**
 * Keeps Foundation's ThemeProvider in step with the app's tri-state preference.
 *
 * ThemeProvider is the only thing that writes the `light`/`dark` classes; this
 * component's whole job is to tell it what the resolved answer is whenever the
 * user's choice changes, or the OS flips while the choice is "system".
 */
function ThemeSync() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const sync = () => {
      const next: Resolved = resolveMode(readPref());
      if (next !== theme) setTheme(next);
    };
    sync();

    // In-tab: the toggle dispatches this after writing PREF_KEY.
    window.addEventListener(THEME_EVENT, sync);
    // Cross-tab: another tab changed the preference.
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREF_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    // OS-level change, only meaningful while the choice is "system".
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);

    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener("storage", onStorage);
      mq.removeEventListener("change", sync);
    };
  }, [theme, setTheme]);

  return null;
}

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  // storageKey is the RESOLVED key, never the tri-state one — see lib/theme.ts.
  // defaultTheme only applies before the pre-paint script has seeded the key.
  return (
    <ThemeProvider storageKey={RESOLVED_KEY} defaultTheme="light">
      <ThemeSync />
      {children}
    </ThemeProvider>
  );
}
