import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser, hasRole } from "@/lib/payload";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, ["admin"])) return null;
  return user;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const res = await payloadFetch("/api/users?limit=100&depth=1&sort=email");
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  return NextResponse.json({ users: data.docs ?? [] });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const res = await payloadFetch("/api/users", { method: "POST", body: JSON.stringify(body) });
  const out = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: out?.errors?.[0]?.message || "Create failed" }, { status: res.status });
  }
  return NextResponse.json({ ok: true, doc: out.doc ?? out });
}
