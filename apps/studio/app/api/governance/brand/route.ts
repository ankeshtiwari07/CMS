import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/governance/brand — the grounded brand profile the Governance Agent reviews against.
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await fetch(`${AI_URL}/studio/governance/brand`, { cache: "no-store" });
    return NextResponse.json(await r.json(), { status: r.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "governance_unavailable" }, { status: 502 });
  }
}
