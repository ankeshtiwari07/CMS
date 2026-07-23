import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
// Canonical HUMAIN design system, then the legacy-name bridge, then our globals.
// Order matters: globals.css and every component read the vars these define.
// `styles.css` is a strict superset of `tokens.css` — same 908 token vars plus
// the `.dark` block, the component styles, and the compiled utility layer — so
// it replaces the tokens-only import rather than sitting alongside it.
import "@humain/ui/styles.css";
import "@humain/design-tokens/bridge.css";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n-client";
import { LOCALES, isRtl, type Locale } from "@/lib/i18n";
import ThemeRoot from "@/components/studio/theme-sync";
import { themeInitScript } from "@/lib/theme";

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
  // No-flash theme init, BEFORE paint. Seeds `data-theme` (the tri-state choice),
  // the resolved `light`/`dark` class, and the key ThemeProvider reads on mount.
  // See lib/theme.ts for why those are two separate keys.
  return (
    <html lang={locale} dir={dir} data-theme="system" className={`${inter.variable} ${plexAr.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript() }} /></head>
      <body>
        <ThemeRoot>
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </ThemeRoot>
      </body>
    </html>
  );
}
