import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import { AI_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await payloadFetch(`/api/aiwebsites/${id}?depth=0`);
    if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const d = await res.json();
    return NextResponse.json({ id: d.id, title: d.title, slug: d.slug, prompt: d.prompt, status: d.status, brand: d.brand, sections: Array.isArray(d.sections) ? d.sections : [], html: d.html });
  } catch { return NextResponse.json({ error: "load_failed" }, { status: 502 }); }
}

// PATCH /api/website/:id — EDIT an existing saved site with an instruction (D2).
// Loads the current site, runs the Website Builder agent's updateWebsite (edits
// only the affected sections), then persists the new sections + HTML.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const instruction = String(body?.instruction || "").trim();
  if (!instruction) return NextResponse.json({ error: "instruction is required" }, { status: 400 });
  try {
    const cur = await payloadFetch(`/api/aiwebsites/${id}?depth=0`);
    if (!cur.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const d = await cur.json();
    const res = await fetch(`${AI_URL}/studio/website/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ instruction, title: d.title, brand: d.brand || {}, sections: Array.isArray(d.sections) ? d.sections : [], model: body.model }),
    });
    const gen = await res.json();
    if (!res.ok) return NextResponse.json(gen, { status: 502 });
    const save = await payloadFetch(`/api/aiwebsites/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sections: gen.sections, html: gen.html }),
    });
    const saved = await save.json().catch(() => ({}));
    return NextResponse.json({ ok: save.ok, id, title: gen.title, sections: gen.sections, html: gen.html, changed: gen.changed, ops: gen.ops, brandCheck: gen.brandCheck, status: saved?.doc?.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "update_failed" }, { status: 502 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await payloadFetch(`/api/aiwebsites/${id}`, { method: "DELETE" });
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
  } catch { return NextResponse.json({ error: "delete_failed" }, { status: 502 }); }
}
