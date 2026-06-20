import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/env";

const PROTECTED = ["/studio", "/cms", "/search", "/settings", "/projects", "/design", "/brand", "/review"];
// Per-language URL prefixes (e.g. /fr/studio, /ar-EG/review). Keep in sync with lib/i18n LOCALES.
const LOCALES = ["en", "ar", "ar-SA", "ar-EG", "ar-AE", "ar-MA", "ar-LB", "fr", "de", "es", "pl"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  // Strip an optional /:locale prefix; remember it so we can re-align the URL.
  let pathname = req.nextUrl.pathname;
  let locale: string | null = null;
  const seg = pathname.split("/")[1];
  if (LOCALES.includes(seg)) {
    locale = seg;
    pathname = pathname.slice(seg.length + 1) || "/";
  }
  const homeFor = locale ? `/${locale}/studio` : "/studio";

  // ---- auth (run against the locale-stripped path) ----
  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? homeFor : "/login", req.url));
  }
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL(homeFor, req.url));
  }

  // ---- locale: serve the stripped path, inject the locale (header + cookie) ----
  if (locale) {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    const headers = new Headers(req.headers);
    headers.set("x-humain-locale", locale);
    const res = NextResponse.rewrite(url, { request: { headers } });
    res.cookies.set("humain-locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals, and static files (with a dot).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
