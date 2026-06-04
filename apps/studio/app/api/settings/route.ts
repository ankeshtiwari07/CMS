import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser, hasRole } from "@/lib/payload";

export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await payloadFetch("/api/globals/settings?depth=0");
  const data = res.ok ? await res.json() : {};
  return NextResponse.json({ settings: data });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, ["publisher", "admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const res = await payloadFetch("/api/globals/settings", { method: "POST", body: JSON.stringify(body) });
  const out = await res.json();
  if (!res.ok) return NextResponse.json({ error: out?.errors?.[0]?.message || "Save failed" }, { status: res.status });
  return NextResponse.json({ ok: true });
}
