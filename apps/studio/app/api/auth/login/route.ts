import { NextResponse } from "next/server";
import { CMS_URL, TOKEN_COOKIE } from "@/lib/env";

const MAX_AGE = 60 * 60 * 8; // 8h, matches Payload tokenExpiration

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const res = await fetch(`${CMS_URL}/api/users/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const data = await res.json();
  if (!data?.token) {
    return NextResponse.json({ error: "Login failed" }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: { email: data.user?.email, roles: data.user?.roles ?? [] },
  });
  response.cookies.set(TOKEN_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return response;
}
