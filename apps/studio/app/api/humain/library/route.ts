// GET /api/humain/library — expose the tenant's published CMS content back to HUMAIN Create,
// so its agents can reuse approved, on-brand assets. Read-only, service-authenticated.
import { NextResponse } from "next/server";
import { serviceFetch, authorizeService, tenantOf } from "@/lib/humain";

export const dynamic = "force-dynamic";
const COLLECTIONS = ["articles", "blogPosts", "pressReleases", "events", "caseStudies", "faqs", "products"];

export async function GET(req: Request) {
  if (!authorizeService(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const tenant = tenantOf(req);
  const url = new URL(req.url);
  const only = url.searchParams.get("collection");
  const cols = only && COLLECTIONS.includes(only) ? [only] : COLLECTIONS;
  const out: any[] = [];
  await Promise.all(cols.map(async (c) => {
    const r = await serviceFetch(`/api/${c}?where[_status][equals]=published&where[tenant][equals]=${encodeURIComponent(tenant)}&sort=-updatedAt&limit=25&depth=0`);
    const d = await r.json().catch(() => ({}));
    for (const doc of d.docs || []) out.push({ collection: c, id: doc.id, title: doc.title, updatedAt: doc.updatedAt, aiGenerated: !!doc.aiGenerated });
  }));
  return NextResponse.json({ tenant, count: out.length, items: out });
}
