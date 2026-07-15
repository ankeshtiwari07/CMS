import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/deck/themes — the available deck themes (design systems).
export async function GET() {
  try {
    const res = await fetch(`${AI_URL}/deck/themes`);
    return NextResponse.json(await res.json(), { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ themes: [] }, { status: 502 });
  }
}
