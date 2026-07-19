import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Native CMS back-office — full CRUD over every Payload collection via the REST
// API (works reliably, unlike the stock /admin render behind the proxy).
// Allowlist = every real collection; blocks arbitrary proxying.
export const COLLECTIONS: Record<string, { title: string; group: string }> = {
  articles: { title: "title", group: "Content" }, blogPosts: { title: "headline", group: "Content" },
  pressReleases: { title: "headline", group: "Content" }, events: { title: "title", group: "Content" },
  products: { title: "name", group: "Content" }, caseStudies: { title: "title", group: "Content" },
  faqs: { title: "question", group: "Content" }, careers: { title: "title", group: "Content" },
  leadership: { title: "name", group: "Content" }, mediaGalleries: { title: "title", group: "Content" },
  campaignMicrosites: { title: "title", group: "Content" }, pages: { title: "title", group: "Content" }, tags: { title: "name", group: "Content" },
  components: { title: "name", group: "Building blocks" }, media: { title: "filename", group: "Building blocks" },
  aiwebsites: { title: "title", group: "Create" }, decks: { title: "title", group: "Create" }, projects: { title: "title", group: "Create" }, conversations: { title: "title", group: "Create" },
  brandGuidelines: { title: "name", group: "Studio" }, sites: { title: "name", group: "Studio" },
  approvals: { title: "summary", group: "Governance" }, auditLog: { title: "summary", group: "Governance" },
  users: { title: "email", group: "System" },
};

export async function GET(req: Request, { params }: { params: Promise<{ collection: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection } = await params;
  const cfg = COLLECTIONS[collection];
  if (!cfg) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const u = new URL(req.url);
  const page = u.searchParams.get("page") || "1";
  const q = (u.searchParams.get("q") || "").trim();
  const qs = new URLSearchParams({ limit: "25", page, depth: "0", sort: "-updatedAt" });
  if (q) qs.set(`where[${cfg.title}][like]`, q);
  try {
    const r = await payloadFetch(`/api/${collection}?${qs.toString()}`);
    const j = await r.json();
    const rows = (j.docs || []).map((d: any) => ({ id: d.id, title: String(d[cfg.title] ?? d.title ?? `#${d.id}`).slice(0, 80), status: d._status ?? d.status ?? "", updatedAt: d.updatedAt }));
    return NextResponse.json({ rows, titleField: cfg.title, page: j.page, totalPages: j.totalPages, totalDocs: j.totalDocs });
  } catch { return NextResponse.json({ rows: [], error: "list_failed" }); }
}

export async function POST(req: Request, { params }: { params: Promise<{ collection: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection } = await params;
  if (!COLLECTIONS[collection]) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const r = await payloadFetch(`/api/${collection}`, { method: "POST", body: JSON.stringify(body) });
  const j = await r.json();
  return NextResponse.json(r.ok ? { ok: true, doc: j.doc } : { error: j?.errors?.[0]?.message || "create_failed" }, { status: r.ok ? 200 : (r.status || 400) });
}
