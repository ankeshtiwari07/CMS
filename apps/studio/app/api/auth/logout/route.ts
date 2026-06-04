import { NextResponse } from "next/server";
import { CMS_URL, TOKEN_COOKIE } from "@/lib/env";
import { getToken } from "@/lib/payload";

export async function POST() {
  const token = await getToken();
  // Best-effort server-side logout (invalidates Payload session).
  if (token) {
    try {
      await fetch(`${CMS_URL}/api/users/logout`, {
        method: "POST",
        headers: { Authorization: `JWT ${token}` },
      });
    } catch {
      /* ignore */
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
