"use client";
import React, { useEffect, useState } from "react";
import { PREF_KEY, THEME_EVENT, readPref, type Mode } from "@/lib/theme";

// Inline icons so this doesn't depend on the icon set.
const Sun = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
const Moon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>);
const Auto = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);

const OPTIONS: { key: Mode; label: string; Icon: () => React.ReactElement }[] = [
  { key: "light", label: "Light", Icon: Sun },
  { key: "dark", label: "Dark", Icon: Moon },
  { key: "system", label: "Auto", Icon: Auto },
];

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const [mode, setMode] = useState<Mode>("system");
  // This component owns the tri-state CHOICE only. It records it on
  // `data-theme` (for its own UI) and announces it; ThemeSync resolves it and
  // hands the answer to Foundation's ThemeProvider, which is the single writer
  // of the `light`/`dark` classes that actually flip the tokens.
  function announce(m: Mode) {
    document.documentElement.setAttribute("data-theme", m);
    window.dispatchEvent(new Event(THEME_EVENT));
  }
  useEffect(() => {
    const t = readPref();
    setMode(t);
    announce(t);
  }, []);
  function choose(m: Mode) {
    setMode(m);
    localStorage.setItem(PREF_KEY, m);
    announce(m);
  }
  if (collapsed) {
    // cycle light -> dark -> system on click when the sidebar is collapsed
    const next: Record<Mode, Mode> = { light: "dark", dark: "system", system: "light" };
    const cur = OPTIONS.find((o) => o.key === mode)!;
    return (
      <button onClick={() => choose(next[mode])} title={`Theme: ${cur.label}`} aria-label="Toggle theme"
        style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--hairline)", background: "transparent", color: "var(--ink)", display: "grid", placeItems: "center", cursor: "pointer", margin: "0 auto" }}>
        <cur.Icon />
      </button>
    );
  }
  return (
    <div role="group" aria-label="Theme" style={{ display: "flex", gap: 2, padding: 3, borderRadius: 10, border: "1px solid var(--hairline)", background: "var(--soft-bg)" }}>
      {OPTIONS.map((o) => {
        const on = mode === o.key;
        return (
          <button key={o.key} onClick={() => choose(o.key)} title={o.label} aria-pressed={on}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, height: 30, borderRadius: 7, border: "none",
              background: on ? "var(--studio-primary)" : "transparent", color: on ? "var(--primary-foreground)" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <o.Icon /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
