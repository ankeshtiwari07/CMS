import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/page/[id] — load one composed artefact (blocks + meta).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/aiwebsites/${id}?depth=0`);
  if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const d = await res.json();
  return NextResponse.json({ id: d.id, title: d.title, slug: d.slug, contentType: d.contentType, status: d.status, brand: d.brand, blocks: Array.isArray(d.sections) ? d.sections : [], html: d.html });
}

// PATCH /api/page/[id] — save block CRUD (reorder / edit / delete / add). Re-assembles the HTML from the (edited) blocks.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const blocks = Array.isArray(body.blocks) ? body.blocks : null;
  const patch: Record<string, unknown> = {};
  if (blocks) {
    patch.sections = blocks;
    // Re-assemble the full page HTML from the current blocks (server-side, via the AI service assembler).
    try {
      const asm = await fetch(`${AI_URL}/studio/website/assemble`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: body.title || "Page", brand: body.brand || {}, sections: blocks.map((b: any) => ({ html: b.html || "" })) }) }).then((r) => r.json());
      if (asm?.html) patch.html = asm.html;
    } catch { /* keep old html if assembler down */ }
  }
  if (typeof body.title === "string") patch.title = body.title.slice(0, 140);
  if (body.status === "published" || body.status === "draft") patch.status = body.status;
  const res = await payloadFetch(`/api/aiwebsites/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  const j = await res.json();
  if (!res.ok) return NextResponse.json({ error: j?.errors?.[0]?.message || "save_failed" }, { status: res.status });
  return NextResponse.json({ ok: true, status: j?.doc?.status });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/aiwebsites/${id}`, { method: "DELETE" });
  return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
