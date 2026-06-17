// Agentic content prefill: given a content type + its fields, the drafting
// agent proposes on-brand draft values the author then reviews/edits.
import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!Array.isArray(body?.fields) || !body.fields.length) {
    return NextResponse.json({ error: "No fields to draft" }, { status: 400 });
  }

  // Ground in the active brand (best-effort).
  let brand = "";
  try {
    const r = await payloadFetch(`/api/brandGuidelines?where[isActive][equals]=true&limit=1&depth=0`);
    const j = await r.json();
    const b = j.docs?.[0];
    if (b) brand = `${b.name}${b.summary ? ` — ${b.summary}` : ""}${b.industry ? ` (industry: ${b.industry})` : ""}`;
  } catch {}

  try {
    const res = await fetch(`${AI_URL}/content/suggest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, brand }),
    });
    const d = await res.json();
    if (!res.ok || d.ok === false) {
      return NextResponse.json({ error: d.error || "suggest_failed" }, { status: res.status === 200 ? 502 : res.status });
    }
    return NextResponse.json({ ok: true, data: d.data ?? {} });
  } catch {
    return NextResponse.json({ error: "Could not reach the generation service." }, { status: 502 });
  }
}
