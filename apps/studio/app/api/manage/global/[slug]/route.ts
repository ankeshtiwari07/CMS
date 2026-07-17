import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLOBALS = new Set(["navigation", "settings"]);

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  if (!GLOBALS.has(slug)) return NextResponse.json({ error: "Unknown global" }, { status: 404 });
  const r = await payloadFetch(`/api/globals/${slug}?depth=0`);
  if (!r.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ doc: await r.json() });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  if (!GLOBALS.has(slug)) return NextResponse.json({ error: "Unknown global" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const r = await payloadFetch(`/api/globals/${slug}`, { method: "POST", body: JSON.stringify(body) });
  const j = await r.json();
  return NextResponse.json(r.ok ? { ok: true, doc: j.result ?? j.doc } : { error: j?.errors?.[0]?.message || "update_failed" }, { status: r.ok ? 200 : (r.status || 400) });
}
