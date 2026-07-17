import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/website/publish — create/update an aiwebsites doc, return its live path.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const slug = String(body?.slug || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || `site-${Date.now().toString(36)}`;
  const doc = {
    title: String(body?.title || "Untitled Site").slice(0, 140),
    slug,
    prompt: body?.prompt ? String(body.prompt).slice(0, 6000) : undefined,
    status: body?.status === "published" ? "published" : body?.status === "in-review" ? "in-review" : "draft",
    brand: body?.brand ?? undefined,
    sections: Array.isArray(body?.sections) ? body.sections : [],
    html: typeof body?.html === "string" ? body.html : "",
  };
  try {
    const isUpdate = Boolean(body?.id);
    const res = await payloadFetch(isUpdate ? `/api/aiwebsites/${body.id}` : "/api/aiwebsites", {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(doc),
    });
    const j = await res.json();
    if (!res.ok) return NextResponse.json({ error: j?.errors?.[0]?.message || "save_failed" }, { status: 502 });
    const siteId = j?.doc?.id ?? body?.id;
    // Record it in Projects (as a WEBSITE artifact) so it appears on the Projects page.
    if (!isUpdate) {
      try {
        await payloadFetch("/api/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: doc.title,
            type: "website",
            prompt: doc.prompt,
            status: doc.status === "published" ? "ready" : "draft",
            asset: { siteId, slug, path: `/site/${slug}`, sectionCount: Array.isArray(doc.sections) ? doc.sections.length : 0 },
            owner: user.id,
          }),
        });
      } catch { /* non-fatal */ }
    }
    const base = process.env.WEB_PUBLIC_URL || "";
    return NextResponse.json({ id: siteId, slug, path: `/site/${slug}`, url: base ? `${base}/site/${slug}` : undefined, ok: true });
  } catch { return NextResponse.json({ error: "save_unavailable" }, { status: 502 }); }
}
