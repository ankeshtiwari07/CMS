import Script from "next/script";
import localFont from "next/font/local";
import { getSettings } from "../../lib/cms";

// SELF-HOSTED, for the same reason as apps/studio: next/font/google fetches at
// BUILD time, and one unreachable request fails the whole image build. The
// Dockerfile builds cms, web, studio, ai-service and mcp-server in one RUN, so a
// font fetch in ANY of them blocks every deploy — fixing only studio left this
// one still failing.
const inter = localFont({
  src: [{ path: "../fonts/Inter-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const plexAr = localFont({
  src: [
    { path: "../fonts/PlexArabic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/PlexArabic-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/PlexArabic-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/PlexArabic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-ar",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw === "ar" ? "ar" : "en";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const settings = await getSettings(locale);
  const ga4 = settings?.analytics?.ga4MeasurementId as string | undefined;
  const gtm = settings?.analytics?.gtmContainerId as string | undefined;

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${plexAr.variable}`}>
      <body>
        {children}
        {ga4 && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`}
            </Script>
          </>
        )}
        {gtm && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
          </Script>
        )}
      </body>
    </html>
  );
}
