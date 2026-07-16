import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/governance/remediate — auto-fix an artifact to the brand.
export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body?.html) return NextResponse.json({ error: "html is required" }, { status: 400 });
  try {
    const r = await fetch(`${AI_URL}/studio/governance/remediate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return NextResponse.json(await r.json(), { status: r.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "governance_unavailable" }, { status: 502 });
  }
}
