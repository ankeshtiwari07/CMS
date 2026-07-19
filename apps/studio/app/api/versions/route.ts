import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/versions?key=<artifactKey> — list snapshots for an artifact (metadata
// only; fetch a single version by id for its full HTML).
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ versions: [] });
  try {
    const qs = new URLSearchParams({ "where[artifactKey][equals]": key, sort: "-createdAt", limit: "50", depth: "0" });
    const res = await payloadFetch(`/api/contentversions?${qs.toString()}`);
    const j = await res.json();
    const versions = (j.docs || []).map((d: any) => ({ id: d.id, label: d.label, kind: d.kind, title: d.title, createdAt: d.createdAt, by: d.createdByEmail }));
    return NextResponse.json({ versions });
  } catch {
    return NextResponse.json({ versions: [] });
  }
}

// POST /api/versions — capture a snapshot of the current artifact.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: any = {};
  try { b = await req.json(); } catch {}
  if (!b?.key) return NextResponse.json({ error: "key is required" }, { status: 400 });
  const doc: any = {
    artifactKey: String(b.key).slice(0, 300),
    kind: String(b.kind || "html").slice(0, 40),
    title: String(b.title || "").slice(0, 200),
    label: String(b.label || "autosave").slice(0, 80),
  };
  if (typeof b.html === "string") doc.html = b.html;
  if (b.doc !== undefined) doc.doc = b.doc;
  try {
    const res = await payloadFetch(`/api/contentversions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(doc) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) return NextResponse.json({ ok: true, id: j?.doc?.id });
    // Propagate the real Payload status (e.g. 403 when a viewer lacks create
    // access) instead of masking every failure as a 502 (VERSIONS-VIEWER-502-01).
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return NextResponse.json({ ok: false, error: j?.errors?.[0]?.message || "snapshot_failed" }, { status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "snapshot_failed" }, { status: 502 });
  }
}
