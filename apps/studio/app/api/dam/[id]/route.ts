import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/dam/[id] — single asset detail (url, renditions, alt, metadata).
// Previously missing (405); callers had to scan the list endpoint (CMP-ISS-01).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await payloadFetch(`/api/media/${id}?depth=0`);
  if (!r.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const j = await r.json().catch(() => ({}));
  return NextResponse.json(j);
}

// PATCH /api/dam/[id] — update asset metadata (alt-text / usage rights).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.alt === "string") patch.alt = body.alt.slice(0, 500);
  if (typeof body.usageRights === "string") patch.usageRights = body.usageRights.slice(0, 300);
  const r = await payloadFetch(`/api/media/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  const j = await r.json().catch(() => ({}));
  return NextResponse.json(r.ok ? { ok: true, doc: j.doc } : { error: j?.errors?.[0]?.message || "update_failed" }, { status: r.ok ? 200 : 502 });
}

// DELETE /api/dam/[id] — remove an asset (and its renditions) from the store.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await payloadFetch(`/api/media/${id}`, { method: "DELETE" });
  return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
