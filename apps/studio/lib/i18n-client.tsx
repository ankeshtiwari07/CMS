"use client";
import { createContext, useContext, useState } from "react";
import { DICT, LOCALES, chromeLocale, type Locale } from "./i18n";

// Locale comes from the server (RootLayout reads the humain-locale cookie) so SSR
// and client agree — no hydration flash.
const LocaleCtx = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleCtx.Provider value={locale}>{children}</LocaleCtx.Provider>;
}
export function useLocale(): Locale {
  return useContext(LocaleCtx);
}
export function useT() {
  const locale = useContext(LocaleCtx);
  return (key: string) => {
    const e = DICT[key] as Record<string, string> | undefined;
    if (!e) return key;
    return e[locale] || e[chromeLocale(locale)] || e.en || key;
  };
}

// Switch language by navigating to the per-language URL (/<locale>/<path>).
// Middleware sets the cookie + injects the locale; the whole UI re-aligns
// (chrome + RTL/LTR). Strips any existing locale prefix first.
export function setLocale(locale: Locale) {
  document.cookie = `humain-locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  const codes = LOCALES.map((l) => l.code) as string[];
  const path = window.location.pathname;
  const seg = path.split("/")[1];
  const base = codes.includes(seg) ? path.slice(seg.length + 1) || "/" : path;
  const target = base === "/" ? "/studio" : base;
  window.location.href = `/${locale}${target}${window.location.search}`;
}

// Language picker (all locales) — a compact button that opens a menu, like the
// theme/model pickers. Used in the sidebar user menu.
export function LanguageSwitcher() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];
  return (
    <div style={{ position: "relative", margin: "2px 2px 4px" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, height: 34, padding: "0 11px", borderRadius: 9, border: "1px solid var(--hairline)", background: "var(--mint-pill)", color: "var(--ink)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>🌐 {current.label}</span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, maxHeight: 280, overflowY: "auto", background: "var(--card)", border: "1px solid var(--hairline)", borderRadius: 11, boxShadow: "var(--shadow-card, 0 8px 24px rgba(0,0,0,0.12))", zIndex: 41, padding: 5 }}
          >
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => { setOpen(false); if (l.code !== locale) setLocale(l.code); }}
                dir={l.rtl ? "rtl" : "ltr"}
                style={{ width: "100%", textAlign: l.rtl ? "right" : "left", padding: "8px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: l.code === locale ? 700 : 500, background: l.code === locale ? "var(--mint-pill)" : "transparent", color: l.code === locale ? "var(--studio-teal-dark, #0A5C58)" : "var(--ink)" }}
              >
                {l.label}{l.code === locale ? "  ✓" : ""}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
