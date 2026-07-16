import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch, getToken } from "@/lib/payload";
import { CMS_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/dam — list assets from the media collection (physically stored on the
// self-hosted S3/MinIO object store), with their renditions + metadata.
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await payloadFetch("/api/media?limit=200&depth=0&sort=-createdAt");
    const j = await r.json().catch(() => ({ docs: [] }));
    const assets = (j.docs || []).map((d: any) => ({
      id: d.id, filename: d.filename, url: d.url, mimeType: d.mimeType, filesize: d.filesize,
      width: d.width, height: d.height, alt: d.alt, usageRights: d.usageRights, aiGenerated: d.aiGenerated, createdAt: d.createdAt,
      sizes: Object.entries(d.sizes || {}).filter(([, v]: any) => v && v.url).map(([name, v]: any) => ({ name, url: v.url, width: v.width, height: v.height, filesize: v.filesize })),
    }));
    return NextResponse.json({ assets, total: j.totalDocs ?? assets.length, store: process.env.S3_BUCKET || "humain-media" });
  } catch {
    return NextResponse.json({ assets: [], total: 0 });
  }
}

// POST /api/dam — upload an asset (multipart) → stored in MinIO via the media API.
// The AI alt-text hook runs on create; renditions (thumbnail/card/hero) are auto-generated.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const token = await getToken();
    const r = await fetch(`${CMS_URL}/api/media`, { method: "POST", headers: token ? { Authorization: `JWT ${token}` } : {}, body: form as any });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: j?.errors?.[0]?.message || "upload_failed" }, { status: r.status });
    return NextResponse.json({ ok: true, doc: j.doc });
  } catch {
    return NextResponse.json({ error: "upload_unavailable" }, { status: 502 });
  }
}
