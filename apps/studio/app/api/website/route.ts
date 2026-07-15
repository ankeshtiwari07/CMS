import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

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

// POST /api/website — generate the full site.
export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  try {
    const res = await fetch(`${AI_URL}/studio/website`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return NextResponse.json(await res.json(), { status: res.ok ? 200 : 502 });
  } catch { return NextResponse.json({ error: "generation_unavailable" }, { status: 502 }); }
}
