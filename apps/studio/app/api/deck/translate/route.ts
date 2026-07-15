import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/deck/translate — translate a whole deck into a target language.
export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.deck || !body?.lang) return NextResponse.json({ error: "deck and lang are required" }, { status: 400 });
  try {
    const res = await fetch(`${AI_URL}/studio/deck/translate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "translate_unavailable" }, { status: 502 });
  }
}
