import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import { COLLECTIONS } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection, id } = await params;
  if (!COLLECTIONS[collection]) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const r = await payloadFetch(`/api/${collection}/${id}?depth=0`);
  if (!r.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ doc: await r.json() });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection, id } = await params;
  if (!COLLECTIONS[collection]) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const r = await payloadFetch(`/api/${collection}/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  const j = await r.json();
  return NextResponse.json(r.ok ? { ok: true, doc: j.doc } : { error: j?.errors?.[0]?.message || j?.message || "update_failed" }, { status: r.ok ? 200 : (r.status || 400) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection, id } = await params;
  if (!COLLECTIONS[collection]) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const r = await payloadFetch(`/api/${collection}/${id}`, { method: "DELETE" });
  return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : (r.status || 502) });
}
