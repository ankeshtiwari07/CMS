import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/deck — list the current user's saved decks.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const qs = new URLSearchParams({
      "where[createdBy][equals]": String(user.id),
      limit: "60",
      sort: "-updatedAt",
      depth: "0",
    });
    const res = await payloadFetch(`/api/decks?${qs.toString()}`);
    const j = await res.json();
    const docs = (j.docs || []).map((d: any) => ({
      id: d.id, title: d.title, subtitle: d.subtitle, theme: d.theme,
      status: d.status, slideCount: Array.isArray(d.slides) ? d.slides.length : 0, updatedAt: d.updatedAt,
    }));
    return NextResponse.json({ decks: docs });
  } catch {
    return NextResponse.json({ decks: [] });
  }
}

// POST /api/deck — generate a full deck from a prompt (optionally an approved outline).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  try {
    const res = await fetch(`${AI_URL}/studio/deck`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "generation_unavailable" }, { status: 502 });
  }
}
