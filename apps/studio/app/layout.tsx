import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
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
  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${plexAr.variable}`}>
      <body><LocaleProvider locale={locale}>{children}</LocaleProvider></body>
    </html>
  );
}
