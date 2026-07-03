// GET /api/humain/brand-context — expose the tenant's active brand context to HUMAIN Create
// (the foundation every on-brand generation draws on). POST — receive/update brand context
// ingested inside HUMAIN Create so both surfaces stay on-brand.
import { NextResponse } from "next/server";
import { serviceFetch, authorizeService, tenantOf } from "@/lib/humain";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeService(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const tenant = tenantOf(req);
  // Active brand for the tenant (falls back to any active brand guideline).
  const r = await serviceFetch(`/api/brandGuidelines?where[isActive][equals]=true&where[tenant][equals]=${encodeURIComponent(tenant)}&limit=1&depth=0`);
  const d = await r.json().catch(() => ({}));
  const g = (d.docs || [])[0];
  if (!g) return NextResponse.json({ tenant, brand: null });
  return NextResponse.json({
    tenant,
    brand: { id: g.id, name: g.name, industry: g.industry, summary: g.summary, palette: g.data?.palette || [], sections: g.data?.sections || [], font: g.data?.font, framework: g.data?.framework },
  });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!authorizeService(req, raw)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let b: any; try { b = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const tenant = tenantOf(req);
  const payload = {
    name: String(b.name || "HUMAIN Create brand").slice(0, 120),
    industry: b.industry || "",
    summary: b.summary || "",
    tenant, // first-class tenant field
    isArchetype: false,
    isActive: b.active !== false,
    source: "ai",
    data: { kind: "brand", tenant, source: "humain-create", palette: b.palette || [], sections: b.sections || [], font: b.font, framework: b.framework },
  };
  const path = b.id ? `/api/brandGuidelines/${b.id}` : "/api/brandGuidelines";
  const r = await serviceFetch(path, { method: b.id ? "PATCH" : "POST", body: JSON.stringify(payload) });
  const d = await r.json();
  if (!r.ok) return NextResponse.json({ error: d?.errors?.[0]?.message || "brand_sync_failed" }, { status: 400 });
  return NextResponse.json({ ok: true, tenant, brandId: d?.doc?.id ?? b.id });
}
