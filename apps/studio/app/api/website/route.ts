import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser, payloadFetch, hasRole } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/website — list current user's saved sites.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const qs = new URLSearchParams({ "where[createdBy][equals]": String(user.id), limit: "60", sort: "-updatedAt", depth: "0" });
    const res = await payloadFetch(`/api/aiwebsites?${qs.toString()}`);
    const j = await res.json();
    const sites = (j.docs || []).map((d: any) => ({ id: d.id, title: d.title, slug: d.slug, status: d.status, updatedAt: d.updatedAt }));
    return NextResponse.json({ sites });
  } catch { return NextResponse.json({ sites: [] }); }
}

// POST /api/website — generate the full site. The Website Builder reuses LIVE
// library components and DELEGATES to the Component Agent for any missing ones
// (D2). We persist each delegated component into the library as a DRAFT — it
// then requires approval before it can go LIVE (Flow B / D3). Publish authorities
// may fast-track; editors' delegated components wait for a Brand Manager/Admin.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  try {
    const res = await fetch(`${AI_URL}/studio/website`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const gen = await res.json();
    if (!res.ok) return NextResponse.json(gen, { status: 502 });

    const reused: any[] = Array.isArray(gen?.usedComponents) ? gen.usedComponents : [];
    const delegated: any[] = Array.isArray(gen?.delegatedComponents) ? gen.delegatedComponents : [];
    const created: any[] = [];
    const promptTag = String(body.prompt || "").slice(0, 100);

    // Persist every delegated component into the library (draft, pending approval).
    for (const dc of delegated) {
      if (!dc?.html || !dc?.key) continue;
      const uniqueKey = `${String(dc.key).slice(0, 44)}-${Math.abs(hash(dc.key + dc.html)).toString(36).slice(0, 4)}`;
      const doc = {
        name: String(dc.name || dc.key).slice(0, 80),
        key: uniqueKey,
        type: dc.type || "section",
        category: dc.category || "content",
        description: String(dc.description || "").slice(0, 300),
        html: String(dc.html),
        props: Array.isArray(dc.props) ? dc.props : [],
        status: "draft",
        aiGenerated: true,
        riskTier: "low",
        delegatedFrom: promptTag,
      };
      try {
        const r = await payloadFetch("/api/components", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(doc) });
        const j = await r.json();
        if (r.ok) created.push({ id: j?.doc?.id, name: doc.name, key: uniqueKey, type: doc.type, status: j?.doc?.status || "draft" });
      } catch { /* non-fatal — generation still returns */ }
    }

    const canPublish = hasRole(user, ["publisher", "siteAdmin", "admin"]);
    return NextResponse.json({
      ...gen,
      delegation: {
        reused: reused.map((c) => ({ kind: c.kind, key: c.key, name: c.name, type: c.type })),
        created,
        reusedCount: reused.length,
        createdCount: created.length,
        // Editors' delegated components (and the page) enter approval; publish
        // authorities may approve/publish directly.
        pendingApproval: canPublish ? 0 : created.length,
        gated: !canPublish,
      },
    });
  } catch { return NextResponse.json({ error: "generation_unavailable" }, { status: 502 }); }
}

// Small stable string hash (djb2) → unique-ish suffix for component keys.
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h | 0;
}
