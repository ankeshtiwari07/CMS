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
