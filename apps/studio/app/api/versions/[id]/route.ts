import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/versions/:id — full snapshot (incl. html/doc) for restore & download.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await payloadFetch(`/api/contentversions/${id}?depth=0`);
    if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const d = await res.json();
    return NextResponse.json({ id: d.id, kind: d.kind, title: d.title, label: d.label, html: d.html ?? "", doc: d.doc ?? null, createdAt: d.createdAt, by: d.createdByEmail });
  } catch {
    return NextResponse.json({ error: "load_failed" }, { status: 502 });
  }
}

// DELETE /api/versions/:id — prune a snapshot. Provides the previously-missing
// delete path (ST-ISS-03). Payload enforces the collection's admin-only delete
// access via the caller's JWT, so non-admins get 403/404 from the store.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await payloadFetch(`/api/contentversions/${id}`, { method: "DELETE" });
    if (!res.ok) return NextResponse.json({ error: "delete_failed" }, { status: res.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 502 });
  }
}
