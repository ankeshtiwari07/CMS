import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser, hasRole } from "@/lib/payload";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user && hasRole(user, ["admin"]) ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const res = await payloadFetch(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  const out = await res.json();
  if (!res.ok) return NextResponse.json({ error: out?.errors?.[0]?.message || "Update failed" }, { status: res.status });
  return NextResponse.json({ ok: true, doc: out.doc ?? out });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (String(me.id) === String(id)) return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  const res = await payloadFetch(`/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json({ error: "Delete failed" }, { status: res.status });
  return NextResponse.json({ ok: true });
}
