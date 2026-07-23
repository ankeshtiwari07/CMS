import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
// Canonical HUMAIN design system, then the legacy-name bridge, then our globals.
// Order matters: globals.css and every component read the vars these define.
import "@humain/foundation/tokens.css";
import "@humain/design-tokens/bridge.css";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n-client";
import { LOCALES, isRtl, type Locale } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HUMAIN · AI-Native Experience Platform",
  description: "Create Studio + Content Management — sovereign by design.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Per-language URL prefix wins (set by middleware); else the persisted cookie.
  const raw = (await headers()).get("x-humain-locale") || (await cookies()).get("humain-locale")?.value || "en";
  const locale = (LOCALES.find((l) => l.code === raw)?.code || "en") as Locale;
  const dir = isRtl(locale) ? "rtl" : "ltr";
  // No-flash theme init, BEFORE paint. `data-theme` keeps the user's choice
  // (light/dark/system) for the toggle UI; the resolved value is applied as
  // Foundation's `.dark` class, which is what actually flips the design tokens.
  // A media listener keeps `system` live without a reload.
  const themeScript = `(function(){var d=document.documentElement;function apply(t){d.setAttribute('data-theme',t);var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.toggle('dark',dark);}try{var t=localStorage.getItem('humain-theme')||'system';apply(t);var mq=window.matchMedia('(prefers-color-scheme: dark)');mq.addEventListener('change',function(){if((localStorage.getItem('humain-theme')||'system')==='system')apply('system');});var c=localStorage.getItem('humain-theme-colors');if(c){var o=JSON.parse(c),r=d.style,m={'--primary':o.primary,'--primary-hover':o.primaryDark,'--brand-pill':o.accent,'--foreground':o.ink,'--background':o.canvas,'--muted-foreground':o.muted,'--r-card':(o.radius||16)+'px'};for(var k in m){if(m[k])r.setProperty(k,m[k]);}}}catch(e){apply('system');}})();`;
  return (
    <html lang={locale} dir={dir} data-theme="system" className={`${inter.variable} ${plexAr.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><LocaleProvider locale={locale}>{children}</LocaleProvider></body>
    </html>
  );
}
