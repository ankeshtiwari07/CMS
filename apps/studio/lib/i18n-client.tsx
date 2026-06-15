"use client";
import { createContext, useContext } from "react";
import { DICT, type Locale } from "./i18n";

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
    const e = DICT[key];
    return e ? e[locale] || e.en : key;
  };
}

// Persist the choice and reload so server components re-read the cookie.
export function setLocale(locale: Locale) {
  document.cookie = `humain-locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  window.location.reload();
}

// English / العربية toggle used in the sidebar user menu.
export function LanguageSwitcher() {
  const locale = useLocale();
  const opt = (l: Locale, label: string): React.CSSProperties => ({
    flex: 1, padding: "6px 0", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 700,
    background: locale === l ? "var(--studio-primary)" : "transparent",
    color: locale === l ? "#fff" : "var(--ink)",
  });
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--mint-pill)", borderRadius: 9, padding: 3, margin: "2px 2px 4px" }}>
      <button onClick={() => locale !== "en" && setLocale("en")} style={opt("en", "English")}>English</button>
      <button onClick={() => locale !== "ar" && setLocale("ar")} style={opt("ar", "العربية")}>العربية</button>
    </div>
  );
}
