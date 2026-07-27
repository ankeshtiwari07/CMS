import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import localFont from "next/font/local";
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

// SELF-HOSTED, not next/font/google.
//
// next/font/google fetches the font files at BUILD time. The VM's Docker build
// started failing on exactly that — "Failed to fetch `Inter` from Google Fonts"
// — which fails the whole image build and blocks every deploy, even though the
// VM host itself can reach fonts.googleapis.com fine. Depending on an outbound
// fetch to build a container is fragile regardless of the cause.
//
// @humain/ui ships NO @font-face; it only references `"Inter", system-ui`, so
// the app is responsible for actually providing the face. These are the same
// Google-served woff2 files, committed under app/fonts (~192KB total).
const inter = localFont({
  src: [{ path: "./fonts/Inter-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const plexAr = localFont({
  src: [
    { path: "./fonts/PlexArabic-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/PlexArabic-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/PlexArabic-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/PlexArabic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-ar",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
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
