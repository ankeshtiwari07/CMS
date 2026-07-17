import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser, payloadFetch, hasRole } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/page?type=page|blog|post — list the current user's composed content.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type") || "";
  try {
    const qs = new URLSearchParams({ "where[createdBy][equals]": String(user.id), limit: "60", sort: "-updatedAt", depth: "0" });
    if (type) qs.set("where[contentType][equals]", type);
    else qs.set("where[contentType][not_equals]", "website");
    const res = await payloadFetch(`/api/aiwebsites?${qs.toString()}`);
    const j = await res.json();
    const items = (j.docs || []).map((d: any) => ({ id: d.id, title: d.title, slug: d.slug, contentType: d.contentType, status: d.status, blocks: Array.isArray(d.sections) ? d.sections.length : 0, updatedAt: d.updatedAt }));
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ items: [] }); }
}

// POST /api/page — generate a page/blog/post composed from the component library.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  const contentType = ["page", "blog", "post"].includes(body.contentType) ? body.contentType : "page";
  try {
    const gen = await fetch(`${AI_URL}/studio/page`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: body.prompt, contentType }) }).then((r) => r.json());
    if (!gen?.ok) return NextResponse.json(gen, { status: 502 });

    // Persist delegated components (draft, pending approval) — same as the website builder.
    const created: any[] = [];
    for (const dc of gen.delegatedComponents || []) {
      if (!dc?.html || !dc?.key) continue;
      const uniqueKey = `${String(dc.key).slice(0, 44)}-${Math.abs(hash(dc.key + dc.html)).toString(36).slice(0, 4)}`;
      try {
        const r = await payloadFetch("/api/components", { method: "POST", body: JSON.stringify({ name: dc.name, key: uniqueKey, type: dc.type, category: dc.category, description: dc.description, html: dc.html, props: dc.props || [], status: "draft", aiGenerated: true, riskTier: "low", delegatedFrom: String(body.prompt).slice(0, 100) }) });
        const j = await r.json(); if (r.ok) created.push({ id: j?.doc?.id, name: dc.name });
      } catch { /* non-fatal */ }
    }
    // Persist the composed artefact as a draft so block-level CRUD has an id.
    const slug = (String(gen.title || contentType).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || contentType) + "-" + Math.abs(hash(gen.title + Date.now())).toString(36).slice(0, 5);
    const saveRes = await payloadFetch("/api/aiwebsites", { method: "POST", body: JSON.stringify({ title: gen.title, slug, prompt: body.prompt, contentType, status: "draft", brand: gen.brand, sections: gen.blocks, html: gen.html }) });
    const saved = await saveRes.json();
    const id = saved?.doc?.id;

    const canPublish = hasRole(user, ["publisher", "siteAdmin", "admin"]);
    return NextResponse.json({
      ok: true, id, title: gen.title, slug, contentType, brand: gen.brand, blocks: gen.blocks, html: gen.html,
      delegation: { reused: (gen.usedComponents || []).map((c: any) => ({ kind: c.kind, key: c.key, name: c.name })), created, gated: !canPublish },
    });
  } catch { return NextResponse.json({ error: "generation_unavailable" }, { status: 502 }); }
}

function hash(s: string): number { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return h | 0; }
