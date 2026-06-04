import Script from "next/script";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { getSettings } from "../../lib/cms";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-ar",
  display: "swap",
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
