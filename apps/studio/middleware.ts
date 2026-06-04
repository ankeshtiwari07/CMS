import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/env";

const PROTECTED = ["/studio", "/cms"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? "/studio" : "/login", req.url));
  }
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/studio", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/studio/:path*", "/cms/:path*", "/login"],
};
