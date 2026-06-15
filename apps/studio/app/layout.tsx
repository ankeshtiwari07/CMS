import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n-client";

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
  const locale = (await cookies()).get("humain-locale")?.value === "ar" ? "ar" : "en";
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${plexAr.variable}`}>
      <body><LocaleProvider locale={locale}>{children}</LocaleProvider></body>
    </html>
  );
}
