// POST /api/humain/generations — ingest a HUMAIN Create generation (deck/image/email/brand…)
// into the tenant's CMS library (Projects). GET — list the tenant's library.
import { NextResponse } from "next/server";
import { serviceFetch, authorizeService, tenantOf } from "@/lib/humain";
import { emitEvent } from "@/lib/webhooks";

export const dynamic = "force-dynamic";
const TYPES = ["deck", "image", "email", "brand", "website", "content", "video", "social"];

export async function POST(req: Request) {
  const raw = await req.text();
  if (!authorizeService(req, raw)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let b: any; try { b = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const tenant = tenantOf(req);
  const type = TYPES.includes(b.type) ? b.type : "content";
  const doc = {
    title: String(b.title || "HUMAIN Create generation").slice(0, 200),
    type,
    tenant, // first-class tenant field
    prompt: b.prompt || "",
    model: b.model || "humain-gateway",
    options: { ...(b.options || {}), tenant, source: "humain-create", externalId: b.id ?? null },
    asset: b.asset ?? b.output ?? {}, // deck html / image url / email body / brand json
    status: "ready",
  };
  const r = await serviceFetch("/api/projects", { method: "POST", body: JSON.stringify(doc) });
  const d = await r.json();
  if (!r.ok) return NextResponse.json({ error: d?.errors?.[0]?.message || "ingest_failed" }, { status: 400 });
  const libraryId = d?.doc?.id;
  await emitEvent({ type: "generation.ingested", tenant, collection: "projects", id: libraryId, at: new Date().toISOString(), data: { type, externalId: b.id ?? null } });
  return NextResponse.json({ ok: true, libraryId, tenant, type });
}

export async function GET(req: Request) {
  if (!authorizeService(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const tenant = tenantOf(req);
  const r = await serviceFetch(`/api/projects?where[tenant][equals]=${encodeURIComponent(tenant)}&sort=-createdAt&limit=50&depth=0`);
  const d = await r.json().catch(() => ({}));
  return NextResponse.json({ tenant, items: (d.docs || []).map((x: any) => ({ id: x.id, title: x.title, type: x.type, status: x.status, createdAt: x.createdAt })) });
}
