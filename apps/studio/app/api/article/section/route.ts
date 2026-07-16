import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.section) return NextResponse.json({ error: "section is required" }, { status: 400 });
  try { const res = await fetch(`${AI_URL}/studio/content/section`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return NextResponse.json(await res.json(), { status: res.ok ? 200 : 502 }); }
  catch { return NextResponse.json({ error: "generation_unavailable" }, { status: 502 }); }
}
